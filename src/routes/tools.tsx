import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { qiblaBearing } from "@/lib/qibla";
import { Compass, MapPin, RotateCcw, Plus, Minus, Heart } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Prayer Times, Qibla & Tasbeeh — Verse Wise Mentor" },
      { name: "description", content: "Live prayer times, accurate Qibla direction, tasbeeh counter and a daily du'a — calculated from your location, private by default." },
      { property: "og:title", content: "Prayer Times, Qibla & Tasbeeh — Verse Wise Mentor" },
      { property: "og:description", content: "Everyday Islamic tools — prayer, qibla, dhikr and du'a — in one place." },
    ],
  }),
  component: () => (<RequireAuth><ToolsPage /></RequireAuth>),
});

type Coords = { lat: number; lng: number };

const DUAS = [
  { ar: "اللّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى", tr: "O Allah, I ask You for guidance, piety, chastity and self-sufficiency." },
  { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", tr: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire." },
  { ar: "اللّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", tr: "O Allah, help me to remember You, to thank You, and to worship You in the best way." },
  { ar: "حَسْبُنَا اللّهُ وَنِعْمَ الْوَكِيلُ", tr: "Sufficient for us is Allah, and He is the best Disposer of affairs." },
  { ar: "اللّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", tr: "O Allah, I seek refuge in You from anxiety and grief." },
];

const DHIKR = [
  { label: "سُبْحَانَ اللّٰه", goal: 33 },
  { label: "الْحَمْدُ لِلّٰه", goal: 33 },
  { label: "اللّٰهُ أَكْبَر", goal: 34 },
  { label: "لَا إِلٰهَ إِلَّا اللّٰه", goal: 100 },
  { label: "أَسْتَغْفِرُ اللّٰه", goal: 100 },
];

function ToolsPage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState<string>("");
  const [activeCity, setActiveCity] = useState<string>("");
  const [locating, setLocating] = useState(false);

  const requestLocation = () => {
    setGeoErr(null);
    if (!("geolocation" in navigator)) {
      setGeoErr("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setActiveCity("");
        setLocating(false);
      },
      (e) => {
        setGeoErr(e.message || "Location permission denied");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60_000, enableHighAccuracy: true },
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCity = localStorage.getItem("vw:prayer-city");
    if (savedCity) {
      setActiveCity(savedCity);
      setManualCity(savedCity);
      return;
    }
    requestLocation();
  }, []);

  const submitCity = (e: React.FormEvent) => {
    e.preventDefault();
    const c = manualCity.trim();
    if (!c) return;
    setActiveCity(c);
    setCoords(null);
    setGeoErr(null);
    localStorage.setItem("vw:prayer-city", c);
  };

  const dua = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    return DUAS[day % DUAS.length];
  }, []);

  return (
    <div className="min-h-dvh pb-28 md:pb-12">
      <SiteNav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <header className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Compass className="size-3" /> Islamic Tools
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-3">Prayer • Qibla • Tasbeeh • Du'a</h1>
          <p className="text-slate-400 text-sm mt-2">Calculated live from your location — or a city you choose.</p>
        </header>

        <section className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <button
            onClick={requestLocation}
            disabled={locating}
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-[#1FB6B0] hover:bg-[#0E7A7A] text-[#070C1F] text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <MapPin className="size-4" /> {locating ? "Locating…" : "Use my location"}
          </button>
          <form onSubmit={submitCity} className="flex-1 flex gap-2">
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Or enter a city (e.g. Karachi, London, Cairo)"
              className="flex-1 min-h-11 px-4 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#C9A24C]/60"
              aria-label="City name"
            />
            <button
              type="submit"
              className="min-h-11 px-4 rounded-xl bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] text-sm font-semibold transition-colors"
            >
              Set city
            </button>
          </form>
        </section>

        {geoErr && !activeCity && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-4 text-amber-100 text-sm text-center">
            {geoErr}. Allow location, or enter your city above to see accurate prayer times and Qibla.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrayerTimes coords={coords} city={activeCity} />
          <QiblaCompass coords={coords} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Tasbeeh />
          <DuaCard ar={dua.ar} tr={dua.tr} />
        </div>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}


/* ---------------- Prayer Times ---------------- */

type AladhanResp = {
  data: {
    timings: Record<string, string>;
    date: { readable: string; hijri: { date: string; month: { en: string }; year: string } };
    meta: { timezone: string };
  };
};

function PrayerTimes({ coords, city }: { coords: Coords | null; city: string }) {
  const query = useQuery({
    queryKey: ["aladhan", coords?.lat, coords?.lng, city],
    enabled: !!coords || !!city,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<AladhanResp["data"]> => {
      const today = new Date();
      const d = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const url = city
        ? `https://api.aladhan.com/v1/timingsByAddress/${d}?address=${encodeURIComponent(city)}&method=2`
        : `https://api.aladhan.com/v1/timings/${d}?latitude=${coords!.lat}&longitude=${coords!.lng}&method=2`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load prayer times");
      const json = (await res.json()) as AladhanResp;
      return json.data;
    },
  });


  const order = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const activeIdx = useMemo(() => {
    if (!query.data) return -1;
    const mins = order.map((k) => {
      const [h, m] = (query.data!.timings[k] ?? "00:00").split(":").map(Number);
      return h * 60 + m;
    });
    let i = -1;
    for (let k = 0; k < mins.length; k++) if (minutesNow >= mins[k]) i = k;
    return i;
  }, [query.data, minutesNow]);

  return (
    <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Prayer Times</h2>
          {query.data && (
            <p className="text-xs text-slate-400 mt-1">
              {query.data.date.readable} • {query.data.date.hijri.date} {query.data.date.hijri.month.en} {query.data.date.hijri.year}
            </p>
          )}
        </div>
        <MapPin className="size-5 text-amber-400" />
      </div>

      {!coords && !city && <p className="text-slate-400 text-sm">Allow location or set a city above to see prayer times.</p>}
      {city && !coords && <p className="text-xs text-emerald-300 mb-2">Showing times for <span className="font-semibold">{city}</span></p>}
      {query.isLoading && <p className="text-slate-400 text-sm">Loading prayer times…</p>}
      {query.error && <p className="text-red-400 text-sm">Couldn't load times. Please retry.</p>}

      {query.data && (
        <ul className="space-y-1">
          {order.map((name, i) => {
            const time = query.data!.timings[name];
            const active = i === activeIdx;
            return (
              <li
                key={name}
                className={
                  active
                    ? "flex justify-between items-center p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30"
                    : "flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-colors"
                }
              >
                <span className={active ? "text-sm font-bold text-emerald-300" : "text-sm text-slate-300"}>{name}</span>
                <span className="text-sm font-bold text-white">{time}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Qibla ---------------- */

function QiblaCompass({ coords }: { coords: Coords | null }) {
  const bearing = coords ? qiblaBearing(coords.lat, coords.lng) : null;
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const h = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof h === "number") setHeading(h);
      else if (e.alpha != null) setHeading(360 - e.alpha);
    };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, []);

  const needle = bearing != null ? (heading != null ? bearing - heading : bearing) : 0;

  const requestPermission = async () => {
    type IOSOrientationEvent = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    const dev = DeviceOrientationEvent as IOSOrientationEvent;
    if (typeof dev.requestPermission === "function") {
      try { await dev.requestPermission(); } catch { /* user declined */ }
    }
  };

  return (
    <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">Qibla Direction</h2>
        <button onClick={requestPermission} className="text-xs text-amber-300 hover:text-amber-200 font-semibold">
          Enable compass
        </button>
      </div>
      <div className="relative mx-auto size-56 rounded-full border-2 border-white/10 grid place-items-center bg-gradient-to-br from-emerald-950/60 to-black/40">
        {["N", "E", "S", "W"].map((d, i) => (
          <span key={d} className="absolute text-[10px] font-bold text-slate-500 uppercase" style={{
            top: i === 0 ? 8 : i === 2 ? "auto" : "50%",
            bottom: i === 2 ? 8 : "auto",
            left: i === 3 ? 8 : i === 1 ? "auto" : "50%",
            right: i === 1 ? 8 : "auto",
            transform: i % 2 === 0 ? "translateX(-50%)" : "translateY(-50%)",
          }}>{d}</span>
        ))}
        <div
          className="absolute inset-0 grid place-items-center transition-transform duration-500"
          style={{ transform: `rotate(${needle}deg)` }}
        >
          <div className="flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[60px] border-transparent border-b-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
            <div className="w-2 h-12 bg-white/20 -mt-1 rounded" />
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-slate-300 mt-4">
        {bearing == null ? "Waiting for location…" : (
          <>Qibla is at <span className="font-bold text-amber-300">{bearing.toFixed(1)}°</span> from North</>
        )}
      </p>
      {heading == null && (
        <p className="text-center text-xs text-slate-500 mt-1">Tip: enable compass to see live direction (works best on mobile).</p>
      )}
    </section>
  );
}

/* ---------------- Tasbeeh ---------------- */

function Tasbeeh() {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const dhikr = DHIKR[idx];
  const pct = Math.min(100, Math.round((count / dhikr.goal) * 100));

  const inc = () => {
    setCount((c) => {
      const next = c + 1;
      if (next === dhikr.goal && "vibrate" in navigator) navigator.vibrate?.(80);
      return next;
    });
  };

  return (
    <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Tasbeeh Counter</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setIdx((i) => (i - 1 + DHIKR.length) % DHIKR.length); setCount(0); }}
            className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 grid place-items-center"
            aria-label="Previous dhikr"
          ><Minus className="size-4" /></button>
          <button
            onClick={() => { setIdx((i) => (i + 1) % DHIKR.length); setCount(0); }}
            className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 grid place-items-center"
            aria-label="Next dhikr"
          ><Plus className="size-4" /></button>
        </div>
      </div>
      <p className="text-3xl text-center text-amber-200 font-arabic" dir="rtl">{dhikr.label}</p>
      <p className="text-center text-xs text-slate-500 mt-1">Goal: {dhikr.goal}</p>

      <button
        onClick={inc}
        className="mt-6 mx-auto block size-40 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-5xl font-bold shadow-[0_0_40px_rgba(5,150,105,0.5)] border-4 border-emerald-400/30 active:scale-95 transition-transform"
        aria-label="Increment count"
      >
        {count}
      </button>
      <div className="mt-5 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <button
        onClick={() => setCount(0)}
        className="mt-4 mx-auto flex items-center gap-2 text-xs text-slate-400 hover:text-white"
      >
        <RotateCcw className="size-3" /> Reset
      </button>
    </section>
  );
}

/* ---------------- Du'a ---------------- */

function DuaCard({ ar, tr }: { ar: string; tr: string }) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-emerald-900/50 to-black/40 backdrop-blur-xl border border-amber-400/20 p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="size-4 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Du'a of the Day</h2>
      </div>
      <p className="text-2xl text-white font-arabic text-right leading-loose" dir="rtl">{ar}</p>
      <p className="text-sm text-slate-300 mt-4 italic">{tr}</p>
    </section>
  );
}
