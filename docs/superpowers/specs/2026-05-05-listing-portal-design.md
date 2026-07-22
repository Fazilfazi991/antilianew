# Listing Portal — Design Spec
**Date:** 2026-05-05
**Project:** Antilia Real Estate — antilia-landing
**Status:** Approved

---

## Overview

A self-serve property listing portal allowing property owners (third-party users) to sign up, submit listings, and manage them through a dedicated `/portal` section of the site. All submitted listings are gated behind admin approval before they appear on the public properties page. All enquiries route through Antilia's contact details — no user phone number is ever shown publicly. This enables Antilia to earn commission on deals closed through user-submitted listings.

---

## 1. Data Model

### Changes to `properties` table (migration 003)

| Column | Type | Default | Description |
|---|---|---|---|
| `owner_id` | `uuid REFERENCES auth.users(id)` | `NULL` | NULL for admin-created listings. Set to submitting user's auth UID for portal submissions. |
| `listing_status` | `text CHECK ('pending','approved','rejected')` | `'approved'` | Admin-created listings default to `approved`. User submissions start as `pending`. |
| `rejection_reason` | `text` | `NULL` | Optional note from admin on why a listing was rejected. Shown to user in portal. |

### New `profiles` table

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

No phone number field. All contact goes through Antilia's WhatsApp.

### Listing status lifecycle

```
[User submits]  →  pending
[Admin approves]  →  approved  →  visible on public /properties
[Admin rejects]  →  rejected   →  user sees rejection in portal, can edit + resubmit
[User edits approved/rejected listing]  →  pending  (re-enters review queue)
```

---

## 2. Access Control (RLS)

### Critical: Admin vs. Portal User Distinction

The existing RLS policies grant write access to ALL `authenticated` users. Portal users who sign up are also `authenticated`, so without changes they would have admin-level write access to every property. To fix this, migration 003 introduces an `admin_users` table that lists admin email addresses. Existing admin RLS policies are updated to check `auth.email() IN (SELECT email FROM admin_users)` instead of the bare `authenticated` role.

```sql
CREATE TABLE admin_users (
  email text PRIMARY KEY
);
-- Insert the Antilia admin email(s) here via Supabase dashboard or seed
```

### Public queries
- `SELECT` on `properties` filters to `listing_status = 'approved'` only
- Anon users can read approved listings

### Admin policies (updated)
- `INSERT/UPDATE/DELETE` on `properties`: only if `auth.email() IN (SELECT email FROM admin_users)`
- Approve/Reject: admin sets `listing_status` directly

### User (portal) policies
- `INSERT`: authenticated non-admin users can insert rows where `owner_id = auth.uid()` and `listing_status = 'pending'`
- `SELECT`: users can read rows where `owner_id = auth.uid()` (all statuses, so they see pending/rejected)
- `UPDATE`: users can update rows where `owner_id = auth.uid()`. The portal query always sets `listing_status = 'pending'` on update — enforced at the application layer, not a DB trigger.
- `DELETE`: users can delete rows where `owner_id = auth.uid()`

### `profiles` policies
- `SELECT/INSERT/UPDATE`: user can read and write only their own profile (`id = auth.uid()`)
- Admin: full access via `admin_users` check

---

## 3. Pages & Routes

### Public additions
| Location | Change |
|---|---|
| `Hero.tsx` | "List Your Property" CTA button → `/portal/login` |
| `Footer.tsx` | "List Your Property" link in nav column |

### Portal routes (`/portal/*`) — no Navbar/Footer wrapper
| Route | Page | Notes |
|---|---|---|
| `/portal/login` | `PortalLoginPage` | Email + password login. Link to signup. |
| `/portal/signup` | `PortalSignupPage` | Email + password signup. Creates `profiles` row on success. |
| `/portal` | `PortalDashboardPage` | Summary cards: total submitted, pending, approved, rejected. "Submit Property" CTA. |
| `/portal/listings` | `PortalListingsPage` | Table of user's own listings with status badges. Edit/Delete actions. |
| `/portal/listings/new` | `PortalListingFormPage` | Listing submission form. |
| `/portal/listings/:id/edit` | `PortalListingFormPage` | Edit form. Saving resets status to pending. |

### Admin additions (`/admin/*`)
| Route | Page | Notes |
|---|---|---|
| `/admin/listings` | `AdminPendingListingsPage` | Review queue. Shows all `pending` listings. Approve / Reject with optional note. |

---

## 4. Portal Listing Form

Same fields as the admin property form **except**:

**Excluded from user form (set automatically):**
- `slug` — auto-generated from title
- `featured` — always `false` for user submissions
- `status` — always `'available'`
- `listing_status` — always `'pending'`
- `owner_id` — always `auth.uid()`

**Included:**
- Title, description, category, type, price, currency, price period, location, area, bedrooms, bathrooms, sqft, furnishing, amenities, images (uploaded to Supabase Storage under `properties/{slug}/`)

---

## 5. User Flow

1. Visitor sees "List Your Property" on Hero or Footer
2. Clicks → `/portal/login` → creates account at `/portal/signup`
3. Supabase sends confirmation email → user confirms → lands on `/portal`
4. Submits listing at `/portal/listings/new` → `listing_status = pending`
5. Portal shows listing as **Pending Review**
6. Admin sees it in `/admin/listings` → Approves or Rejects
7. If approved: listing appears on public `/properties` with Antilia's contact only
8. If rejected: user sees **Rejected** badge + optional reason. Can edit → resubmit (→ pending again)
9. All enquiries on the listing use Antilia's WhatsApp number — user's phone is never shown

---

## 6. Commission Model

Commission handling is entirely offline. The portal presents no pricing, no fee, no commission terms to users. The portal is framed as a free listing service. Antilia's team handles commission negotiations directly when a deal closes.

---

## 7. Files Changed / Created

### New files
- `src/pages/portal/PortalLayout.tsx`
- `src/pages/portal/PortalLoginPage.tsx`
- `src/pages/portal/PortalSignupPage.tsx`
- `src/pages/portal/PortalDashboardPage.tsx`
- `src/pages/portal/PortalListingsPage.tsx`
- `src/pages/portal/PortalListingFormPage.tsx`
- `src/pages/admin/AdminPendingListingsPage.tsx`
- `src/lib/queries/portal.ts`
- `supabase/migrations/003_listing_portal.sql`

### Modified files
- `src/App.tsx` — add `/portal/*` routes
- `src/components/Hero.tsx` — add "List Your Property" CTA
- `src/components/Footer.tsx` — add "List Your Property" link
- `src/pages/admin/AdminLayout.tsx` — add "Pending Listings" nav item
- `src/lib/queries/properties.ts` — add `listing_status = approved` filter to public query
- `src/lib/types.ts` — add `listing_status`, `owner_id`, `rejection_reason` to `Property` type; add `Profile` interface
- `supabase/migrations/002_rls.sql` — update admin policies to use `admin_users` table check instead of bare `authenticated` role

---

## 8. Out of Scope

- Email notifications to users on approve/reject (user checks portal status)
- Google OAuth
- Listing fees or payment processing
- Property detail pages (existing Phase 2 placeholder)
- Commission tracking dashboard
