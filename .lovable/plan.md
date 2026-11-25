# Quran Revision Mode

Add a separate, signed-in Quran Revision page without changing Hifz, Quran reading, AI Learning, audio, or other existing features.

## What users get
- Choose 30, 45, 60, 90, or a custom number of days to revise the full Quran.
- Receive sequential daily portions balanced by Ayah count, with exact Surah/Ayah boundaries and no skipped or duplicated Ayat.
- Read actual Arabic with the existing English/Urdu translation choices and reciter audio; play one Ayah or loop the assigned range.
- Hide/show Arabic for self-testing, mark portions complete, mark weak Ayat, and see those Ayat again in future sessions.
- See completion history, a simple month calendar, remaining Ayat, and expected finish date. Pause/resume and adjust duration without moving completed Ayat.
- Save plans and progress to the existing signed-in database; missed days remain pending until completed.

## Technical approach
- Add a dedicated `/revision` signed-in route, linked in the existing navigation without altering other destinations.
- Keep plan/range arithmetic in a pure, testable helper; fetch Quran chapter Ayah counts and existing Quran API verse text, and use the shared audio player and reciter catalog.
- Add one user-owned revision-plan table with explicit authenticated grants and owner-only row policies. Store completion ranges/history and weak Ayah keys on each plan.
- Add focused tests for full Quran coverage, balanced partitions, and pending-task locking; verify the page, audio queue controls, persistence, and mobile layout.
