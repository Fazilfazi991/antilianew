-- Allow marketing users to INSERT new properties
CREATE POLICY "properties_marketing_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'marketing')
  );

-- Allow marketing users to SELECT all properties (for management)
CREATE POLICY "properties_marketing_select" ON properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'marketing')
  );
