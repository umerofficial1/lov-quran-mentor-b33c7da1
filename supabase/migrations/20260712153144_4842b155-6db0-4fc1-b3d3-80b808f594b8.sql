
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.recitation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id INTEGER NOT NULL,
  start_ayah INTEGER NOT NULL,
  end_ayah INTEGER NOT NULL,
  words_total INTEGER NOT NULL DEFAULT 0,
  words_matched INTEGER NOT NULL DEFAULT 0,
  words_wrong INTEGER NOT NULL DEFAULT 0,
  words_missing INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  pronunciation_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  wpm NUMERIC(6,2) NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  tajweed_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  word_states JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_advice TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recitation_sessions TO authenticated;
GRANT ALL ON public.recitation_sessions TO service_role;
ALTER TABLE public.recitation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.recitation_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers view student sessions" ON public.recitation_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_recitation_sessions_user_created ON public.recitation_sessions(user_id, created_at DESC);
CREATE INDEX idx_recitation_sessions_surah ON public.recitation_sessions(user_id, surah_id);

CREATE TABLE public.achievements (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  threshold INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are public" ON public.achievements FOR SELECT USING (true);

CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON public.user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.achievements(id, title, description, icon, threshold, category) VALUES
  ('first_session', 'First Steps', 'Complete your first recitation session', 'sparkles', 1, 'milestone'),
  ('accuracy_80', 'Precise Tongue', 'Achieve 80%+ accuracy in a session', 'target', 80, 'accuracy'),
  ('accuracy_95', 'Master Reciter', 'Achieve 95%+ accuracy in a session', 'crown', 95, 'accuracy'),
  ('sessions_10', 'Consistent Learner', 'Complete 10 sessions', 'flame', 10, 'volume'),
  ('sessions_50', 'Devoted Reciter', 'Complete 50 sessions', 'trophy', 50, 'volume'),
  ('surah_complete', 'Surah Finisher', 'Complete an entire Surah in one session', 'book-open', 1, 'milestone')
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER update_recitation_sessions_updated_at
  BEFORE UPDATE ON public.recitation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
