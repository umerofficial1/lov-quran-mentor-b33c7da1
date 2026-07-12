
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON public.favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON public.bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_user_issued ON public.certificates(user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_hifz_progress_user ON public.hifz_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_resolved_created ON public.feedback(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_published_created ON public.announcements(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_child_parent ON public.parent_child_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_child ON public.parent_child_links(child_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
