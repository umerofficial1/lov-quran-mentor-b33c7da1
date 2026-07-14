import { useCallback, useEffect, useRef, useState } from "react";

export type PermissionStatus =
  | "unknown"       // haven't tried / no Permissions API answer yet
  | "prompt"        // will ask on first record
  | "granted"
  | "denied"
  | "unsupported";  // no getUserMedia or insecure context

export type RecorderState = "idle" | "recording" | "paused" | "stopped";

export type Recording = {
  id: string;
  blob: Blob;
  url: string;      // object URL for playback (revoked when the recording is deleted)
  mimeType: string;
  size: number;
  duration: number; // seconds
  createdAt: number;
};

type Options = {
  /** Max recording length in seconds. Auto-stops at this length. */
  maxDurationSec?: number;
  /** Called whenever a new recording is finalized. */
  onRecording?: (r: Recording) => void;
};

// Ordered by quality/compatibility. First supported one wins.
const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const mt of CANDIDATE_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(mt)) return mt;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function extForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return "m4a";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  return "audio";
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Professional voice-recording hook.
 * - Requests mic permission on first record (never in an effect → no loop).
 * - Tracks live permission status via the Permissions API when available.
 * - Feeds a real-time waveform (0..1 amplitude) via AnalyserNode.
 * - Maintains a monotonic elapsed-time timer independent of setInterval drift.
 * - Full lifecycle cleanup: stops tracks, closes AudioContext, revokes blob URLs on unmount.
 */
export function useVoiceRecorder(options: Options = {}) {
  const { maxDurationSec = 60 * 30, onRecording } = options;

  const [supported, setSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<PermissionStatus>("unknown");
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);            // seconds
  const [waveform, setWaveform] = useState<number>(0);  // instantaneous 0..1 amplitude
  const [error, setError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  // Non-reactive refs (don't cause re-renders).
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const pausedAccumRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const mimeRef = useRef<string>("");

  // ── Capability + permission detection ───────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      !!window.isSecureContext &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window.MediaRecorder !== "undefined";
    setSupported(ok);
    if (!ok) {
      setPermission("unsupported");
      return;
    }

    // Ask the Permissions API if available. Not all browsers expose "microphone".
    const nav = navigator as Navigator & {
      permissions?: {
        query: (d: { name: PermissionName }) => Promise<PermissionStatus & PermissionStatusExt>;
      };
    };
    type PermissionStatusExt = {
      state: "granted" | "denied" | "prompt";
      onchange: ((this: unknown, ev: Event) => unknown) | null;
    };
    if (!nav.permissions?.query) {
      setPermission("prompt");
      return;
    }
    let alive = true;
    let statusRef: PermissionStatusExt | null = null;
    const onChange = () => {
      if (!alive || !statusRef) return;
      setPermission(statusRef.state);
    };
    nav.permissions
      .query({ name: "microphone" as PermissionName })
      .then((s) => {
        if (!alive) return;
        statusRef = s as unknown as PermissionStatusExt;
        setPermission(statusRef.state);
        statusRef.onchange = onChange;
      })
      .catch(() => {
        if (alive) setPermission("prompt");
      });
    return () => {
      alive = false;
      if (statusRef) statusRef.onchange = null;
    };
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanupPipeline();
      // Revoke all blob URLs we still hold.
      recordings.forEach((r) => {
        try {
          URL.revokeObjectURL(r.url);
        } catch {
          /* ignore */
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanupPipeline() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    recorderRef.current = null;

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    analyserRef.current = null;

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }

  // ── Timer loop ──────────────────────────────────────────────────────────────
  const tickTimer = useCallback(
    (analyser: AnalyserNode, buf: Uint8Array<ArrayBuffer>) => {
      // Elapsed = wall clock - paused offset.
      const now = performance.now();
      const paused = pausedAccumRef.current + (pausedAtRef.current ? now - pausedAtRef.current : 0);
      const secs = Math.max(0, (now - startedAtRef.current - paused) / 1000);
      setElapsed(secs);

      if (secs >= maxDurationSec) {
        void stop();
        return;
      }

      // Sample the analyser — RMS amplitude in 0..1.
      analyser.getByteTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buf.length);
      setWaveform(rms);

      rafRef.current = requestAnimationFrame(() => tickTimer(analyser, buf));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxDurationSec],
  );

  // ── Public actions ──────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setError(null);
    if (state === "recording" || state === "paused") return;
    if (!supported) {
      setError("Microphone recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setPermission("granted");

      // Analyser for waveform.
      const AC: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // Recorder.
      const mime = pickMimeType();
      mimeRef.current = mime ?? "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
      };
      recorder.onstop = () => {
        finalizeRecording();
      };
      recorderRef.current = recorder;

      // Timer state.
      startedAtRef.current = performance.now();
      pausedAccumRef.current = 0;
      pausedAtRef.current = 0;
      setElapsed(0);
      setWaveform(0);

      recorder.start(250); // emit chunks every 250ms — keeps buffer small
      setState("recording");

      const buf = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      rafRef.current = requestAnimationFrame(() => tickTimer(analyser, buf));
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setPermission("denied");
        setError("Microphone access was denied. Enable it in your browser settings.");
      } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
        setError("No microphone detected on this device.");
      } else if (err?.name === "NotReadableError") {
        setError("Another app is using the microphone. Close it and try again.");
      } else {
        setError(err?.message ?? "Couldn't start recording.");
      }
      cleanupPipeline();
      setState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, supported, tickTimer]);

  const pause = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") return;
    try {
      rec.pause();
      pausedAtRef.current = performance.now();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setState("paused");
    } catch {
      /* ignore */
    }
  }, []);

  const resume = useCallback(() => {
    const rec = recorderRef.current;
    const analyser = analyserRef.current;
    if (!rec || rec.state !== "paused" || !analyser) return;
    try {
      rec.resume();
      if (pausedAtRef.current) {
        pausedAccumRef.current += performance.now() - pausedAtRef.current;
        pausedAtRef.current = 0;
      }
      setState("recording");
      const buf = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      rafRef.current = requestAnimationFrame(() => tickTimer(analyser, buf));
    } catch {
      /* ignore */
    }
  }, [tickTimer]);

  const stop = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === "inactive") return;
    // Request final chunk, then stop. onstop → finalizeRecording.
    try {
      rec.requestData();
    } catch {
      /* not all impls support requestData; ignore */
    }
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setWaveform(0);
    // stream + audio ctx tear-down happens in finalizeRecording after chunks flush
  }, []);

  function finalizeRecording() {
    const chunks = chunksRef.current;
    chunksRef.current = [];
    const mime = mimeRef.current || (chunks[0]?.type ?? "audio/webm");
    const blob = new Blob(chunks, { type: mime });
    const duration = elapsedFromRefs();
    // Reset timer refs.
    pausedAccumRef.current = 0;
    pausedAtRef.current = 0;

    // Tear down capture pipeline (stream + audio context) now that the blob is safe.
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
    try {
      analyserRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    recorderRef.current = null;

    setState("idle");
    setElapsed(0);

    if (blob.size < 200) {
      // Almost certainly a blank / no-audio recording.
      setError("The recording came back empty. Try again and speak closer to the mic.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const rec: Recording = {
      id: makeId(),
      blob,
      url,
      mimeType: mime,
      size: blob.size,
      duration,
      createdAt: Date.now(),
    };
    setRecordings((prev) => [rec, ...prev]);
    onRecording?.(rec);
  }

  function elapsedFromRefs(): number {
    const now = performance.now();
    const paused = pausedAccumRef.current + (pausedAtRef.current ? now - pausedAtRef.current : 0);
    return Math.max(0, (now - startedAtRef.current - paused) / 1000);
  }

  const remove = useCallback((id: string) => {
    setRecordings((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {
          /* ignore */
        }
      }
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const download = useCallback((id: string, filename?: string) => {
    setRecordings((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target) return prev;
      const ext = extForMime(target.mimeType);
      const a = document.createElement("a");
      a.href = target.url;
      a.download = filename ?? `recitation-${new Date(target.createdAt).toISOString().replace(/[:.]/g, "-")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return prev;
    });
  }, []);

  const clearAll = useCallback(() => {
    setRecordings((prev) => {
      prev.forEach((r) => {
        try {
          URL.revokeObjectURL(r.url);
        } catch {
          /* ignore */
        }
      });
      return [];
    });
  }, []);

  return {
    // capability + permission
    supported,
    permission,
    // state
    state,
    elapsed,
    waveform,
    error,
    recordings,
    // actions
    start,
    pause,
    resume,
    stop,
    remove,
    download,
    clearAll,
  } as const;
}
