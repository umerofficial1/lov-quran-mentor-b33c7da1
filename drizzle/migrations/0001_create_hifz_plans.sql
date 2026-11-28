CREATE TABLE public.hifz_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  daily_target integer NOT NULL DEFAULT 3 CHECK (daily_target BETWEEN 1 AND 50),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  completed_ayahs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(completed_ayahs) = 'array'),
  weak_ayahs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(weak_ayahs) = 'array'),
  completed_juz jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(completed_juz) = 'array'),
  completed_surahs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(completed_surahs) = 'array'),
  current_task jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(current_task) = 'object'),
  history jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(history) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hifz_plans TO authenticated;
GRANT ALL ON public.hifz_plans TO service_role;

ALTER TABLE public.hifz_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own Hifz plans"
  ON public.hifz_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own Hifz plans"
  ON public.hifz_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own Hifz plans"
  ON public.hifz_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own Hifz plans"
  ON public.hifz_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX hifz_plans_user_updated_idx
  ON public.hifz_plans (user_id, updated_at DESC);