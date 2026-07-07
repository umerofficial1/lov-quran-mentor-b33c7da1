import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RECITERS, ayahAudioUrl, getReciter, type Reciter } from "@/lib/reciters";
import { getPlayableUrl, precacheAudio } from "@/lib/audio-cache";

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
  reciter: Reciter;
  playbackRate: number;
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
  setReciter: (id: string) => void;
  setPlaybackRate: (v: number) => void;
  setRepeat: (m: RepeatMode) => void;
  setAutoScroll: (v: boolean) => void;
  cacheQueue: () => Promise<void>;
};

const Ctx = createContext<AudioAPI | null>(null);

const PREFS_KEY = "vwm.audio.prefs.v1";
type Prefs = {
  reciterId: string;
  playbackRate: number;
  repeat: RepeatMode;
  autoScroll: boolean;
};
const DEFAULT_PREFS: Prefs = {
  reciterId: "alafasy",
  playbackRate: 1,
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [caching, setCaching] = useState<CachingState>({ active: false, done: 0, total: 0 });

  // repeat-ayah counter so a single ayah gets replayed exactly once per press before advancing
  const repeatAyahLatchRef = useRef(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const reciter = useMemo(() => getReciter(prefs.reciterId), [prefs.reciterId]);

  const updatePrefs = (patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      savePrefs(next);
      return next;
    });
  };

  // Create the audio element once (client only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio();
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
  }, []);

  // Sync playbackRate.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = prefs.playbackRate;
  }, [prefs.playbackRate]);

  const currentItem = currentIndex >= 0 ? queue[currentIndex] : null;
  const currentKey = currentItem ? `${currentItem.surah}:${currentItem.ayah}` : null;

  const scrollToCurrent = useCallback(() => {
    if (!prefs.autoScroll || !currentItem) return;
    if (typeof document === "undefined") return;
    const el = document.getElementById(`v-${currentItem.surah}-${currentItem.ayah}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [prefs.autoScroll, currentItem]);

  const loadAndPlay = useCallback(
    async (i: number) => {
      const a = audioRef.current;
      if (!a) return;
      const item = queue[i];
      if (!item) return;
      setLoading(true);
      setCurrentIndex(i);
      const raw = ayahAudioUrl(reciter, item.surah, item.ayah);
      const src = await getPlayableUrl(raw);
      a.src = src;
      a.playbackRate = prefs.playbackRate;
      try {
        await a.play();
      } catch {
        /* autoplay blocked; leave paused */
      } finally {
        setLoading(false);
      }
    },
    [queue, reciter, prefs.playbackRate],
  );

  const playIndex = useCallback((i: number) => loadAndPlay(i), [loadAndPlay]);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.src && queue.length && currentIndex < 0) {
      await loadAndPlay(0);
      return;
    }
    if (a.src) {
      try { await a.play(); } catch { /* ignore */ }
    }
  }, [queue.length, currentIndex, loadAndPlay]);

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
          // hit end of page: jump back to first ayah on this page
          const firstOnPage = queue.findIndex((q) => q.page === cur.page);
          return firstOnPage >= 0 ? firstOnPage : null;
        }
        return nxt;
      }
      // end of queue
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
    await loadAndPlay(i);
  }, [currentIndex, nextIndex, loadAndPlay]);

  const prev = useCallback(async () => {
    if (currentIndex <= 0) return;
    await loadAndPlay(currentIndex - 1);
  }, [currentIndex, loadAndPlay]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setPlaying(false);
  }, []);

  // Attach audio element listeners.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = async () => {
      const i = nextIndex(currentIndex);
      if (i == null) {
        setPlaying(false);
        return;
      }
      await loadAndPlay(i);
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [currentIndex, nextIndex, loadAndPlay]);

  // Auto-scroll on verse change.
  useEffect(() => { scrollToCurrent(); }, [scrollToCurrent, currentIndex]);

  // Media Session API for background/lock-screen controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (currentItem) {
      ms.metadata = new MediaMetadata({
        title: `Surah ${currentItem.surah} · Ayah ${currentItem.ayah}`,
        artist: reciter.name,
        album: "Verse Wise Mentor",
      });
    }
    ms.setActionHandler("play", () => { void play(); });
    ms.setActionHandler("pause", () => pause());
    ms.setActionHandler("previoustrack", () => { void prev(); });
    ms.setActionHandler("nexttrack", () => { void next(); });
    return () => {
      try {
        ms.setActionHandler("play", null);
        ms.setActionHandler("pause", null);
        ms.setActionHandler("previoustrack", null);
        ms.setActionHandler("nexttrack", null);
      } catch { /* ignore */ }
    };
  }, [currentItem, reciter, play, pause, prev, next]);

  const loadQueue = useCallback(
    async (items: QueueItem[], startIndex = 0, autoplay = true) => {
      setQueue(items);
      setCurrentIndex(-1);
      repeatAyahLatchRef.current = false;
      if (autoplay && items.length) {
        // wait a tick so state settles before calling loadAndPlay against new queue
        setTimeout(() => { void playIndexAt(items, startIndex); }, 0);
      } else if (items.length) {
        setCurrentIndex(startIndex);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reciter],
  );

  // Play a specific index inside a caller-supplied queue (avoids stale closure).
  const playIndexAt = useCallback(
    async (items: QueueItem[], i: number) => {
      const a = audioRef.current;
      const item = items[i];
      if (!a || !item) return;
      setLoading(true);
      setCurrentIndex(i);
      const raw = ayahAudioUrl(reciter, item.surah, item.ayah);
      const src = await getPlayableUrl(raw);
      a.src = src;
      a.playbackRate = prefs.playbackRate;
      try { await a.play(); } catch { /* ignore */ }
      setLoading(false);
    },
    [reciter, prefs.playbackRate],
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
    reciter,
    playbackRate: prefs.playbackRate,
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
    setReciter: (id) => updatePrefs({ reciterId: id }),
    setPlaybackRate: (v) => updatePrefs({ playbackRate: v }),
    setRepeat: (m) => updatePrefs({ repeat: m }),
    setAutoScroll: (v) => updatePrefs({ autoScroll: v }),
    cacheQueue,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudioPlayer(): AudioAPI {
  const v = useContext(Ctx);
  if (!v) {
    // Provide a no-op fallback so components can render outside the provider
    // (e.g. during SSR of a route not wrapped yet). This should not happen once
    // provider is at the root, but is defensive.
    return {
      queue: [], currentIndex: -1, currentKey: null, playing: false, loading: false,
      reciter: RECITERS[1], playbackRate: 1, repeat: "none", autoScroll: true,
      caching: { active: false, done: 0, total: 0 },
      loadQueue: async () => {}, playIndex: async () => {}, play: async () => {},
      pause: () => {}, toggle: async () => {}, next: async () => {}, prev: async () => {},
      stop: () => {}, setReciter: () => {}, setPlaybackRate: () => {}, setRepeat: () => {},
      setAutoScroll: () => {}, cacheQueue: async () => {},
    };
  }
  return v;
}
