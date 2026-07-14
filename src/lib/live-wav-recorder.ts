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

function encodeMonoWav(chunks: Float32Array[], inputRate: number): Blob | null {
  const inputLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  if (!inputLength) return null;

  const input = new Float32Array(inputLength);
  let writeAt = 0;
  for (const chunk of chunks) {
    input.set(chunk, writeAt);
    writeAt += chunk.length;
  }

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
  chunkDurationMs = 700,
): Promise<{ recorder: LiveWavRecorder; stream: MediaStream }> {
  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) throw new DOMException("Web Audio is unavailable", "NotSupportedError");

  // Create/resume during the click gesture. iOS suspends contexts created after
  // awaiting the permission prompt.
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

  let pcm: Float32Array[] = [];
  let stopped = false;
  let uploadQueue = Promise.resolve();

  processor.onaudioprocess = (event) => {
    if (!stopped) pcm.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(mutedOutput);
  mutedOutput.connect(context.destination);

  const flush = () => {
    const current = pcm;
    pcm = [];
    const wav = encodeMonoWav(current, context.sampleRate);
    if (!wav || wav.size < 2048) return;
    uploadQueue = uploadQueue.then(() => onChunk(wav)).catch(() => undefined);
  };

  const interval = window.setInterval(flush, chunkDurationMs);
  const recorder: LiveWavRecorder = {
    stop: async () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(interval);
      flush();
      processor.onaudioprocess = null;
      source.disconnect();
      processor.disconnect();
      mutedOutput.disconnect();
      await context.close().catch(() => undefined);
      await uploadQueue;
    },
  };

  return { recorder, stream };
}