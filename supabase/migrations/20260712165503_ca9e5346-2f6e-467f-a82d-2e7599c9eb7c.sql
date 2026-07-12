-- Allow any authenticated user to view avatars so profile pictures render across the app
-- (admin user list, community features, shared views). Writes remain owner-only.
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');