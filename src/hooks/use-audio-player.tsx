import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RECITERS, ayahAudioUrl, getReciter, type Reciter } from "@/lib/reciters";
import { getPlayableUrl, precacheAudio, prefetchAudio } from "@/lib/audio-cache";

export type RepeatMode = "none" | "ayah" | "page" | "surah";

export type QueueItem = {
  surah: number;
  ayah: number;
  page?: number | null;
};

type CachingState = { active: boolean; done: number; total: number };

type AudioAPI = {
  // state
  queue: QueueItem[];
  currentIndex: number;
  currentKey: string | null; // "s:a"
  playing: boolean;
  loading: boolean;
  buffering: boolean;
  currentTime: number;
  duration: number;
  reciter: Reciter;
  playbackRate: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  autoScroll: boolean;
  caching: CachingState;
  // actions
  loadQueue: (items: QueueItem[], startIndex?: number, autoplay?: boolean) => Promise<void>;
  playIndex: (i: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  stop: () => void;
  seek: (t: number) => void;
  seekPct: (p: number) => void;
  setReciter: (id: string) => void;
  setPlaybackRate: (v: number) => void;
  setVolume: (v: number) => void;
  setMuted: (v: boolean) => void;
  setRepeat: (m: RepeatMode) => void;
  setAutoScroll: (v: boolean) => void;
  cacheQueue: () => Promise<void>;
};

const Ctx = createContext<AudioAPI | null>(null);
// Lightweight context for high-frequency read of "which verse is playing".
// VerseCard subscribes only to this, avoiding re-renders on every timeupdate tick.
const CurrentKeyCtx = createContext<{ currentKey: string | null; playing: boolean }>({
  currentKey: null,
  playing: false,
});

const PREFS_KEY = "vwm.audio.prefs.v2";
type Prefs = {
  reciterId: string;
  playbackRate: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  autoScroll: boolean;
};
const DEFAULT_PREFS: Prefs = {
  reciterId: "alafasy",
  playbackRate: 1,
  volume: 1,
  muted: false,
  repeat: "none",
  autoScroll: true,
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Monotonic token — every load increments. Older async loads compare and bail
  // out if a newer load has started, preventing overlap / duplicate playback.
  const genRef = useRef(0);
  // Last object URL created via createObjectURL — revoked when replaced.
  const lastObjectUrlRef = useRef<string | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [caching, setCaching] = useState<CachingState>({ active: false, done: 0, total: 0 });

  // repeat-ayah latch so a single ayah gets replayed exactly once before advancing
  const repeatAyahLatchRef = useRef(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const reciter = useMemo(() => getReciter(prefs.reciterId), [prefs.reciterId]);

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  // Create the audio element once (client only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio();
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    audioRef.current = a;
    return () => {
      a.pause();
      a.removeAttribute("src");
      a.load();
      audioRef.current = null;
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  // Sync prefs → audio element.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = prefs.playbackRate;
    a.volume = prefs.volume;
    a.muted = prefs.muted;
  }, [prefs.playbackRate, prefs.volume, prefs.muted]);

  const currentItem = currentIndex >= 0 ? queue[currentIndex] : null;
  const currentKey = currentItem ? `${currentItem.surah}:${currentItem.ayah}` : null;

  const scrollToCurrent = useCallback(() => {
    if (!prefs.autoScroll || !currentItem) return;
    if (typeof document === "undefined") return;
    const el = document.getElementById(`v-${currentItem.surah}-${currentItem.ayah}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [prefs.autoScroll, currentItem]);

  const revokePrevObjectUrl = useCallback(() => {
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
  }, []);

  // Core loader — token-guarded, works from any queue snapshot to avoid stale closures.
  const loadAndPlayAt = useCallback(
    async (items: QueueItem[], i: number, activeReciter: Reciter) => {
      const a = audioRef.current;
      const item = items[i];
      if (!a || !item) return;

      const myGen = ++genRef.current;
      setLoading(true);
      setBuffering(true);
      setCurrentIndex(i);
      setCurrentTime(0);
      setDuration(0);

      // Cancel current playback cleanly before swapping src (prevents overlap).
      try {
        a.pause();
      } catch {
        /* ignore */
      }

      const raw = ayahAudioUrl(activeReciter, item.surah, item.ayah);
      let src: string;
      try {
        src = await getPlayableUrl(raw);
      } catch {
        src = raw;
      }
      if (myGen !== genRef.current) return; // superseded

      // Revoke previous blob before installing new one.
      revokePrevObjectUrl();
      if (src.startsWith("blob:")) lastObjectUrlRef.current = src;

      a.src = src;
      a.playbackRate = prefs.playbackRate;
      a.volume = prefs.volume;
      a.muted = prefs.muted;

      try {
        await a.play();
      } catch {
        /* autoplay may be blocked — leave paused */
      }
      if (myGen !== genRef.current) return;
      setLoading(false);

      // Prefetch the NEXT ayah in the background so the transition is gapless.
      const nextI = i + 1;
      if (nextI < items.length) {
        const nextItem = items[nextI];
        const nextUrl = ayahAudioUrl(activeReciter, nextItem.surah, nextItem.ayah);
        void prefetchAudio(nextUrl);
      }
    },
    [prefs.playbackRate, prefs.volume, prefs.muted, revokePrevObjectUrl],
  );

  const playIndex = useCallback(
    (i: number) => loadAndPlayAt(queue, i, reciter),
    [loadAndPlayAt, queue, reciter],
  );

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.src && queue.length && currentIndex < 0) {
      await loadAndPlayAt(queue, 0, reciter);
      return;
    }
    if (a.src) {
      try {
        await a.play();
      } catch {
        /* ignore */
      }
    }
  }, [queue, currentIndex, loadAndPlayAt, reciter]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) await play();
    else a.pause();
  }, [play]);

  const nextIndex = useCallback(
    (from: number): number | null => {
      if (from < 0 || from >= queue.length) return null;
      const cur = queue[from];
      if (prefs.repeat === "ayah" && !repeatAyahLatchRef.current) {
        repeatAyahLatchRef.current = true;
        return from;
      }
      repeatAyahLatchRef.current = false;
      const nxt = from + 1;
      if (nxt < queue.length) {
        if (prefs.repeat === "page" && cur.page != null && queue[nxt].page !== cur.page) {
          const firstOnPage = queue.findIndex((q) => q.page === cur.page);
          return firstOnPage >= 0 ? firstOnPage : null;
        }
        return nxt;
      }
      if (prefs.repeat === "surah") return 0;
      if (prefs.repeat === "page" && cur.page != null) {
        const firstOnPage = queue.findIndex((q) => q.page === cur.page);
        return firstOnPage >= 0 ? firstOnPage : null;
      }
      return null;
    },
    [queue, prefs.repeat],
  );

  const next = useCallback(async () => {
    const i = currentIndex < 0 ? 0 : nextIndex(currentIndex);
    if (i == null) {
      audioRef.current?.pause();
      return;
    }
    await loadAndPlayAt(queue, i, reciter);
  }, [currentIndex, nextIndex, loadAndPlayAt, queue, reciter]);

  const prev = useCallback(async () => {
    if (currentIndex <= 0) return;
    await loadAndPlayAt(queue, currentIndex - 1, reciter);
  }, [currentIndex, loadAndPlayAt, queue, reciter]);

  const stop = useCallback(() => {
    genRef.current++; // invalidate any in-flight loads
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    revokePrevObjectUrl();
    setPlaying(false);
    setBuffering(false);
    setLoading(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    setCurrentIndex(-1);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "none";
        navigator.mediaSession.metadata = null;
      } catch {
        /* ignore */
      }
    }
  }, [revokePrevObjectUrl]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(t)) return;
    try {
      a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    } catch {
      /* ignore */
    }
  }, []);

  const seekPct = useCallback((p: number) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const clamped = Math.max(0, Math.min(1, p));
    try {
      a.currentTime = a.duration * clamped;
    } catch {
      /* ignore */
    }
  }, []);

  // Attach audio element listeners.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);
    const onTime = () => setCurrentTime(a.currentTime);
    const onLoaded = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onDuration = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onEnded = async () => {
      const i = nextIndex(currentIndex);
      if (i == null) {
        setPlaying(false);
        return;
      }
      await loadAndPlayAt(queue, i, reciter);
    };
    const onError = () => {
      setBuffering(false);
      setLoading(false);
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("canplay", onCanPlay);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("durationchange", onDuration);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("durationchange", onDuration);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
  }, [currentIndex, nextIndex, loadAndPlayAt, queue, reciter]);

  // Auto-scroll on verse change.
  useEffect(() => {
    scrollToCurrent();
  }, [scrollToCurrent, currentIndex]);

  // Media Session API for background/lock-screen controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (currentItem) {
      try {
        ms.metadata = new MediaMetadata({
          title: `Surah ${currentItem.surah} · Ayah ${currentItem.ayah}`,
          artist: reciter.name,
          album: "Verse Wise Mentor",
        });
      } catch {
        /* ignore */
      }
    }
    const setH = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* not supported */
      }
    };
    setH("play", () => {
      void play();
    });
    setH("pause", () => pause());
    setH("previoustrack", () => {
      void prev();
    });
    setH("nexttrack", () => {
      void next();
    });
    setH("stop", () => stop());
    setH("seekto", (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
    setH("seekbackward", (details) => {
      const a = audioRef.current;
      if (a) seek(a.currentTime - (details.seekOffset ?? 5));
    });
    setH("seekforward", (details) => {
      const a = audioRef.current;
      if (a) seek(a.currentTime + (details.seekOffset ?? 5));
    });
    return () => {
      setH("play", null);
      setH("pause", null);
      setH("previoustrack", null);
      setH("nexttrack", null);
      setH("stop", null);
      setH("seekto", null);
      setH("seekbackward", null);
      setH("seekforward", null);
    };
  }, [currentItem, reciter, play, pause, prev, next, stop, seek]);

  // Report playback state + position to MediaSession (lock-screen scrubber).
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {
      /* ignore */
    }
  }, [playing]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState?.({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: prefs.playbackRate,
      });
    } catch {
      /* ignore */
    }
  }, [currentTime, duration, prefs.playbackRate]);

  const loadQueue = useCallback(
    async (items: QueueItem[], startIndex = 0, autoplay = true) => {
      genRef.current++; // invalidate anything mid-flight
      setQueue(items);
      setCurrentIndex(-1);
      repeatAyahLatchRef.current = false;
      if (autoplay && items.length) {
        await loadAndPlayAt(items, startIndex, reciter);
      } else if (items.length) {
        setCurrentIndex(startIndex);
      }
    },
    [loadAndPlayAt, reciter],
  );

  const cacheQueue = useCallback(async () => {
    if (!queue.length) return;
    const urls = queue.map((q) => ayahAudioUrl(reciter, q.surah, q.ayah));
    setCaching({ active: true, done: 0, total: urls.length });
    await precacheAudio(urls, (done, total) => setCaching({ active: true, done, total }));
    setCaching({ active: false, done: urls.length, total: urls.length });
  }, [queue, reciter]);

  const value: AudioAPI = {
    queue,
    currentIndex,
    currentKey,
    playing,
    loading,
    buffering,
    currentTime,
    duration,
    reciter,
    playbackRate: prefs.playbackRate,
    volume: prefs.volume,
    muted: prefs.muted,
    repeat: prefs.repeat,
    autoScroll: prefs.autoScroll,
    caching,
    loadQueue,
    playIndex,
    play,
    pause,
    toggle,
    next,
    prev,
    stop,
    seek,
    seekPct,
    setReciter: (id) => updatePrefs({ reciterId: id }),
    setPlaybackRate: (v) => updatePrefs({ playbackRate: v }),
    setVolume: (v) => updatePrefs({ volume: Math.max(0, Math.min(1, v)), muted: v === 0 ? true : false }),
    setMuted: (v) => updatePrefs({ muted: v }),
    setRepeat: (m) => updatePrefs({ repeat: m }),
    setAutoScroll: (v) => updatePrefs({ autoScroll: v }),
    cacheQueue,
  };

  const keyValue = useMemo(() => ({ currentKey, playing }), [currentKey, playing]);

  return (
    <Ctx.Provider value={value}>
      <CurrentKeyCtx.Provider value={keyValue}>{children}</CurrentKeyCtx.Provider>
    </Ctx.Provider>
  );
}

export function useCurrentVerseKey() {
  return useContext(CurrentKeyCtx);
}

export function useAudioPlayer(): AudioAPI {
  const v = useContext(Ctx);
  if (!v) {
    // No-op fallback so components can render outside provider without crashing.
    return {
      queue: [],
      currentIndex: -1,
      currentKey: null,
      playing: false,
      loading: false,
      buffering: false,
      currentTime: 0,
      duration: 0,
      reciter: RECITERS[1],
      playbackRate: 1,
      volume: 1,
      muted: false,
      repeat: "none",
      autoScroll: true,
      caching: { active: false, done: 0, total: 0 },
      loadQueue: async () => {},
      playIndex: async () => {},
      play: async () => {},
      pause: () => {},
      toggle: async () => {},
      next: async () => {},
      prev: async () => {},
      stop: () => {},
      seek: () => {},
      seekPct: () => {},
      setReciter: () => {},
      setPlaybackRate: () => {},
      setVolume: () => {},
      setMuted: () => {},
      setRepeat: () => {},
      setAutoScroll: () => {},
      cacheQueue: async () => {},
    };
  }
  return v;
}
