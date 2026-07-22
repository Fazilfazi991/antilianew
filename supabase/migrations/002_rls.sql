-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Properties: public read, authenticated write
CREATE POLICY "properties_public_read" ON properties
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "properties_auth_insert" ON properties
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "properties_auth_update" ON properties
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "properties_auth_delete" ON properties
  FOR DELETE TO authenticated USING (true);

-- Inquiries: public insert, authenticated read/update
CREATE POLICY "inquiries_public_insert" ON inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "inquiries_auth_read" ON inquiries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inquiries_auth_update" ON inquiries
  FOR UPDATE TO authenticated USING (true);

-- Site settings: public read, authenticated write
CREATE POLICY "settings_public_read" ON site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "settings_auth_write" ON site_settings
  FOR ALL TO authenticated USING (true);
