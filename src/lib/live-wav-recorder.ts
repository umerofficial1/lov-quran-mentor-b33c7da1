export type LiveWavRecorder = {
  stop: () => Promise<void>;
};

export type LiveAudioChunk = {
  blob: Blob;
  speechDetected: boolean;
  level: number;
};

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  const audioWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function encodeMonoWav(input: Float32Array, inputRate: number): LiveAudioChunk | null {
  if (!input.length) return null;

  const outputRate = Math.min(16_000, inputRate);
  const ratio = inputRate / outputRate;
  const outputLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    output[i] = sum / Math.max(1, end - start);
  }

  // Find actual speech rather than uploading several seconds of near-silence.
  // A low absolute threshold still supports quiet phone microphones, while the
  // consecutive-frame requirement prevents fan/static noise being sent as speech.
  const frameSize = Math.max(160, Math.round(outputRate * 0.02));
  const frameRms: number[] = [];
  for (let start = 0; start < output.length; start += frameSize) {
    const end = Math.min(output.length, start + frameSize);
    let power = 0;
    for (let i = start; i < end; i++) power += output[i] * output[i];
    frameRms.push(Math.sqrt(power / Math.max(1, end - start)));
  }
  const sortedRms = [...frameRms].sort((a, b) => a - b);
  const noiseFloor = sortedRms[Math.floor(sortedRms.length * 0.2)] ?? 0;
  const speechThreshold = Math.max(0.0015, noiseFloor * 3.5);
  const activeFrames = frameRms.reduce((count, rms) => count + (rms >= speechThreshold ? 1 : 0), 0);
  const speechDetected = activeFrames >= 8;
  if (!speechDetected) return null;

  let firstActive = frameRms.findIndex((rms) => rms >= speechThreshold);
  let lastActive = frameRms.length - 1;
  while (lastActive >= 0 && frameRms[lastActive] < speechThreshold) lastActive--;
  firstActive = Math.max(0, firstActive - 10);
  lastActive = Math.min(frameRms.length - 1, lastActive + 10);
  const trimmed = output.subarray(
    firstActive * frameSize,
    Math.min(output.length, (lastActive + 1) * frameSize),
  );

  let peak = 0;
  let power = 0;
  for (const sample of trimmed) {
    peak = Math.max(peak, Math.abs(sample));
    power += sample * sample;
  }
  const rms = Math.sqrt(power / Math.max(1, trimmed.length));
  // Lift quiet captures before encoding, without boosting background noise without
  // limit or clipping naturally loud recitation.
  const gain = peak > 0 ? Math.min(12, 0.82 / peak) : 1;

  const buffer = new ArrayBuffer(44 + trimmed.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + trimmed.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, outputRate, true);
  view.setUint32(28, outputRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, trimmed.length * 2, true);

  let offset = 44;
  for (const sample of trimmed) {
    const clamped = Math.max(-1, Math.min(1, sample * gain));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return {
    blob: new Blob([buffer], { type: "audio/wav" }),
    speechDetected,
    level: Math.min(1, rms * gain * 4),
  };
}

export async function startLiveWavRecorder(
  getStream: () => Promise<MediaStream>,
  onChunk: (chunk: LiveAudioChunk) => void | Promise<void>,
  chunkDurationMs = 3200,
): Promise<{ recorder: LiveWavRecorder; stream: MediaStream }> {
  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) throw new DOMException("Web Audio is unavailable", "NotSupportedError");

  const context = new AudioContextClass();
  await context.resume();

  let stream: MediaStream;
  try {
    stream = await getStream();
  } catch (error) {
    await context.close().catch(() => undefined);
    throw error;
  }

  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const mutedOutput = context.createGain();
  mutedOutput.gain.value = 0;

  // Rolling PCM store. Every upload is a complete, independently decodable WAV;
  // only a small tail overlaps clips so words crossing a boundary are retained.
  const MAX_PENDING_SECONDS = 15;
  const OVERLAP_SECONDS = 0.45;
  const pcm: Float32Array[] = [];
  let totalSamples = 0;
  let stopped = false;
  let inFlight = false;
  let dirty = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
    pcm.push(chunk);
    totalSamples += chunk.length;
    dirty = true;
    // Bound memory if the network is temporarily slower than recording.
    const capSamples = MAX_PENDING_SECONDS * context.sampleRate;
    while (totalSamples > capSamples && pcm.length > 1) {
      totalSamples -= pcm[0].length;
      pcm.shift();
    }
  };
  source.connect(processor);
  processor.connect(mutedOutput);
  mutedOutput.connect(context.destination);

  const flush = async () => {
    if (inFlight || !dirty) return;
    dirty = false;
    // Snapshot pending audio and retain only a short boundary overlap.
    const merged = new Float32Array(totalSamples);
    let writeAt = 0;
    for (const c of pcm) {
      merged.set(c, writeAt);
      writeAt += c.length;
    }
    const overlapSamples = Math.min(
      merged.length,
      Math.round(context.sampleRate * OVERLAP_SECONDS),
    );
    const overlap = new Float32Array(merged.subarray(merged.length - overlapSamples));
    pcm.length = 0;
    if (overlap.length) pcm.push(overlap);
    totalSamples = overlap.length;
    const chunk = encodeMonoWav(merged, context.sampleRate);
    if (!chunk || chunk.blob.size < 4096) return;
    inFlight = true;
    try {
      await onChunk(chunk);
    } catch {
      /* ignore */
    } finally {
      inFlight = false;
    }
  };

  const interval = window.setInterval(() => { void flush(); }, chunkDurationMs);
  const recorder: LiveWavRecorder = {
    stop: async () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(interval);
      processor.onaudioprocess = null;
      source.disconnect();
      processor.disconnect();
      mutedOutput.disconnect();
      // Final flush — wait for any in-flight upload, then send the tail.
      while (inFlight) await new Promise((r) => setTimeout(r, 50));
      dirty = true;
      await flush();
      await context.close().catch(() => undefined);
    },
  };

  return { recorder, stream };
}
