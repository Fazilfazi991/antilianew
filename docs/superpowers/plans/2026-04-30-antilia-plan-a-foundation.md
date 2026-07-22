# Antilia Real Estate — Plan A: Foundation + Data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Wire React Router v6, Supabase client, Vitest, and 40 sample properties into antilia-landing so every subsequent plan has a working data layer and routing skeleton to build on.

**Architecture:** Keep all existing Vite + React + Tailwind v4 code intact. Layer React Router v6 on top, restructure App.tsx into a route tree, create a Supabase client singleton, and push sample data via a Python script directly to Supabase REST API.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind v4, React Router v6, @supabase/supabase-js, Vitest 2, @testing-library/react, Python 3 (seed script only)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/supabase.ts` | Create | Supabase browser client singleton |
| `src/lib/types.ts` | Create | Property, Inquiry, SiteSettings TypeScript interfaces |
| `src/lib/utils.ts` | Create | formatPrice, slugify, getWhatsAppURL helpers |
| `src/lib/filterUtils.ts` | Create | Pure filter/sort functions (unit-tested) |
| `src/pages/HomePage.tsx` | Create | Wraps existing Hero + section components |
| `src/pages/PropertiesPage.tsx` | Create | Placeholder — filled in Plan B |
| `src/pages/PropertyDetailPage.tsx` | Create | Placeholder — filled in Plan B |
| `src/pages/AboutPage.tsx` | Create | Placeholder — filled in Plan C |
| `src/pages/ContactPage.tsx` | Create | Placeholder — filled in Plan C |
| `src/pages/admin/AdminLoginPage.tsx` | Create | Placeholder — filled in Plan C |
| `src/pages/admin/AdminLayout.tsx` | Create | Placeholder — filled in Plan C |
| `src/App.tsx` | Modify | Replace single-page render with BrowserRouter route tree |
| `src/main.tsx` | Modify | No change needed (App handles routing) |
| `vitest.config.ts` | Create | Vitest config with jsdom environment |
| `src/tests/filterUtils.test.ts` | Create | Unit tests for all filter/sort pure functions |
| `scripts/seed_properties.py` | Create | Generates + inserts 40 sample properties via Supabase REST |
| `.env.example` | Create | Template for required env vars |
| `supabase/migrations/001_schema.sql` | Create | Full schema: properties, inquiries, site_settings |
| `supabase/migrations/002_rls.sql` | Create | RLS policies |

---

## Task 1: Install packages

**Files:** `package.json`

- [x] **Step 1: Install runtime deps**

```bash
cd /Volumes/PNYRP60PSSD/Users/pranav/Projects/32_Antilia_Real_Estate/antilia-landing
pnpm add react-router-dom @supabase/supabase-js
```

Expected: `node_modules/react-router-dom` and `node_modules/@supabase/supabase-js` present.

- [x] **Step 2: Install dev/test deps**

```bash
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: `node_modules/vitest` present.

- [x] **Step 3: Verify build still passes**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

- [x] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-router-dom, supabase-js, vitest"
```

---

## Task 2: Vitest config

**Files:**
- Create: `vitest.config.ts`
- Modify: `vite.config.ts`

- [x] **Step 1: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [x] **Step 2: Create test setup file**

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
```

- [x] **Step 3: Add test script to package.json**

Add to `"scripts"` in package.json:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

- [x] **Step 4: Verify vitest works**

```bash
pnpm test:run
```

Expected: `No test files found, exiting with code 0` (no tests yet — that's fine).

- [x] **Step 5: Commit**

```bash
git add vitest.config.ts src/tests/setup.ts package.json
git commit -m "chore: configure vitest with jsdom"
```

---

## Task 3: TypeScript types

**Files:**
- Create: `src/lib/types.ts`

- [x] **Step 1: Write types**

```typescript
// src/lib/types.ts

export type PropertyCategory = 'rent' | 'buy' | 'commercial';

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'townhouse'
  | 'studio'
  | 'penthouse'
  | 'duplex'
  | 'compound'
  | 'shop'
  | 'office'
  | 'warehouse';

export type Furnishing = 'furnished' | 'unfurnished' | 'semi-furnished';

export type PropertyStatus = 'available' | 'rented' | 'sold';

export interface PropertyImage {
  url: string;
  alt: string;
  order: number;
  is_primary: boolean;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: PropertyCategory;
  type: PropertyType;
  price: number;
  price_period: string; // 'per year' | 'per month' | 'asking price'
  currency: string;     // 'AED' | 'QAR'
  location: string;     // e.g. 'Dubai Marina, Dubai'
  area: string;         // e.g. 'Dubai Marina'
  lat: number | null;
  lng: number | null;
  bedrooms: number;     // 0 = studio
  bathrooms: number;
  area_sqft: number;
  furnishing: Furnishing;
  status: PropertyStatus;
  featured: boolean;
  amenities: string[];
  images: PropertyImage[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  type: 'tenant' | 'landlord' | 'general' | 'property';
  property_id: string | null;
  name: string;
  phone: string;
  email: string;
  message: string;
  budget: string | null;
  preferred_location: string | null;
  status: 'new' | 'contacted' | 'closed';
  notes: string | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export interface PropertyFilters {
  category: PropertyCategory | 'all';
  type: PropertyType | '';
  location: string;
  priceMin: string;
  priceMax: string;
  bedrooms: string; // '' | '0' | '1' | '2' | '3' | '4' | '5'
  bathrooms: string;
  areaMin: string;
  areaMax: string;
  furnishing: Furnishing | '';
  sort: 'newest' | 'price_asc' | 'price_desc' | 'featured';
  page: string;
}

export const DEFAULT_FILTERS: PropertyFilters = {
  category: 'all',
  type: '',
  location: '',
  priceMin: '',
  priceMax: '',
  bedrooms: '',
  bathrooms: '',
  areaMin: '',
  areaMax: '',
  furnishing: '',
  sort: 'newest',
  page: '1',
};
```

- [x] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript interfaces for Property, Inquiry, filters"
```

---

## Task 4: Utility functions + filter logic (TDD)

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/filterUtils.ts`
- Create: `src/tests/filterUtils.test.ts`

- [x] **Step 1: Write failing tests for filterUtils**

```typescript
// src/tests/filterUtils.test.ts
import { describe, it, expect } from 'vitest';
import { filterProperties, sortProperties, paginateProperties } from '@/lib/filterUtils';
import { Property, PropertyFilters, DEFAULT_FILTERS } from '@/lib/types';

const makeProperty = (overrides: Partial<Property>): Property => ({
  id: '1',
  slug: 'test-property',
  title: 'Test Property',
  description: '',
  category: 'rent',
  type: 'apartment',
  price: 50000,
  price_period: 'per year',
  currency: 'AED',
  location: 'Dubai Marina, Dubai',
  area: 'Dubai Marina',
  lat: null,
  lng: null,
  bedrooms: 2,
  bathrooms: 2,
  area_sqft: 1200,
  furnishing: 'furnished',
  status: 'available',
  featured: false,
  amenities: [],
  images: [],
  seo_title: null,
  seo_description: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const properties: Property[] = [
  makeProperty({ id: '1', category: 'rent', type: 'apartment', price: 50000, bedrooms: 2, bathrooms: 2, area_sqft: 1200, furnishing: 'furnished', area: 'Dubai Marina' }),
  makeProperty({ id: '2', category: 'buy', type: 'villa', price: 2000000, bedrooms: 4, bathrooms: 4, area_sqft: 5000, furnishing: 'unfurnished', area: 'Emirates Hills' }),
  makeProperty({ id: '3', category: 'commercial', type: 'office', price: 120000, bedrooms: 0, bathrooms: 2, area_sqft: 2000, furnishing: 'unfurnished', area: 'DIFC' }),
  makeProperty({ id: '4', category: 'rent', type: 'studio', price: 30000, bedrooms: 0, bathrooms: 1, area_sqft: 500, furnishing: 'furnished', area: 'Jumeirah Lake Towers' }),
  makeProperty({ id: '5', category: 'buy', type: 'apartment', price: 800000, bedrooms: 3, bathrooms: 3, area_sqft: 2000, furnishing: 'semi-furnished', area: 'Downtown Dubai', featured: true }),
];

describe('filterProperties', () => {
  it('returns all when filters are default', () => {
    expect(filterProperties(properties, DEFAULT_FILTERS)).toHaveLength(5);
  });

  it('filters by category rent', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, category: 'rent' });
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.category).toBe('rent'));
  });

  it('filters by type villa', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, type: 'villa' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by location', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, location: 'Dubai Marina' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by priceMin', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, priceMin: '100000' });
    expect(result).toHaveLength(3);
  });

  it('filters by priceMax', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, priceMax: '50000' });
    expect(result).toHaveLength(2);
  });

  it('filters by exact bedrooms', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, bedrooms: '2' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters studios (bedrooms=0)', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, bedrooms: '0' });
    expect(result).toHaveLength(2);
  });

  it('filters by furnishing', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, furnishing: 'furnished' });
    expect(result).toHaveLength(2);
  });

  it('filters by areaMin sqft', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, areaMin: '2000' });
    expect(result).toHaveLength(3);
  });

  it('filters by areaMax sqft', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, areaMax: '1000' });
    expect(result).toHaveLength(2);
  });

  it('combines multiple filters', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, category: 'rent', furnishing: 'furnished' });
    expect(result).toHaveLength(2);
  });
});

describe('sortProperties', () => {
  it('sorts by price ascending', () => {
    const result = sortProperties([...properties], 'price_asc');
    expect(result[0].price).toBe(30000);
    expect(result[result.length - 1].price).toBe(2000000);
  });

  it('sorts by price descending', () => {
    const result = sortProperties([...properties], 'price_desc');
    expect(result[0].price).toBe(2000000);
  });

  it('sorts featured first', () => {
    const result = sortProperties([...properties], 'featured');
    expect(result[0].featured).toBe(true);
  });

  it('sorts newest by created_at', () => {
    const withDates = [
      makeProperty({ id: 'a', created_at: '2026-01-01T00:00:00Z' }),
      makeProperty({ id: 'b', created_at: '2026-03-01T00:00:00Z' }),
    ];
    const result = sortProperties(withDates, 'newest');
    expect(result[0].id).toBe('b');
  });
});

describe('paginateProperties', () => {
  const items = Array.from({ length: 25 }, (_, i) =>
    makeProperty({ id: String(i + 1) })
  );

  it('returns first 12 on page 1', () => {
    const result = paginateProperties(items, 1, 12);
    expect(result.items).toHaveLength(12);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('returns 1 item on page 3', () => {
    const result = paginateProperties(items, 3, 12);
    expect(result.items).toHaveLength(1);
  });
});
```

- [x] **Step 2: Run tests — expect ALL to fail**

```bash
pnpm test:run
```

Expected: `Cannot find module '@/lib/filterUtils'`

- [x] **Step 3: Implement filterUtils.ts**

```typescript
// src/lib/filterUtils.ts
import { Property, PropertyFilters } from './types';

export function filterProperties(
  properties: Property[],
  filters: PropertyFilters
): Property[] {
  return properties.filter(p => {
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.location && p.area !== filters.location) return false;
    if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
    if (filters.priceMax && p.price > Number(filters.priceMax)) return false;
    if (filters.bedrooms !== '' && p.bedrooms !== Number(filters.bedrooms)) return false;
    if (filters.bathrooms !== '' && p.bathrooms < Number(filters.bathrooms)) return false;
    if (filters.areaMin && p.area_sqft < Number(filters.areaMin)) return false;
    if (filters.areaMax && p.area_sqft > Number(filters.areaMax)) return false;
    if (filters.furnishing && p.furnishing !== filters.furnishing) return false;
    return true;
  });
}

export function sortProperties(
  properties: Property[],
  sort: PropertyFilters['sort']
): Property[] {
  const arr = [...properties];
  switch (sort) {
    case 'price_asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'featured':
      return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
    case 'newest':
    default:
      return arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function paginateProperties(
  properties: Property[],
  page: number,
  perPage: number = 12
): { items: Property[]; total: number; totalPages: number; page: number } {
  const total = properties.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const items = properties.slice(start, start + perPage);
  return { items, total, totalPages, page };
}
```

- [x] **Step 4: Implement utils.ts**

```typescript
// src/lib/utils.ts
import { Property } from './types';

export function formatPrice(price: number, currency: string, period: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price);
  return `${currency} ${formatted}${period !== 'asking price' ? ' / ' + period.replace('per ', '') : ''}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getWhatsAppURL(message?: string): string {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '97412345678';
  const text = message || 'Hello Antilia Real Estate, I would like to make an enquiry.';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function getPropertyWhatsAppURL(property: Property): string {
  const msg = `Hello Antilia Real Estate, I am interested in: ${property.title}`;
  return getWhatsAppURL(msg);
}

export function getPrimaryImage(property: Property): string {
  const primary = property.images.find(i => i.is_primary);
  return primary?.url ?? property.images[0]?.url ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
}

export function extractLocations(properties: Property[]): string[] {
  return [...new Set(properties.map(p => p.area))].sort();
}
```

- [x] **Step 5: Run tests — all should pass**

```bash
pnpm test:run
```

Expected: All tests pass. Output like: `✓ src/tests/filterUtils.test.ts (15 tests)`

- [x] **Step 6: Commit**

```bash
git add src/lib/filterUtils.ts src/lib/utils.ts src/tests/filterUtils.test.ts src/tests/setup.ts
git commit -m "feat: filter/sort/paginate utils with full Vitest coverage"
```

---

## Task 5: Supabase client

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `.env.example`
- Create: `.env.local` (manually — contains secrets)

- [x] **Step 1: Create Supabase client**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [x] **Step 2: Create .env.example**

```bash
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WHATSAPP_NUMBER=97412345678
VITE_SITE_URL=https://antilia-landing.vercel.app
```

- [x] **Step 3: Create .env.local with real values (get from Supabase MCP)**

The Supabase MCP is connected. Run the following to get the project URL and anon key, then write them to `.env.local`.

- [x] **Step 4: Commit safe files only**

```bash
git add src/lib/supabase.ts .env.example
git commit -m "feat: add Supabase client singleton"
```

---

## Task 6: Supabase schema

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`

- [x] **Step 1: Write schema migration**

```sql
-- supabase/migrations/001_schema.sql

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
```

- [x] **Step 2: Write RLS policies**

```sql
-- supabase/migrations/002_rls.sql

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
```

- [x] **Step 3: Apply migrations via Supabase MCP**

Use the Supabase MCP `apply_migration` tool to run both SQL files against the connected project. Run 001_schema.sql first, then 002_rls.sql.

- [x] **Step 4: Verify tables exist via MCP**

Use `list_tables` to confirm `properties`, `inquiries`, `site_settings` all appear.

- [x] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: Supabase schema — properties, inquiries, site_settings + RLS"
```

---

## Task 7: Sample data seed script

**Files:**
- Create: `scripts/seed_properties.py`

- [x] **Step 1: Write the seed script**

```python
#!/usr/bin/env python3
"""
scripts/seed_properties.py
Generates 40 realistic UAE/Qatar property records and inserts them into Supabase.
Run: python3 scripts/seed_properties.py
Requires: pip install supabase python-dotenv
"""

import os
import random
import re
import sys
from datetime import datetime, timedelta

try:
    from supabase import create_client
    from dotenv import load_dotenv
except ImportError:
    print("Install deps: pip install supabase python-dotenv")
    sys.exit(1)

load_dotenv(".env.local")

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


AREAS_UAE = [
    "Dubai Marina", "Downtown Dubai", "Jumeirah Lake Towers", "Emirates Hills",
    "Palm Jumeirah", "Business Bay", "DIFC", "Jumeirah Village Circle",
    "Al Barsha", "Mirdif", "Arabian Ranches", "Yas Island",
]
AREAS_QATAR = [
    "West Bay", "The Pearl", "Lusail", "Al Wakrah",
    "Al Rayyan", "Msheireb", "Katara", "Al Khor",
]
ALL_AREAS = AREAS_UAE + AREAS_QATAR

AMENITIES_POOL = [
    "Swimming Pool", "Gym", "Parking", "Balcony", "Sea View",
    "City View", "Garden", "Security", "Concierge", "Pet Friendly",
    "Central AC", "Built-in Wardrobes", "Maid's Room", "Storage Room",
    "Children's Play Area", "BBQ Area", "Sauna", "Tennis Court", "Jacuzzi",
]

# Unsplash property image IDs (real estate / interior / exterior)
UNSPLASH_IMAGES = [
    "photo-1560448204-e02f11c3d0e2",
    "photo-1582268611958-ebfd161ef9cf",
    "photo-1613490493576-7fde63acd811",
    "photo-1512917774080-9991f1c4c750",
    "photo-1600596542815-ffad4c1539a9",
    "photo-1600585154340-be6161a56a0c",
    "photo-1568605114967-8130f3a36994",
    "photo-1600047509807-ba8f99d2cdde",
    "photo-1600566753086-00f18fb6b3ea",
    "photo-1545324418-cc1a3fa10c00",
    "photo-1416331108676-a22ccb276e35",
    "photo-1486325212027-8081e485255e",
    "photo-1484154218962-a197022b5858",
    "photo-1560185007-c5ca9d2c014d",
    "photo-1493663284031-b7e3aefcae8e",
]

PROPERTY_TYPES_BY_CATEGORY = {
    "rent": ["apartment", "studio", "villa", "townhouse", "penthouse", "duplex"],
    "buy": ["apartment", "villa", "townhouse", "penthouse", "compound", "duplex"],
    "commercial": ["office", "shop", "warehouse"],
}

PRICE_RANGES = {
    ("rent", "apartment"):   (25_000,  150_000),
    ("rent", "studio"):      (15_000,   60_000),
    ("rent", "villa"):       (80_000,  400_000),
    ("rent", "townhouse"):   (60_000,  200_000),
    ("rent", "penthouse"):  (120_000,  500_000),
    ("rent", "duplex"):      (70_000,  250_000),
    ("buy",  "apartment"):  (400_000, 3_000_000),
    ("buy",  "villa"):    (1_500_000, 15_000_000),
    ("buy",  "townhouse"):  (800_000, 4_000_000),
    ("buy",  "penthouse"): (2_000_000, 20_000_000),
    ("buy",  "compound"):  (3_000_000, 25_000_000),
    ("buy",  "duplex"):    (1_000_000, 5_000_000),
    ("commercial", "office"):    (50_000, 500_000),
    ("commercial", "shop"):      (40_000, 300_000),
    ("commercial", "warehouse"): (80_000, 800_000),
}

BED_RANGES = {
    "studio": (0, 0),
    "apartment": (1, 3),
    "villa": (3, 7),
    "townhouse": (3, 5),
    "penthouse": (2, 5),
    "duplex": (2, 4),
    "compound": (4, 8),
    "office": (0, 0),
    "shop": (0, 0),
    "warehouse": (0, 0),
}

AREA_RANGES = {
    "studio": (300, 600),
    "apartment": (600, 2500),
    "villa": (3000, 12000),
    "townhouse": (2000, 5000),
    "penthouse": (2000, 8000),
    "duplex": (1500, 4000),
    "compound": (5000, 20000),
    "office": (500, 10000),
    "shop": (200, 3000),
    "warehouse": (2000, 20000),
}


def make_property(index: int) -> dict:
    category = random.choice(["rent", "buy", "commercial"])
    prop_type = random.choice(PROPERTY_TYPES_BY_CATEGORY[category])
    area = random.choice(ALL_AREAS)
    is_uae = area in AREAS_UAE
    currency = "AED" if is_uae else "QAR"
    country = "Dubai" if is_uae else "Doha"

    price_low, price_high = PRICE_RANGES.get(
        (category, prop_type), (50_000, 500_000)
    )
    price = random.randrange(price_low, price_high, 5000)

    beds_low, beds_high = BED_RANGES[prop_type]
    bedrooms = random.randint(beds_low, beds_high)
    bathrooms = max(1, bedrooms) if bedrooms > 0 else 1

    sqft_low, sqft_high = AREA_RANGES[prop_type]
    area_sqft = random.randrange(sqft_low, sqft_high, 50)

    furnishing = random.choice(["furnished", "unfurnished", "semi-furnished"])
    price_period = "per year" if category in ("rent", "commercial") else "asking price"
    featured = index < 6  # first 6 are featured

    # Build title
    beds_label = f"{bedrooms} Bed " if bedrooms > 0 else ""
    title = f"{beds_label}{prop_type.title()} in {area}"

    amenities = random.sample(AMENITIES_POOL, k=random.randint(4, 9))
    images = [
        {
            "url": f"https://images.unsplash.com/{random.choice(UNSPLASH_IMAGES)}?w=800&q=80&auto=format&fit=crop",
            "alt": f"{title} - image {j + 1}",
            "order": j,
            "is_primary": j == 0,
        }
        for j in range(random.randint(3, 6))
    ]

    slug = slugify(f"{title}-{index}")

    description = (
        f"Stunning {prop_type} located in the heart of {area}, {country}. "
        f"This {'spacious' if area_sqft > 1500 else 'cozy'} property offers "
        f"{area_sqft:,} sq ft of {'luxury' if price > 500_000 else 'modern'} living space. "
        f"{'Fully furnished with premium fixtures.' if furnishing == 'furnished' else 'Available unfurnished for your personal touch.'} "
        f"Amenities include: {', '.join(amenities[:3])} and more."
    )

    days_ago = random.randint(0, 180)
    created = (datetime.utcnow() - timedelta(days=days_ago)).isoformat() + "Z"

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "category": category,
        "type": prop_type,
        "price": price,
        "price_period": price_period,
        "currency": currency,
        "location": f"{area}, {country}",
        "area": area,
        "lat": None,
        "lng": None,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "area_sqft": area_sqft,
        "furnishing": furnishing,
        "status": random.choice(["available", "available", "available", "rented", "sold"]),
        "featured": featured,
        "amenities": amenities,
        "images": images,
        "seo_title": f"{title} | Antilia Real Estate",
        "seo_description": description[:160],
        "created_at": created,
        "updated_at": created,
    }


def main():
    print("Generating 40 sample properties...")
    properties = [make_property(i) for i in range(40)]

    # Clear existing sample data
    print("Clearing existing properties...")
    supabase.table("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    # Insert in batches of 10
    for i in range(0, len(properties), 10):
        batch = properties[i : i + 10]
        result = supabase.table("properties").insert(batch).execute()
        print(f"Inserted batch {i // 10 + 1}: {len(result.data)} records")

    print(f"\n✅ Successfully seeded {len(properties)} properties!")


if __name__ == "__main__":
    main()
```

- [x] **Step 2: Install Python deps and run**

```bash
pip3 install supabase python-dotenv
python3 scripts/seed_properties.py
```

Expected output:
```
Generating 40 sample properties...
Clearing existing properties...
Inserted batch 1: 10 records
Inserted batch 2: 10 records
Inserted batch 3: 10 records
Inserted batch 4: 10 records
✅ Successfully seeded 40 properties!
```

- [x] **Step 3: Verify in Supabase via MCP**

Use `execute_sql` to confirm: `SELECT count(*) FROM properties;` returns 40.

- [x] **Step 4: Commit**

```bash
git add scripts/seed_properties.py supabase/
git commit -m "feat: seed script generating 40 UAE/Qatar sample properties"
```

---

## Task 8: React Router setup

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/PropertiesPage.tsx` (stub)
- Create: `src/pages/PropertyDetailPage.tsx` (stub)
- Create: `src/pages/AboutPage.tsx` (stub)
- Create: `src/pages/ContactPage.tsx` (stub)
- Create: `src/pages/admin/AdminLoginPage.tsx` (stub)
- Create: `src/pages/admin/AdminLayout.tsx` (stub)

- [x] **Step 1: Create HomePage wrapper**

```tsx
// src/pages/HomePage.tsx
import { useRef } from 'react';
import { Hero } from '@/components/Hero';
import { ServicesBento } from '@/components/ServicesBento';
import { Pourquoi } from '@/components/Pourquoi';
import { Process } from '@/components/Process';
import { Stats } from '@/components/Stats';
import { Testimonials } from '@/components/Testimonials';
import { Faq } from '@/components/Faq';
import { CtaFooter } from '@/components/CtaFooter';

export function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  return (
    <main>
      <Hero scrollRef={heroRef} />
      <ServicesBento />
      <Pourquoi />
      <Process />
      <Stats />
      <Testimonials />
      <Faq />
      <CtaFooter />
    </main>
  );
}
```

- [x] **Step 2: Create page stubs**

```tsx
// src/pages/PropertiesPage.tsx
export function PropertiesPage() {
  return <div className="min-h-screen pt-28 px-6"><h1 className="font-display text-4xl">Properties — coming in Plan B</h1></div>;
}

// src/pages/PropertyDetailPage.tsx
export function PropertyDetailPage() {
  return <div className="min-h-screen pt-28 px-6"><h1 className="font-display text-4xl">Property Detail — coming in Plan B</h1></div>;
}

// src/pages/AboutPage.tsx
export function AboutPage() {
  return <div className="min-h-screen pt-28 px-6"><h1 className="font-display text-4xl">About — coming in Plan C</h1></div>;
}

// src/pages/ContactPage.tsx
export function ContactPage() {
  return <div className="min-h-screen pt-28 px-6"><h1 className="font-display text-4xl">Contact — coming in Plan C</h1></div>;
}

// src/pages/admin/AdminLoginPage.tsx
export function AdminLoginPage() {
  return <div className="min-h-screen pt-28 px-6"><h1 className="font-display text-4xl">Admin Login — coming in Plan C</h1></div>;
}

// src/pages/admin/AdminLayout.tsx
import { Outlet } from 'react-router-dom';
export function AdminLayout() {
  return <div><Outlet /></div>;
}
```

- [x] **Step 3: Rewrite App.tsx with routes**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:slug" element={<PropertyDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          {/* Admin sub-routes added in Plan C */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [x] **Step 4: Update Navbar links to use React Router `<Link>`**

In `src/components/Navbar.tsx`, replace `<a href=...>` with `import { Link } from 'react-router-dom'` and `<Link to=...>`. Keep all existing styling.

- [x] **Step 5: Run dev server and verify all routes render**

```bash
pnpm dev
```

Visit: `http://localhost:5173/`, `/properties`, `/about`, `/contact`, `/admin/login` — all should render (stubs for non-home).

- [x] **Step 6: Run tests — still pass**

```bash
pnpm test:run
```

Expected: All existing tests still pass.

- [x] **Step 7: Commit**

```bash
git add src/App.tsx src/pages/ src/components/Navbar.tsx
git commit -m "feat: React Router v6 — route tree with page stubs"
```

---

## Task 9: Update docs + deploy foundation

**Files:**
- Modify: `/Volumes/PNYRP60PSSD/Users/pranav/Projects/32_Antilia_Real_Estate/PRD.md`
- Modify: `/Volumes/PNYRP60PSSD/Users/pranav/Projects/32_Antilia_Real_Estate/CLAUDE.md`
- Modify: `/Volumes/PNYRP60PSSD/Users/pranav/Projects/32_Antilia_Real_Estate/ROADMAP.md`

- [x] **Step 1: Update PRD.md** — Change scope to full site, all pages live, comprehensive filters, admin panel, sample data.

- [x] **Step 2: Update CLAUDE.md** — Update tech stack (Vite not Next.js), add project path (`antilia-landing/`), update phase constraints (all pages now in scope), update roadmap update protocol.

- [x] **Step 3: Update ROADMAP.md** — Mark foundation complete, add Plan B and Plan C as upcoming sprints.

- [x] **Step 4: Set Vercel env vars**

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_WHATSAPP_NUMBER production
```

- [x] **Step 5: Deploy**

```bash
git push origin main
vercel --prod
```

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: update PRD, CLAUDE.md, ROADMAP for full-site scope"
```

---

## Plan A Complete ✅

After Plan A, the project has:
- React Router v6 with all routes wired (stubs for non-home)
- Supabase client + schema deployed + 40 sample properties loaded
- `filterUtils.ts` with 100% test coverage
- `utils.ts` with helper functions
- TypeScript types for all entities
- Env vars on Vercel

**Next:** Plan B — Properties listing page + detail page + all filters + PropertyCard component
