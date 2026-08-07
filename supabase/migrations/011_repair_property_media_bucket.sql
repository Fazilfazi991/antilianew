-- Repairs environments where property_media was created but the storage bucket was not.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-media', 'property-media', true, 262144000, ARRAY['video/mp4','video/quicktime','video/x-m4v','video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "property_media_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_media_bucket_admin_write" ON storage.objects;
CREATE POLICY "property_media_bucket_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'property-media');
CREATE POLICY "property_media_bucket_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'property-media' AND EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()))
  WITH CHECK (bucket_id = 'property-media' AND EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));
