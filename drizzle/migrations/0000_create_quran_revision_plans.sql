CREATE TABLE public.quran_revision_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  completed_portions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(completed_portions) = 'array'),
  weak_ayahs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(weak_ayahs) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_revision_plans TO authenticated;
GRANT ALL ON public.quran_revision_plans TO service_role;

ALTER TABLE public.quran_revision_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own Quran revision plans"
  ON public.quran_revision_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own Quran revision plans"
  ON public.quran_revision_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own Quran revision plans"
  ON public.quran_revision_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own Quran revision plans"
  ON public.quran_revision_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX quran_revision_plans_user_created_idx
  ON public.quran_revision_plans (user_id, created_at DESC);