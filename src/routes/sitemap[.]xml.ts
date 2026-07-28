import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SURAHS } from "@/lib/surahs";

const BASE_URL = "https://lov-quran-mentor.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/quran", changefreq: "weekly", priority: "0.9" },
          { path: "/chat", changefreq: "monthly", priority: "0.7" },
          { path: "/learn", changefreq: "monthly", priority: "0.7" },
          { path: "/search", changefreq: "monthly", priority: "0.6" },
          { path: "/tools", changefreq: "monthly", priority: "0.6" },
          { path: "/reciters", changefreq: "monthly", priority: "0.7" },
          { path: "/hadith", changefreq: "weekly", priority: "0.8" },
        ];

        // Every surah page
        for (let i = 1; i <= 114; i++) {
          entries.push({ path: `/quran/${i}`, changefreq: "yearly", priority: "0.8" });
        }
        // Juz + page + hizb are large; include juz index (1..30) only
        for (let j = 1; j <= 30; j++) {
          entries.push({ path: `/quran/juz/${j}`, changefreq: "yearly", priority: "0.5" });
        }

        void SURAHS; // referenced to keep import used if metadata expands later

        const urls = entries
          .map(
            (e) =>
              `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n${
                e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>\n` : ""
              }${e.priority ? `    <priority>${e.priority}</priority>\n` : ""}  </url>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
