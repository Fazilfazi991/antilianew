-- New media records coexist with the legacy properties.images JSONB field.
CREATE TABLE IF NOT EXISTS property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_provider text NOT NULL DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'firebase')),
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_name text,
  file_size bigint,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  thumbnail_path text,
  duration_seconds numeric,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_provider, storage_bucket, storage_path)
);
CREATE INDEX IF NOT EXISTS property_media_property_sort_idx ON property_media (property_id, sort_order);
CREATE TRIGGER property_media_updated_at BEFORE UPDATE ON property_media FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_media_public_read" ON property_media FOR SELECT USING (true);
CREATE POLICY "property_media_admin_write" ON property_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- Explicit public delivery mirrors the existing public property-images bucket. Do not change this
-- to private without also replacing getPublicUrl() with signed URL delivery in the provider.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-media', 'property-media', true, 262144000, ARRAY['video/mp4','video/quicktime','video/x-m4v','video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
CREATE POLICY "property_media_bucket_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'property-media');
CREATE POLICY "property_media_bucket_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'property-media' AND EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()))
  WITH CHECK (bucket_id = 'property-media' AND EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));
