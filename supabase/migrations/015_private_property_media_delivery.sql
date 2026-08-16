-- Keep draft/review media private. Published media is delivered only with short-lived signed URLs.
BEGIN;

UPDATE storage.buckets SET public = false WHERE id IN ('property-images', 'property-media');

DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_published_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_admin_read" ON storage.objects;
CREATE POLICY "property_images_published_read" ON storage.objects FOR SELECT TO anon, authenticated USING (
  bucket_id = 'property-images' AND EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.listing_status = 'published' AND p.images::text LIKE '%' || storage.objects.name || '%'
  )
);
CREATE POLICY "property_images_owner_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'property-images' AND public.current_user_is_approved_contributor()
    AND (storage.foldername(name))[1] = 'broker'
    AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "property_images_admin_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'property-images' AND public.current_user_is_admin()
);

DROP POLICY IF EXISTS "property_media_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_media_bucket_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "property_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_media_published_read" ON storage.objects;
DROP POLICY IF EXISTS "property_media_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "property_media_admin_read" ON storage.objects;
CREATE POLICY "property_media_published_read" ON storage.objects FOR SELECT TO anon, authenticated USING (
  bucket_id = 'property-media' AND EXISTS (
    SELECT 1 FROM public.property_media pm
    JOIN public.properties p ON p.id = pm.property_id
    WHERE pm.storage_bucket = storage.objects.bucket_id AND pm.storage_path = storage.objects.name
      AND p.listing_status = 'published'
  )
);
CREATE POLICY "property_media_owner_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'property-media' AND EXISTS (
    SELECT 1 FROM public.property_media pm
    JOIN public.properties p ON p.id = pm.property_id
    WHERE pm.storage_bucket = storage.objects.bucket_id AND pm.storage_path = storage.objects.name
      AND p.owner_id = auth.uid() AND public.current_user_is_approved_contributor()
  )
);
CREATE POLICY "property_media_admin_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'property-media' AND public.current_user_is_admin()
);
DROP POLICY IF EXISTS "property_media_admin_write" ON storage.objects;
CREATE POLICY "property_media_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'property-media' AND public.current_user_is_admin())
  WITH CHECK (bucket_id = 'property-media' AND public.current_user_is_admin());
COMMIT;
