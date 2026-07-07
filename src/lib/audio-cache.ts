const CACHE_NAME = "vwm-quran-audio-v1";

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

/** Precache a batch of audio URLs. Reports (done, total, url) as it goes. */
export async function precacheAudio(
  urls: string[],
  onProgress?: (done: number, total: number, url: string) => void,
): Promise<{ ok: number; failed: number }> {
  const cache = await openCache();
  if (!cache) return { ok: 0, failed: urls.length };
  let ok = 0;
  let failed = 0;
  const total = urls.length;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const existing = await cache.match(url);
      if (!existing) {
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) {
          await cache.put(url, res.clone());
          ok += 1;
        } else {
          failed += 1;
        }
      } else {
        ok += 1;
      }
    } catch {
      failed += 1;
    }
    onProgress?.(i + 1, total, url);
  }
  return { ok, failed };
}

/** Resolve to a playable URL: prefer cached blob (object URL) so playback works offline. */
export async function getPlayableUrl(url: string): Promise<string> {
  const cache = await openCache();
  if (!cache) return url;
  try {
    const hit = await cache.match(url);
    if (hit) {
      const blob = await hit.blob();
      return URL.createObjectURL(blob);
    }
  } catch {
    /* ignore */
  }
  return url;
}

export async function clearAudioCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    /* ignore */
  }
}

export async function cachedCount(): Promise<number> {
  const cache = await openCache();
  if (!cache) return 0;
  try {
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}
