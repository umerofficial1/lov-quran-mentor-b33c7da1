export type LiveWavRecorder = {
  stop: () => Promise<void>;
};

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  const audioWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function encodeMonoWav(input: Float32Array, inputRate: number): Blob | null {
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

  let peak = 0;
  for (const sample of output) peak = Math.max(peak, Math.abs(sample));
  if (peak < 0.0004) return null;

  const buffer = new ArrayBuffer(44 + output.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + output.length * 2, true);
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
  view.setUint32(40, output.length * 2, true);

  let offset = 44;
  for (const sample of output) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function startLiveWavRecorder(
  getStream: () => Promise<MediaStream>,
  onChunk: (blob: Blob) => void | Promise<void>,
  chunkDurationMs = 2200,
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

  // Cumulative PCM store — keeps the ENTIRE recording so each upload contains
  // full context. gpt-4o-transcribe returns noise on isolated <1s Arabic clips
  // but is accurate over the full utterance. Cap at ~4 min to bound memory.
  const MAX_SECONDS = 240;
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
    // Drop oldest audio if we exceed the cap.
    const capSamples = MAX_SECONDS * context.sampleRate;
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
    // Merge all captured PCM into one Float32Array.
    const merged = new Float32Array(totalSamples);
    let writeAt = 0;
    for (const c of pcm) {
      merged.set(c, writeAt);
      writeAt += c.length;
    }
    const wav = encodeMonoWav(merged, context.sampleRate);
    if (!wav || wav.size < 4096) return;
    inFlight = true;
    try {
      await onChunk(wav);
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
