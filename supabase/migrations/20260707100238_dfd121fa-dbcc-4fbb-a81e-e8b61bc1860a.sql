
CREATE POLICY "users manage own non-admin roles insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role <> 'admin'::app_role);

CREATE POLICY "users manage own non-admin roles delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND role <> 'admin'::app_role);
