-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','auto')),
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','ur','ar')),
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT jsonb_build_object(
    'daily_reminder', true,
    'weekly_summary', true,
    'achievements', true,
    'announcements', true
  );

-- Favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah integer NOT NULL CHECK (surah BETWEEN 1 AND 114),
  ayah integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, surah, ayah)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  surah_from integer,
  surah_to integer,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issuer text NOT NULL DEFAULT 'Verse Wise Mentor'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own certificates" ON public.certificates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages certificates" ON public.certificates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Realtime
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Avatars bucket policies (bucket already created via storage tool)
CREATE POLICY "Users view own avatar" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);