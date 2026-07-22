import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/hadith")({
  head: () => ({
    meta: [
      { title: "احادیثِ نبوی ﷺ — Ayatica" },
      { name: "description", content: "Sahih al-Bukhari, Muslim, and the major Sunan collections with Arabic text and Urdu translation, plus an AI mentor to explain each hadith." },
      { property: "og:title", content: "Hadees-e-Nabvi ﷺ — Ayatica" },
      { property: "og:description", content: "Authentic hadith collections with Arabic + Urdu translation and per-book AI mentor." },
    ],
  }),
  component: () => <Outlet />,
});
