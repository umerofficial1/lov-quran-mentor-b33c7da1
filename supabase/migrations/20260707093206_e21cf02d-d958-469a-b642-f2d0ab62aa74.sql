DROP POLICY IF EXISTS "anyone reads published announcements" ON public.announcements;
CREATE POLICY "public reads published announcements" ON public.announcements FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "admins read all announcements" ON public.announcements FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT ON public.announcements TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;