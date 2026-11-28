ALTER TABLE public.hifz_plans
  ADD COLUMN starting_juz integer NOT NULL DEFAULT 30 CHECK (starting_juz BETWEEN 1 AND 30);
