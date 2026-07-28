import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AudioPlayerProvider } from "@/hooks/use-audio-player";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { AnnouncementsBanner } from "@/components/AnnouncementsBanner";
// FeedbackWidget is non-critical; defer its bundle until after hydration.
const FeedbackWidget = lazy(() =>
  import("@/components/FeedbackWidget").then((m) => ({ default: m.FeedbackWidget })),
);

function NotFoundComponent() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-[#C9A24C]/30 to-[#1FB6B0]/20 grid place-items-center border border-white/10">
          <span className="text-4xl font-display text-[#C9A24C]">﷽</span>
        </div>
        <h1 className="text-5xl font-display font-bold text-white">404</h1>
        <h2 className="mt-3 text-lg font-semibold text-white/90">This page isn't here</h2>
        <p className="mt-2 text-sm text-white/60">
          The verse you seek has moved. Return home and continue your journey.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-[#C9A24C] px-5 text-sm font-semibold text-[#070C1F] transition-transform hover:scale-[1.02]"
          >
            Go home
          </Link>
          <Link
            to="/quran"
            className="min-h-11 inline-flex items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors"
          >
            Open the Quran
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-500/10 border border-red-400/30 grid place-items-center">
          <span className="text-2xl">⚠</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Something went wrong on our end. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-[#1FB6B0] px-5 text-sm font-semibold text-[#070C1F] transition-transform hover:scale-[1.02]"
          >
            Try again
          </button>
          <a
            href="/"
            className="min-h-11 inline-flex items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Verse Wise Mentor — AI-guided Quran learning" },
      { name: "description", content: "A cinematic, scholarly Quran learning platform with AI tajweed feedback, tafsir, hifz tracking and trilingual translations." },
      { name: "theme-color", content: "#070C1F" },
      { property: "og:title", content: "Verse Wise Mentor" },
      { property: "og:description", content: "AI-guided Quran learning — recitation, tafsir, hifz and Islamic tools in Arabic, English and Urdu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Verse Wise Mentor" },
      { name: "twitter:description", content: "AI-guided Quran learning in Arabic, English and Urdu." },
      { property: "og:site_name", content: "Verse Wise Mentor" },
      { name: "google-site-verification", content: "VyY_N3bh1QzoRfCdtKERZojkYsOAQiFKFOl1OCe5k8s" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/icon-512.png", sizes: "512x512" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Preconnect the Quran + audio CDNs so first ayah paints/plays sooner
      { rel: "preconnect", href: "https://api.quran.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://verses.quran.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://api.quran.com" },
      { rel: "dns-prefetch", href: "https://verses.quran.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;600&family=Noto+Naskh+Arabic:wght@400&family=Amiri:wght@400;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://lov-quran-mentor.lovable.app/#org",
              name: "Verse Wise Mentor",
              url: "https://lov-quran-mentor.lovable.app",
              description: "AI-guided Quran and hadith learning in Arabic, English and Urdu.",
            },
            {
              "@type": "WebSite",
              "@id": "https://lov-quran-mentor.lovable.app/#website",
              name: "Verse Wise Mentor",
              url: "https://lov-quran-mentor.lovable.app",
              publisher: { "@id": "https://lov-quran-mentor.lovable.app/#org" },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://lov-quran-mentor.lovable.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AudioPlayerProvider>
        <AnnouncementsBanner />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Suspense fallback={null}>
          <FeedbackWidget />
        </Suspense>
        <AudioPlayerBar />
      </AudioPlayerProvider>
    </QueryClientProvider>
  );
}
