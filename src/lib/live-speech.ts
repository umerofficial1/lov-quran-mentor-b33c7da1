// Web Speech API wrapper for near-instant Arabic recitation tracking.
// Emits interim + final transcripts as the user speaks — no 1s chunk latency.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LiveSpeechHandle {
  stop: () => void;
  supported: boolean;
}

export interface LiveSpeechCallbacks {
  onTranscript: (fullText: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

export function startLiveSpeech(
  { onTranscript, onError, onEnd }: LiveSpeechCallbacks,
  lang: string = "ar-SA",
): LiveSpeechHandle {
  const SR: any =
    (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
    null;
  if (!SR) {
    return { stop: () => {}, supported: false };
  }

  const rec = new SR();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalText = "";
  let stopped = false;

  rec.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const t = r[0]?.transcript ?? "";
      if (r.isFinal) {
        finalText = (finalText + " " + t).trim();
      } else {
        interim += t + " ";
      }
    }
    const combined = (finalText + " " + interim).trim();
    onTranscript(combined, interim.length === 0);
  };

  rec.onerror = (e: any) => {
    onError?.(e?.error ?? "speech-error");
  };

  rec.onend = () => {
    // Auto-restart if we didn't intentionally stop (some browsers cut off after ~60s).
    if (!stopped) {
      try {
        rec.start();
        return;
      } catch {
        // ignore
      }
    }
    onEnd?.();
  };

  try {
    rec.start();
  } catch (err) {
    onError?.((err as Error)?.message ?? "start-failed");
  }

  return {
    supported: true,
    stop: () => {
      stopped = true;
      try { rec.stop(); } catch { /* ignore */ }
    },
  };
}
