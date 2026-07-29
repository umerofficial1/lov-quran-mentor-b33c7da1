-- 1. Users may only self-assign the 'student' role; teacher/parent/admin are admin-granted only
DROP POLICY IF EXISTS "users manage own non-admin roles insert" ON public.user_roles;
DROP POLICY IF EXISTS "users manage own non-admin roles delete" ON public.user_roles;

CREATE POLICY "users self-assign student role only"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'student'::app_role);

CREATE POLICY "users remove own student role only"
ON public.user_roles FOR DELETE TO authenticated
USING (auth.uid() = user_id AND role = 'student'::app_role);

-- 2. Recitation sessions: teacher must be admin-granted AND admin-linked
DROP POLICY IF EXISTS "Linked teachers view student sessions" ON public.recitation_sessions;

CREATE POLICY "Linked teachers view student sessions"
ON public.recitation_sessions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'teacher'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.teacher_students ts
      WHERE ts.teacher_id = auth.uid()
        AND ts.student_id = recitation_sessions.user_id
    )
  )
);

-- 3. Remove any previously self-assigned elevated roles that no admin granted
DELETE FROM public.user_roles ur
WHERE ur.role IN ('teacher'::app_role, 'parent'::app_role)
  AND NOT EXISTS (
    SELECT 1 FROM public.teacher_students ts WHERE ts.teacher_id = ur.user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.parent_child_links pl WHERE pl.parent_id = ur.user_id
  );