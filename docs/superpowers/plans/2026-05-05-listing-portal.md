# Listing Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-serve `/portal` section where property owners sign up, submit listings for admin approval, and manage their listings — with all enquiries routing through Antilia's contact details.

**Architecture:** Vite + React SPA with React Router DOM. Portal pages live under `/portal/*` with their own `PortalLayout` (no public Navbar/Footer). A new Supabase migration introduces `admin_users`, `profiles`, portal-specific columns on `properties`, and updated RLS policies that use `admin_users` to separate admin write access from portal user write access.

**Tech Stack:** React 18, TypeScript, React Router DOM v6, Supabase JS v2, Tailwind CSS v4, Lucide React icons, `motion/react` v12.

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `supabase/migrations/003_listing_portal.sql` | Schema changes, new tables, trigger, updated RLS |
| `src/lib/queries/portal.ts` | All portal-specific Supabase queries |
| `src/pages/portal/PortalLayout.tsx` | Auth guard + sidebar shell for all /portal/* routes |
| `src/pages/portal/PortalLoginPage.tsx` | Email + password sign-in form |
| `src/pages/portal/PortalSignupPage.tsx` | Email + password sign-up form |
| `src/pages/portal/PortalDashboardPage.tsx` | Summary cards: total/pending/approved/rejected counts |
| `src/pages/portal/PortalListingsPage.tsx` | Table of user's own listings with status badges + actions |
| `src/pages/portal/PortalListingFormPage.tsx` | Create/edit listing form (slug/featured/listing_status auto-set) |
| `src/pages/admin/AdminPendingListingsPage.tsx` | Admin review queue: list pending, approve/reject with note |

### Modified files
| File | Change |
|---|---|
| `src/lib/types.ts` | Add `listing_status`, `owner_id`, `rejection_reason` to `Property`; add `Profile` interface |
| `src/lib/queries/properties.ts` | Add `.eq('listing_status', 'approved')` filter to all public queries |
| `src/App.tsx` | Add `/portal/*` routes and `AdminPendingListingsPage` route |
| `src/components/Hero.tsx` | Add "List Your Property" CTA button below "Explore Properties" |
| `src/components/Footer.tsx` | Add "List Your Property" link in the Explore nav column |
| `src/pages/admin/AdminLayout.tsx` | Add "Pending Listings" nav item with `ClipboardList` icon |

---

## Task 1: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add new fields to `Property` interface and `Profile` interface**

Replace the existing `Property` interface and add `Profile` after `SiteSetting`:

```typescript
export type ListingStatus = 'pending' | 'approved' | 'rejected';

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: PropertyCategory;
  type: PropertyType;
  price: number;
  price_period: string;
  currency: string;
  location: string;
  area: string;
  lat: number | null;
  lng: number | null;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: Furnishing;
  status: PropertyStatus;
  featured: boolean;
  amenities: string[];
  images: PropertyImage[];
  seo_title: string | null;
  seo_description: string | null;
  // Portal fields — null for admin-created listings
  owner_id: string | null;
  listing_status: ListingStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Volumes/PNYRP60PSSD/Users/pranav/Projects/32_Antilia_Real_Estate/antilia-landing
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors (or only pre-existing errors unrelated to types.ts).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add listing_status, owner_id, rejection_reason to Property type; add Profile"
```

---

## Task 2: Write database migration

**Files:**
- Create: `supabase/migrations/003_listing_portal.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 003_listing_portal.sql
-- Adds admin_users table, profiles table, portal columns on properties,
-- a trigger to auto-create profiles, and updated RLS policies.

-- ──────────────────────────────────────────────────────
-- 1. Admin users table
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY
);

-- ──────────────────────────────────────────────────────
-- 2. Profiles table (one row per portal user)
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: auto-create a profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ──────────────────────────────────────────────────────
-- 3. Portal columns on properties
-- ──────────────────────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'approved'
    CHECK (listing_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ──────────────────────────────────────────────────────
-- 4. Drop old overly-permissive RLS policies
-- ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "properties_public_read"  ON properties;
DROP POLICY IF EXISTS "properties_auth_insert"  ON properties;
DROP POLICY IF EXISTS "properties_auth_update"  ON properties;
DROP POLICY IF EXISTS "properties_auth_delete"  ON properties;

-- ──────────────────────────────────────────────────────
-- 5. New properties RLS
-- ──────────────────────────────────────────────────────

-- Public: only approved listings are visible
CREATE POLICY "properties_public_read" ON properties
  FOR SELECT TO anon, authenticated
  USING (listing_status = 'approved');

-- Admin: full access (insert, update, delete) if email is in admin_users
CREATE POLICY "properties_admin_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY "properties_admin_update" ON properties
  FOR UPDATE TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY "properties_admin_delete" ON properties
  FOR DELETE TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

-- Admin: can read ALL listings regardless of status (for the review queue)
CREATE POLICY "properties_admin_read_all" ON properties
  FOR SELECT TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

-- Portal users: can insert their own listings (always pending)
CREATE POLICY "properties_portal_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND listing_status = 'pending'
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- Portal users: can read their own listings (all statuses)
CREATE POLICY "properties_portal_read_own" ON properties
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Portal users: can update their own listings
CREATE POLICY "properties_portal_update_own" ON properties
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- Portal users: can delete their own listings
CREATE POLICY "properties_portal_delete_own" ON properties
  FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid()
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- ──────────────────────────────────────────────────────
-- 6. Profiles RLS
-- ──────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_user_own" ON profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

-- ──────────────────────────────────────────────────────
-- 7. admin_users RLS (readable by authenticated for policy checks)
-- ──────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_authenticated_read" ON admin_users
  FOR SELECT TO authenticated
  USING (true);
```

- [ ] **Step 2: Commit the migration file**

```bash
git add supabase/migrations/003_listing_portal.sql
git commit -m "feat: add migration 003 — portal tables, columns, trigger, updated RLS"
```

---

## Task 3: Apply migration to Supabase

**Files:** (none — applies to remote DB)

- [ ] **Step 1: Apply via Supabase MCP**

Use `mcp__supabase__apply_migration` with:
- `project_id`: `cikluvzektbqsyrajjmg`
- `name`: `003_listing_portal`
- `query`: *(full SQL content from the migration file)*

- [ ] **Step 2: Insert the admin email into admin_users**

Use `mcp__supabase__execute_sql` with:
```sql
INSERT INTO admin_users (email) VALUES ('pranvkithkin11@gmail.com')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 3: Verify schema**

Use `mcp__supabase__execute_sql` with:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('owner_id', 'listing_status', 'rejection_reason')
ORDER BY column_name;
```

Expected: 3 rows showing the new columns.

---

## Task 4: Filter public property queries

**Files:**
- Modify: `src/lib/queries/properties.ts`

- [ ] **Step 1: Add `listing_status = approved` filter to all three public fetch functions**

`fetchProperties` is used by the public PropertiesPage and admin (admin will bypass RLS via a separate admin query later — for now, `fetchProperties` is only used on the public page). `fetchFeaturedProperties` feeds the homepage. `fetchPropertyBySlug` feeds the property detail page.

Replace the entire file:

```typescript
import { supabase } from '../supabase';
import type { Property } from '../types';

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('listing_status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .eq('listing_status', 'approved')
    .single();
  if (error) return null;
  return data as Property;
}

export async function fetchFeaturedProperties(limit = 6): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('listing_status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Property[];
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/properties.ts
git commit -m "feat: filter public property queries to listing_status=approved"
```

---

## Task 5: Write portal queries

**Files:**
- Create: `src/lib/queries/portal.ts`

- [ ] **Step 1: Write portal.ts**

```typescript
import { supabase } from '../supabase';
import type { Property, Profile, PropertyImage, ListingStatus } from '../types';
import { slugify } from '../utils';
import { uploadPropertyImage } from './admin';

// Re-export so portal form can use same uploader
export { uploadPropertyImage };

// ── Auth ──────────────────────────────────────────────

export async function portalSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function portalSignUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function portalSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Profile ───────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

// ── User listings ─────────────────────────────────────

export async function fetchMyListings(userId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function fetchMyListingById(id: string, userId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('owner_id', userId)
    .single();
  if (error) return null;
  return data as Property;
}

// ── Create / update / delete ──────────────────────────

type PortalFormData = {
  title: string;
  description: string;
  category: Property['category'];
  type: Property['type'];
  price: number;
  price_period: string;
  currency: string;
  location: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: Property['furnishing'];
  amenities: string[];
  images: PropertyImage[];
};

export async function createPortalListing(
  data: PortalFormData,
  userId: string
): Promise<Property> {
  const slug = slugify(data.title) + '-' + Math.random().toString(36).slice(2, 6);
  const { data: result, error } = await supabase
    .from('properties')
    .insert({
      ...data,
      slug,
      owner_id: userId,
      listing_status: 'pending',
      featured: false,
      status: 'available',
      lat: null,
      lng: null,
      seo_title: null,
      seo_description: null,
    })
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function updatePortalListing(
  id: string,
  data: Partial<PortalFormData>
): Promise<Property> {
  const { data: result, error } = await supabase
    .from('properties')
    .update({
      ...data,
      listing_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function deletePortalListing(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

// ── Admin: pending queue ──────────────────────────────

export async function fetchPendingListings(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('listing_status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function approveListing(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ listing_status: 'approved', rejection_reason: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectListing(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ listing_status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── Listing status summary ────────────────────────────

export async function fetchMyListingCounts(userId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const { data, error } = await supabase
    .from('properties')
    .select('listing_status')
    .eq('owner_id', userId);
  if (error) throw error;
  const rows = (data ?? []) as { listing_status: ListingStatus }[];
  return {
    total: rows.length,
    pending: rows.filter(r => r.listing_status === 'pending').length,
    approved: rows.filter(r => r.listing_status === 'approved').length,
    rejected: rows.filter(r => r.listing_status === 'rejected').length,
  };
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/portal.ts
git commit -m "feat: add portal queries (auth, listings, admin pending queue)"
```

---

## Task 6: PortalLayout — auth guard + sidebar

**Files:**
- Create: `src/pages/portal/PortalLayout.tsx`

- [ ] **Step 1: Write PortalLayout.tsx**

```tsx
import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListFilter, PlusCircle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { portalSignOut } from '@/lib/queries/portal';

const NAV = [
  { to: '/portal',          label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { to: '/portal/listings', label: 'My Listings',  icon: ListFilter,      exact: false },
  { to: '/portal/listings/new', label: 'Submit Property', icon: PlusCircle, exact: false },
];

export function PortalLayout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/portal/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  async function handleSignOut() {
    try {
      await portalSignOut();
      navigate('/portal/login', { replace: true });
    } catch {
      // non-fatal
    }
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 bg-[#0e0e0e] flex flex-col pt-8 pb-6 px-4">
        <div className="mb-10 px-2">
          <Link to="/">
            <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-9 w-auto" />
          </Link>
          <p className="font-label-caps text-label-caps text-white/25 mt-2 uppercase tracking-[0.12em]">
            List Portal
          </p>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== '/portal';
            const isPortalRoot = item.to === '/portal' && item.exact;
            const isActive = isPortalRoot
              ? location.pathname === '/portal'
              : active;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 font-label-caps text-label-caps uppercase tracking-[0.08em] transition-colors ${
                  isActive
                    ? 'text-white border-l-2 border-white pl-[10px]'
                    : 'text-white/40 hover:text-white/70 border-l-2 border-transparent pl-[10px]'
                }`}
              >
                <item.icon className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 font-label-caps text-label-caps text-white/25 hover:text-white/50 uppercase tracking-[0.08em] transition-colors border-l-2 border-transparent pl-[10px]"
        >
          <LogOut className="size-3.5 shrink-0" />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 overflow-auto min-h-screen bg-background">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/portal/PortalLayout.tsx
git commit -m "feat: add PortalLayout with dark sidebar and auth guard"
```

---

## Task 7: PortalLoginPage + PortalSignupPage

**Files:**
- Create: `src/pages/portal/PortalLoginPage.tsx`
- Create: `src/pages/portal/PortalSignupPage.tsx`

- [ ] **Step 1: Write PortalLoginPage.tsx**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { portalSignIn } from '@/lib/queries/portal';

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

export function PortalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await portalSignIn(email, password);
      navigate('/portal', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block mb-10">
          <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-10 w-auto invert" />
        </Link>

        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Property Portal
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-10">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Password
            </label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="font-body-md text-body-md text-error border-b border-error pb-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em]">
          No account?{' '}
          <Link to="/portal/signup" className="text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write PortalSignupPage.tsx**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { portalSignUp } from '@/lib/queries/portal';

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

export function PortalSignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await portalSignUp(email, password, fullName);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="size-10 text-primary mx-auto mb-6" />
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Check your email</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link
            to="/portal/login"
            className="inline-block px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block mb-10">
          <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-10 w-auto invert" />
        </Link>

        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Property Portal
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-10">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Full Name
            </label>
            <input
              type="text"
              className={inputClass}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Password
            </label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <p className="font-body-md text-body-md text-error border-b border-error pb-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em]">
          Already have an account?{' '}
          <Link to="/portal/login" className="text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/portal/PortalLoginPage.tsx src/pages/portal/PortalSignupPage.tsx
git commit -m "feat: add PortalLoginPage and PortalSignupPage"
```

---

## Task 8: PortalDashboardPage

**Files:**
- Create: `src/pages/portal/PortalDashboardPage.tsx`

- [ ] **Step 1: Write PortalDashboardPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyListingCounts } from '@/lib/queries/portal';

type Counts = { total: number; pending: number; approved: number; rejected: number };

const STAT_COLORS: Record<string, string> = {
  pending:  'text-amber-600',
  approved: 'text-emerald-600',
  rejected: 'text-red-500',
};

export function PortalDashboardPage() {
  const { session } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) return;
    fetchMyListingCounts(session.user.id)
      .then(setCounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  return (
    <div className="px-10 py-10 max-w-4xl">
      <div className="flex items-end justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            Property Portal
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
        </div>
        <Link
          to="/portal/listings/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          Submit Property
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : counts && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-variant mb-12">
            {[
              { label: 'Total Submitted', value: counts.total, color: 'text-primary' },
              { label: 'Pending Review',  value: counts.pending,  color: STAT_COLORS.pending },
              { label: 'Approved',        value: counts.approved, color: STAT_COLORS.approved },
              { label: 'Rejected',        value: counts.rejected, color: STAT_COLORS.rejected },
            ].map(stat => (
              <div key={stat.label} className="bg-background p-6">
                <p className={`font-headline-lg text-headline-lg ${stat.color} mb-1`}>
                  {stat.value}
                </p>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="border border-surface-variant p-6">
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-4">
              How It Works
            </p>
            <ol className="space-y-3">
              {[
                'Submit your property — our team reviews it within 1–2 business days.',
                'Once approved, your listing appears on the Antilia properties page.',
                'All enquiries come through Antilia — we handle negotiations and close the deal.',
              ].map((step, i) => (
                <li key={i} className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                  <span className="font-label-caps text-label-caps text-outline shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/portal/PortalDashboardPage.tsx
git commit -m "feat: add PortalDashboardPage with listing counts"
```

---

## Task 9: PortalListingsPage

**Files:**
- Create: `src/pages/portal/PortalListingsPage.tsx`

- [ ] **Step 1: Write PortalListingsPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyListings, deletePortalListing } from '@/lib/queries/portal';
import { formatPrice } from '@/lib/utils';
import type { Property, ListingStatus } from '@/lib/types';

const STATUS_LABEL: Record<ListingStatus, string> = {
  pending:  'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};
const STATUS_COLOR: Record<ListingStatus, string> = {
  pending:  'text-amber-600',
  approved: 'text-emerald-600',
  rejected: 'text-red-500',
};

export function PortalListingsPage() {
  const { session } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    fetchMyListings(session.user.id)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deletePortalListing(id);
      setListings(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="px-10 py-10 max-w-6xl">
      <div className="flex items-end justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            {loading ? '…' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">My Listings</h1>
        </div>
        <Link
          to="/portal/listings/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          Submit Property
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="text-center py-20 border border-surface-variant">
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            You haven't submitted any properties yet.
          </p>
          <Link
            to="/portal/listings/new"
            className="font-label-caps text-label-caps text-primary border-b border-primary pb-0.5 uppercase tracking-[0.08em]"
          >
            Submit your first property →
          </Link>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="border border-surface-variant overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low">
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Property</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden md:table-cell">Price</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Status</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(p => (
                <tr key={p.id} className="border-b border-surface-variant hover:bg-surface-container-low transition-colors last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.images[0] && (
                        <img
                          src={p.images.find(i => i.is_primary)?.url ?? p.images[0].url}
                          alt=""
                          className="size-10 object-cover shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-body-md text-body-md text-primary line-clamp-1">{p.title}</p>
                        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em]">
                          {p.area}, {p.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {formatPrice(p.price, p.currency, p.price_period)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <span className={`font-label-caps text-label-caps uppercase tracking-[0.06em] ${STATUS_COLOR[p.listing_status]}`}>
                        {STATUS_LABEL[p.listing_status]}
                      </span>
                      {p.listing_status === 'rejected' && p.rejection_reason && (
                        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.04em] mt-0.5 text-xs">
                          {p.rejection_reason}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/portal/listings/${p.id}/edit`}
                        className="p-2 text-outline hover:text-primary transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        disabled={deleting === p.id}
                        className="p-2 text-outline hover:text-error transition-colors disabled:opacity-30"
                        aria-label="Delete"
                      >
                        {deleting === p.id
                          ? <Loader2 className="size-4 animate-spin" />
                          : <Trash2 className="size-4" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/portal/PortalListingsPage.tsx
git commit -m "feat: add PortalListingsPage with status badges and delete"
```

---

## Task 10: PortalListingFormPage

**Files:**
- Create: `src/pages/portal/PortalListingFormPage.tsx`

- [ ] **Step 1: Write PortalListingFormPage.tsx**

```tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  createPortalListing,
  updatePortalListing,
  fetchMyListingById,
  uploadPropertyImage,
} from '@/lib/queries/portal';
import type { Property, PropertyCategory, PropertyType, Furnishing, PropertyImage } from '@/lib/types';

type FormData = {
  title: string;
  description: string;
  category: PropertyCategory;
  type: PropertyType;
  price: number;
  price_period: string;
  currency: string;
  location: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: Furnishing;
  amenities: string[];
  images: PropertyImage[];
};

const EMPTY: FormData = {
  title: '',
  description: '',
  category: 'rent',
  type: 'apartment',
  price: 0,
  price_period: 'per year',
  currency: 'AED',
  location: 'Dubai',
  area: '',
  bedrooms: 1,
  bathrooms: 1,
  area_sqft: 0,
  furnishing: 'unfurnished',
  amenities: [],
  images: [],
};

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';
const selectClass =
  'w-full bg-background border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary appearance-none cursor-pointer transition-colors duration-300';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-surface-variant p-6 space-y-5">
      <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] pb-4 border-b border-surface-variant">
        {title}
      </p>
      {children}
    </section>
  );
}

export function PortalListingFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuth();

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !id || !session?.user.id) return;
    fetchMyListingById(id, session.user.id).then(found => {
      if (found) {
        const { title, description, category, type, price, price_period, currency,
                location, area, bedrooms, bathrooms, area_sqft, furnishing,
                amenities, images } = found;
        setForm({ title, description, category, type, price, price_period, currency,
                  location, area, bedrooms, bathrooms, area_sqft, furnishing,
                  amenities, images });
      }
      setLoading(false);
    });
  }, [id, isEdit, session?.user.id]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    const slug = 'portal-' + (session?.user.id?.slice(0, 8) ?? 'user');
    try {
      const uploaded: PropertyImage[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadPropertyImage(file, slug);
        uploaded.push({ url, alt: form.title || file.name, order: form.images.length + uploaded.length, is_primary: false });
      }
      setForm(prev => {
        const newImages = [...prev.images, ...uploaded];
        if (newImages.length > 0 && !newImages.some(i => i.is_primary)) {
          newImages[0] = { ...newImages[0], is_primary: true };
        }
        return { ...prev, images: newImages };
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm(prev => {
      const next = prev.images.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some(i => i.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return { ...prev, images: next };
    });
  }

  function setPrimary(index: number) {
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, is_primary: i === index })),
    }));
  }

  function addAmenity() {
    const trimmed = amenityInput.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      set('amenities', [...form.amenities, trimmed]);
    }
    setAmenityInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user.id) return;
    setSaving(true);
    setError('');
    try {
      if (isEdit && id) {
        await updatePortalListing(id, form);
      } else {
        await createPortalListing(form, session.user.id);
      }
      navigate('/portal/listings');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-10 py-10 max-w-4xl">
      <div className="flex items-center gap-5 mb-12 pb-6 border-b border-surface-variant">
        <Link
          to="/portal/listings"
          className="flex items-center justify-center w-9 h-9 border border-surface-variant hover:border-primary transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-on-surface-variant" />
        </Link>
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-1">
            {isEdit ? 'Edit' : 'New'}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            {isEdit ? 'Edit Listing' : 'Submit Property'}
          </h1>
        </div>
      </div>

      <div className="mb-6 border border-surface-variant p-4 bg-surface-container-low">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em]">
          Your listing will be reviewed by our team before appearing on the site. All enquiries will route through Antilia's contact details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Basic Info">
          <Field label="Title *">
            <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Modern Apartment in Downtown Dubai" />
          </Field>

          <div className="grid grid-cols-2 gap-6">
            <Field label="Category *">
              <select className={selectClass} value={form.category} onChange={e => set('category', e.target.value as PropertyCategory)}>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
                <option value="commercial">Commercial</option>
              </select>
            </Field>
            <Field label="Property Type *">
              <select className={selectClass} value={form.type} onChange={e => set('type', e.target.value as PropertyType)}>
                {['apartment','villa','townhouse','studio','penthouse','duplex','compound','shop','office','warehouse'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea className={inputClass + ' resize-none h-28'} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the property…" />
          </Field>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-3 gap-6">
            <Field label="Price *">
              <input className={inputClass} type="number" value={form.price || ''} onChange={e => set('price', Number(e.target.value))} required min={0} />
            </Field>
            <Field label="Currency">
              <select className={selectClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="AED">AED</option>
                <option value="QAR">QAR</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="Period">
              <select className={selectClass} value={form.price_period} onChange={e => set('price_period', e.target.value)}>
                <option value="per year">Per Year</option>
                <option value="per month">Per Month</option>
                <option value="asking price">Asking Price</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-2 gap-6">
            <Field label="City *">
              <select className={selectClass} value={form.location} onChange={e => set('location', e.target.value)}>
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Doha">Doha</option>
                <option value="Sharjah">Sharjah</option>
              </select>
            </Field>
            <Field label="Area / Neighbourhood *">
              <input className={inputClass} value={form.area} onChange={e => set('area', e.target.value)} required placeholder="e.g. Downtown, JBR, Pearl" />
            </Field>
          </div>
        </Section>

        <Section title="Specifications">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Field label="Bedrooms">
              <input className={inputClass} type="number" min={0} value={form.bedrooms} onChange={e => set('bedrooms', Number(e.target.value))} />
            </Field>
            <Field label="Bathrooms">
              <input className={inputClass} type="number" min={0} value={form.bathrooms} onChange={e => set('bathrooms', Number(e.target.value))} />
            </Field>
            <Field label="Area (sqft)">
              <input className={inputClass} type="number" min={0} value={form.area_sqft || ''} onChange={e => set('area_sqft', Number(e.target.value))} />
            </Field>
            <Field label="Furnishing">
              <select className={selectClass} value={form.furnishing} onChange={e => set('furnishing', e.target.value as Furnishing)}>
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Amenities">
          <div className="flex gap-3">
            <input
              className={inputClass + ' flex-1'}
              value={amenityInput}
              onChange={e => setAmenityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
              placeholder="e.g. Pool, Gym, Parking…"
            />
            <button type="button" onClick={addAmenity} className="px-5 py-2 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors shrink-0">
              Add
            </button>
          </div>
          {form.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.amenities.map(a => (
                <span key={a} className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.06em] px-3 py-1.5 border border-surface-variant">
                  {a}
                  <button type="button" onClick={() => set('amenities', form.amenities.filter(x => x !== a))} className="text-outline hover:text-primary ml-1">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Images">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2.5 px-5 py-3 border border-dashed border-outline-variant hover:border-primary font-label-caps text-label-caps text-on-surface-variant hover:text-primary uppercase tracking-[0.08em] transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? 'Uploading…' : 'Upload Images'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img.url} alt={img.alt} className={`w-full aspect-square object-cover border-2 transition-colors ${img.is_primary ? 'border-primary' : 'border-transparent'}`} />
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                    <button type="button" onClick={() => setPrimary(i)} className="p-1.5 bg-background text-on-surface-variant hover:text-primary transition-colors">
                      <Star className="size-3.5" fill={img.is_primary ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => removeImage(i)} className="p-1.5 bg-background text-on-surface-variant hover:text-error transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {error && (
          <p className="font-body-md text-body-md text-error border-b border-error pb-3">{error}</p>
        )}

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Resubmit for Review' : 'Submit for Review'}
          </button>
          <Link to="/portal/listings" className="px-8 py-3.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em] hover:border-primary hover:text-primary transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/portal/PortalListingFormPage.tsx
git commit -m "feat: add PortalListingFormPage for creating/editing user listings"
```

---

## Task 11: AdminPendingListingsPage

**Files:**
- Create: `src/pages/admin/AdminPendingListingsPage.tsx`

- [ ] **Step 1: Write AdminPendingListingsPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { fetchPendingListings, approveListing, rejectListing } from '@/lib/queries/portal';
import { formatPrice, getPrimaryImage } from '@/lib/utils';
import type { Property } from '@/lib/types';

export function AdminPendingListingsPage() {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectForm, setRejectForm] = useState<{ id: string; reason: string } | null>(null);

  useEffect(() => {
    fetchPendingListings()
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActing(id);
    try {
      await approveListing(id);
      setListings(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setActing(null);
    }
  }

  async function handleReject() {
    if (!rejectForm) return;
    setActing(rejectForm.id);
    try {
      await rejectListing(rejectForm.id, rejectForm.reason);
      setListings(prev => prev.filter(p => p.id !== rejectForm.id));
      setRejectForm(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="px-10 py-10 max-w-6xl">
      <div className="flex items-end justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            {loading ? '…' : `${listings.length} pending`}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Pending Listings</h1>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="text-center py-20 border border-surface-variant">
          <p className="font-body-md text-body-md text-on-surface-variant">No pending listings. You're all caught up.</p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="space-y-4">
          {listings.map(p => (
            <div key={p.id} className="border border-surface-variant overflow-hidden">
              <div className="flex gap-5 p-5">
                {p.images.length > 0 && (
                  <img src={getPrimaryImage(p)} alt="" className="w-28 h-20 object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline-md text-headline-md text-primary mb-1 truncate">{p.title}</h3>
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em] mb-2">
                    {p.area}, {p.location} · {p.category} · {p.type}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-3 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-outline font-label-caps text-label-caps uppercase tracking-[0.06em]">
                    <span>{formatPrice(p.price, p.currency, p.price_period)}</span>
                    {p.category !== 'commercial' && (
                      <>
                        <span>{p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} Beds`}</span>
                        <span>{p.bathrooms} Baths</span>
                      </>
                    )}
                    <span>{p.area_sqft.toLocaleString()} sqft</span>
                    <span>{p.furnishing}</span>
                  </div>
                  {p.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.amenities.map(a => (
                        <span key={a} className="px-2 py-0.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.04em] text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 border-t border-surface-variant bg-surface-container-low">
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={acting === p.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.08em] hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  {acting === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => setRejectForm({ id: p.id, reason: '' })}
                  disabled={acting === p.id}
                  className="flex items-center gap-2 px-5 py-2.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-error hover:text-error disabled:opacity-50 transition-colors"
                >
                  <XCircle className="size-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-background w-full max-w-md p-8 space-y-5">
            <h2 className="font-headline-md text-headline-md text-primary">Reject Listing</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Optionally provide a reason. The user will see this in their portal.
            </p>
            <textarea
              className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none p-3 font-body-md text-body-md text-primary resize-none h-24 placeholder:text-outline-variant"
              placeholder="e.g. Images are too low resolution…"
              value={rejectForm.reason}
              onChange={e => setRejectForm(prev => prev ? { ...prev, reason: e.target.value } : null)}
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!!acting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.08em] hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                {acting ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirm Reject
              </button>
              <button
                onClick={() => setRejectForm(null)}
                className="px-6 py-3 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminPendingListingsPage.tsx
git commit -m "feat: add AdminPendingListingsPage with approve/reject modal"
```

---

## Task 12: Wire up routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add portal imports and routes**

Replace the entire `App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminPropertiesPage } from '@/pages/admin/AdminPropertiesPage';
import { AdminPropertyFormPage } from '@/pages/admin/AdminPropertyFormPage';
import { AdminPendingListingsPage } from '@/pages/admin/AdminPendingListingsPage';
import { PortalLayout } from '@/pages/portal/PortalLayout';
import { PortalLoginPage } from '@/pages/portal/PortalLoginPage';
import { PortalSignupPage } from '@/pages/portal/PortalSignupPage';
import { PortalDashboardPage } from '@/pages/portal/PortalDashboardPage';
import { PortalListingsPage } from '@/pages/portal/PortalListingsPage';
import { PortalListingFormPage } from '@/pages/portal/PortalListingFormPage';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/properties" element={<PublicLayout><PropertiesPage /></PublicLayout>} />
        <Route path="/properties/:slug" element={<PublicLayout><PropertyDetailPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="properties/new" element={<AdminPropertyFormPage />} />
          <Route path="properties/:id/edit" element={<AdminPropertyFormPage />} />
          <Route path="listings" element={<AdminPendingListingsPage />} />
        </Route>

        {/* Portal */}
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal/signup" element={<PortalSignupPage />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboardPage />} />
          <Route path="listings" element={<PortalListingsPage />} />
          <Route path="listings/new" element={<PortalListingFormPage />} />
          <Route path="listings/:id/edit" element={<PortalListingFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /portal/* and /admin/listings routes to App.tsx"
```

---

## Task 13: Add "Pending Listings" to AdminLayout nav

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Add nav item**

In `AdminLayout.tsx`, update the `NAV` array and import:

```tsx
import { LayoutDashboard, Building2, ClipboardList, LogOut, Loader2 } from 'lucide-react';

const NAV = [
  { to: '/admin',          label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { to: '/admin/properties', label: 'Properties',     icon: Building2,       exact: false },
  { to: '/admin/listings',   label: 'Pending Listings', icon: ClipboardList, exact: false },
];
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/pages/admin/AdminLayout.tsx
git commit -m "feat: add Pending Listings nav item to AdminLayout"
```

---

## Task 14: Add "List Your Property" CTA to Hero

**Files:**
- Modify: `src/components/Hero.tsx`

- [ ] **Step 1: Add a secondary CTA button below "Explore Properties"**

In `Hero.tsx`, add a second `motion.div` + `Link` after the existing "Explore Properties" button. The two buttons sit in a `flex gap-3` wrapper:

Replace the existing single `motion.div` CTA block:

```tsx
<motion.div
  className="flex flex-col sm:flex-row gap-3"
  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: words.length * 0.1 + 0.25, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
>
  <motion.div whileHover={reduced ? {} : { scale: 1.03 }} whileTap={reduced ? {} : { scale: 0.97 }}>
    <Link
      to="/properties"
      className="inline-block bg-[#F9F8F6] text-[#121212] px-8 py-4 font-label-caps text-label-caps tracking-[0.1em] uppercase hover:bg-[#A68966] hover:text-white transition-colors duration-300"
    >
      Explore Properties
    </Link>
  </motion.div>
  <motion.div whileHover={reduced ? {} : { scale: 1.03 }} whileTap={reduced ? {} : { scale: 0.97 }}>
    <Link
      to="/portal/login"
      className="inline-block border border-[#F9F8F6]/40 text-[#F9F8F6] px-8 py-4 font-label-caps text-label-caps tracking-[0.1em] uppercase hover:border-[#A68966] hover:text-[#A68966] transition-colors duration-300"
    >
      List Your Property
    </Link>
  </motion.div>
</motion.div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat: add List Your Property CTA to Hero"
```

---

## Task 15: Add "List Your Property" link to Footer

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Add link to NAV_LINKS array**

In `Footer.tsx`, add the portal link to `NAV_LINKS`:

```typescript
const NAV_LINKS = [
  { label: "Properties", href: "/properties" },
  { label: "Buy",        href: "/properties?category=buy" },
  { label: "Rent",       href: "/properties?category=rent" },
  { label: "Commercial", href: "/properties?category=commercial" },
  { label: "About",      href: "/about" },
  { label: "Contact",    href: "/contact" },
  { label: "List Your Property", href: "/portal/login" },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: add List Your Property link to Footer nav"
```

---

## Task 16: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the happy path**

1. Go to `http://localhost:5173` — verify "List Your Property" appears in Hero and Footer.
2. Click "List Your Property" → lands on `/portal/login` (no nav/footer wrapper).
3. Click "Create one" → `/portal/signup` — fill form, submit → see "Check your email" screen.
4. Confirm email in inbox → back to `/portal/login` → sign in → lands on `/portal` dashboard.
5. Submit a listing at `/portal/listings/new` — fill all fields, upload at least one image → click "Submit for Review".
6. Verify listing appears in `/portal/listings` with "Pending Review" badge.
7. Open `/admin/listings` (as admin) → listing is visible with full details.
8. Approve it → listing disappears from pending queue.
9. Go to `/properties` (public) → listing appears.
10. In portal → listing shows "Approved" badge.

- [ ] **Step 3: Test rejection flow**

1. Submit a second listing.
2. In admin `/admin/listings` → click "Reject" → enter reason → "Confirm Reject".
3. In portal → listing shows "Rejected" + the reason text.
4. Click Edit → form opens → make changes → click "Resubmit for Review" → listing returns to Pending.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete listing portal — portal pages, admin queue, CTAs, updated RLS"
```
