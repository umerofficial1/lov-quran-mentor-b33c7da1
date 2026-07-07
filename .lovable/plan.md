# Deep Audit + Fix Pass — Verse Wise Mentor

The full request lists 30+ new features (student/teacher/parent/admin dashboards, live classes, community, prayer times, qibla, tafsir, hadith library, seerah, articles, PWA, offline, i18n, etc.). Building all of that in one pass would take many turns and burn significant credits. I'll split the work into phases and start with Phase 1 — the audit + polish of what already exists — then check in before we build new surfaces.

## Current surface inventory
Existing routes: `/`, `/auth`, `/chat` (AI teacher), `/quran`, `/quran/$surahId`, `/dashboard`, `/hifz`, `/tools`, plus MCP endpoints.
Missing surfaces mentioned in the brief: teacher/parent/admin dashboards, courses, live classes, community, notes, reminders, prayer times, qibla, calendar, tafsir, hadith, seerah, articles, global search, i18n, PWA/offline.

## Phase 1 — Audit + fix pass (this turn + next 1-2)
Goal: everything currently in the app is polished, accessible, secure, on-brand, and free of dead ends.

1. **Design consistency sweep** — apply Madinah Blue tokens across `/auth`, `/chat`, `/quran`, `/quran/$surahId`, `/dashboard`, `/hifz`, `/tools`. Kill leftover emerald/amber/slate arbitrary classes in favor of semantic tokens. Ensure trilingual (AR/EN/UR) copy on hero surfaces.
2. **Nav + footer** — audit `SiteNav`/`MobileNav`, ensure every link resolves, add a real footer with legal/about/contact links.
3. **Accessibility** — button `aria-label`s on icon-only buttons, single `<main>` per route, contrast tokens, focus rings, tap targets ≥44px on mobile.
4. **SEO** — per-route `head()` with unique title/description/og tags (currently many routes reuse "Love Qran" branding — rename to Verse Wise Mentor, add og:image on leaf routes with hero art).
5. **Broken/empty states** — every list handles empty, loading, and error; every form shows validation; every "coming soon" link is either wired or clearly marked.
6. **Auth flow** — audit `/auth` (Google via `lovable.auth`, email/password), reset-password page, session listener in `__root.tsx`, sign-out hygiene.
7. **Data layer** — verify RLS + GRANTs on `bookmarks`, `hifz_progress`, `last_read`, `profiles`; migrate `dashboard`/`hifz` fetches from `useEffect` to loader + `useSuspenseQuery` where the route is under `_authenticated`.
8. **Move protected routes** — `/dashboard`, `/hifz`, `/tools` under `src/routes/_authenticated/` so the managed gate protects them (today they hand-roll `useEffect` redirects).
9. **Security scan** — run the Supabase linter + security scan and fix any HIGH/CRITICAL findings.
10. **PWA basics** — verify `manifest.webmanifest`, add a real favicon set, theme color, apple-touch-icon.

## Phase 2 — Foundation for the new ecosystem (later turns, on approval)
- User-roles system (`app_role` enum + `user_roles` table + `has_role`) for student/teacher/parent/admin.
- Role-scoped dashboard routes.
- Prayer times, qibla, Islamic calendar (all client-side, no new tables).
- Global search (client-side over surahs + static content first).

## Phase 3 — Content + community (later, on approval)
- Tafsir viewer wired into the Quran reader (server fn against a public tafsir API).
- Hadith library + Seerah + articles (content tables + reader routes).
- Community discussions (threads + posts + moderation, RLS-gated).
- Courses + live classes (courses/lessons/enrollments schema, video embed; real live-video requires a 3rd-party provider — I'll flag the trade-off before we commit).

## Phase 4 — Polish (later, on approval)
- i18n scaffolding (react-i18next) with AR/EN/UR bundles across the UI (currently only content is trilingual).
- Full offline/PWA (service worker + cached Quran text).
- Learning reminders (web push + email via Supabase).

## Starting now
On approval I'll execute **Phase 1** — audit fixes only, no schema changes beyond RLS/GRANT gaps and moving 3 routes under `_authenticated/`. I'll report per-route diffs so you can see what changed.

Reply "go" to start Phase 1, or tell me which phase/items to reorder.
