CREATE TABLE public.teacher_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id)
);

GRANT SELECT ON public.teacher_students TO authenticated;
GRANT ALL ON public.teacher_students TO service_role;

ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage teacher_students"
ON public.teacher_students FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "participants view teacher_students"
ON public.teacher_students FOR SELECT TO authenticated
USING (auth.uid() = teacher_id OR auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers view student sessions" ON public.recitation_sessions;

CREATE POLICY "Linked teachers view student sessions"
ON public.recitation_sessions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.teacher_students ts
    WHERE ts.teacher_id = auth.uid()
      AND ts.student_id = recitation_sessions.user_id
      AND public.has_role(auth.uid(), 'teacher')
  )
);