-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('rent', 'buy', 'commercial')),
  type text NOT NULL CHECK (type IN ('apartment','villa','townhouse','studio','penthouse','duplex','compound','shop','office','warehouse')),
  price numeric NOT NULL DEFAULT 0,
  price_period text NOT NULL DEFAULT 'per year',
  currency text NOT NULL DEFAULT 'AED',
  location text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  lat numeric,
  lng numeric,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 1,
  area_sqft numeric NOT NULL DEFAULT 0,
  furnishing text NOT NULL DEFAULT 'unfurnished' CHECK (furnishing IN ('furnished','unfurnished','semi-furnished')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','rented','sold')),
  featured boolean NOT NULL DEFAULT false,
  amenities text[] NOT NULL DEFAULT '{}',
  images jsonb NOT NULL DEFAULT '[]',
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('tenant','landlord','general','property')),
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  budget text,
  preferred_location text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Default site settings
INSERT INTO site_settings (key, value) VALUES
  ('whatsapp_number', '97412345678'),
  ('company_email', 'info@antiliarealestate.com'),
  ('company_phone', '+974 1234 5678'),
  ('company_address', 'West Bay, Doha, Qatar')
ON CONFLICT (key) DO NOTHING;
