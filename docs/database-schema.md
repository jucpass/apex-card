# Apex Card Database Schema

This document explains the initial Prisma schema for the Apex Card MVP.

The schema lives at:

```text
packages/database/prisma/schema.prisma
```

The database provider is PostgreSQL and Prisma is configured for Supabase PostgreSQL.

Prisma reads:

- `DATABASE_URL` for the Supabase transaction-mode pooler used by the application at runtime.
- `DIRECT_URL` for the direct Supabase PostgreSQL connection used by Prisma migrations.

Do not commit real database credentials. Keep Supabase service role keys server-only and do not expose them to the Expo mobile app, the admin frontend, or browser bundles.

Use the root `.env` file only. Prisma commands should be run through the root `pnpm db:*` scripts so they load `./.env` and use `packages/database/prisma/schema.prisma`.

The Express API in `packages/api` imports the shared Prisma singleton from `@apex/database`. The database package exports that client from `packages/database/src/index.ts`, backed by `packages/database/src/client.ts`, so API code should reuse that export instead of creating new `PrismaClient` instances.

API-facing DTOs and contracts live in `@apex-card/shared`. That package deliberately excludes Prisma Client and generated Prisma runtime types so browser and mobile apps can consume contracts without crossing the database boundary.

Run the API from the repository root:

```bash
pnpm api:dev
```

Useful connection checks:

- `GET http://localhost:4000/health`
- `GET http://localhost:4000/api/meta` with an Admin Web Supabase bearer token

MVP setup data for countries, cities, and categories is now manageable from the temporary admin web tool in `apps/admin-web`. Start the API with `pnpm api:dev`, start the admin app with `pnpm admin:dev`, and set `VITE_API_BASE_URL` in `apps/admin-web/.env` when the API is not running on `http://127.0.0.1:4000`.

The admin setup endpoints live under `/api/admin/*`. They now require a valid Supabase Auth access token from the Admin Web session, a linked Prisma `User`, `ACTIVE` account status, and an `ADMIN` or `SUPER_ADMIN` role.

Set `FIRST_SUPER_ADMIN_EMAIL` in the server environment only when bootstrapping the first administrator. If an authenticated Supabase user with that email has no Prisma `User` yet, the API can create and link the first `SUPER_ADMIN`. Remove or leave the value unset after bootstrap.

## MVP Models

### Users

`User` stores app users, administrators, and partner users.

Key fields:

- `supabaseAuthId` links the Prisma application profile to the Supabase Auth identity.
- `email`, `phone`, and `fullName`
- `dateOfBirth`, `profilePhoto`, and `language`
- `role` using `UserRole`
- `status` using `UserStatus`
- optional `homeCountryId`

The home country is optional and does not restrict where a user can redeem discounts.

### Memberships

`Membership` stores RevenueCat subscription/entitlement state plus the membership plan assigned to a member. A member has **exactly one** `Membership` row and **exactly one** membership plan at a time — never a combination of plans, and never a plan that contradicts whether they're actually subscribed.

Key fields:

- `type` using `MembershipType` — **which plan is the member on?** The only stored membership concept. Values: `FREE` (no plan — the member is not subscribed and has not been granted access), `PREMIUM` (€5.00/month), `STUDENT` (€2.50/month), `WORKER` (€3.50/month). Pricing is for future RevenueCat/billing integration only and must not be displayed in the Admin Portal yet.
- `isManuallyGranted` — `true` when an administrator set the current `type` by hand (via the Grant action), as opposed to (in the future) RevenueCat driving it from a real purchase. Never `true` when `type = FREE`.
- `expiresAt` — when the current plan's access ends. `null` means **unlimited** (stays active until revoked/cancelled). Ignored when `type = FREE`.
- `cancelledAt` — when the current plan was cancelled/revoked. `null` means not cancelled.
- `currentPeriodStart` / `currentPeriodEnd` — reserved for a future real RevenueCat billing period; not used by the current admin-driven flow.
- `revenueCatCustomerId`, `revenueCatEntitlement`, `revenueCatProductId`, `revenueCatOriginalAppUserId` — reserved for RevenueCat sync, not used yet.

Defined once, in `packages/shared/src/constants/membership.ts` (`membershipTypes` / `MembershipType`), and reused by the Prisma enum, the API, and the Admin Portal — add a future plan (e.g. Family, Business, VIP) by extending that single list plus the Prisma enum, nothing else.

#### Membership Status is computed, not stored

There is **no stored "status" column**. **Membership Status** (`ACTIVE` / `EXPIRED` / `CANCELLED`) is derived, on read, from `type`, `expiresAt`, and `cancelledAt`:

- `type = FREE` → no status (a Free member has no plan to have a status).
- `cancelledAt` is set → `CANCELLED`.
- `expiresAt` is set and in the past → `EXPIRED`.
- otherwise → `ACTIVE` (covers both "unlimited" and "expires in the future").

This is deliberate: a stored status column can drift out of sync with the dates that actually determine it (the earlier design allowed exactly that — e.g. `status = EXPIRED` with no `expiresAt` at all). Computing it removes that entire class of invalid combination, and stays compatible with a future RevenueCat webhook handler, which would just update `expiresAt`/`cancelledAt`/`type` — the status keeps computing correctly with no separate field to keep in sync.

**Membership Type** and **Membership Status** answer different questions ("which plan?" vs. "is it currently active?") and must never be conflated in the UI — but unlike the type, status is never itself stored or directly edited.

#### Admin actions

- **Grant** (`POST .../membership/grant`) — sets `type` to one of `PREMIUM`/`STUDENT`/`WORKER` (never `FREE`) plus a duration (`expiresAt` or unlimited/`null`), sets `isManuallyGranted = true`, clears `cancelledAt`. Only path that can move a member off `FREE`.
- **Revoke** (`POST .../membership/revoke`) — sets `cancelledAt = now`, leaves `type` untouched (a cancelled Premium membership still shows as Premium, with a Cancelled status — it does not revert to Free).
- **Reset to Free** (`POST .../membership/reset`) — sets `type = FREE`, `isManuallyGranted = false`, clears `expiresAt`/`cancelledAt`. The only path back to Free once a plan has been granted.
- **Edit** (`PATCH .../membership`) — changes `type` (among the paid plans) and/or duration for a member who already has a non-`FREE` type; not usable to newly leave `FREE` (that's Grant's job) and does not touch `cancelledAt` (that's Revoke's/Reset's job).

`type` was previously modelled as two booleans (`isStudent`, `isWorker`) and, before that, briefly as a separate stored `MembershipStatus` enum with values like `GRANTED`/`CANCELLED`. Both representations allowed invalid combinations (e.g. a `FREE` status alongside a `STUDENT` type) — see the app-log entries from earlier Members Management iterations. The model above replaces both.

### Countries, Cities, And Categories

`Country`, `City`, and `Category` support admin-managed marketplace structure.

Countries contain cities. Partners belong to a country, may belong to a city, and must belong to a category.

#### Global countries vs. Apex Card supported countries

There is a single `Country` table — not two. A country record always represents a real-world
country and may be used anywhere a country needs to be chosen (member nationality, member
country of residence, address forms), regardless of whether Apex Card currently operates
there. Apex Card–specific availability is layered on top via dedicated fields rather than
overloading `active`:

- `active` — global/master-data status. A deactivated country is a deprecated/invalid record
  kept only for historical references; new records should generally not select it. This is
  intentionally independent of the fields below.
- `availableForPartners` (default `false`) — whether new Partners can be registered/assigned
  to this country. A brand-new country is **not** available for Partners until an admin
  explicitly enables it.
- `visibleInExplore` (default `false`) — whether this country appears as a destination in the
  mobile Explore screen. Enforced server-side: a country can only be set `visibleInExplore`
  while `active` and while it has a destination image (`imagePath`) — attempting otherwise
  returns a 400. Removing the image automatically clears `visibleInExplore` rather than
  leaving an inconsistent "visible but imageless" state.
- `featured` (default `false`) — highlights a country within the Explore destinations list.
  Meaningful only alongside `visibleInExplore`, but stored independently.
- `displayOrder` (default `0`) — explicit sort order for Explore/featured destinations.
- `region` (optional) — a curated grouping (`packages/shared/src/constants/countryRegions.ts`:
  `europe | africa | americas | asia | oceania | middle-east`) for a future regional Explore
  layout. Not required.

Each consumer should use the list/query shape that matches its purpose: a plain full list
(`GET /api/admin/countries/options`, ordered `active` countries only, `{id, name, code}`) for
member/City selectors; `GET /api/admin/countries/partner-enabled` for a future Partner country
selector; the paginated, richly-filterable `GET /api/admin/countries` for the admin management
table. None of these should be used interchangeably — the options/partner-enabled lists are
deliberately unpaginated since they back small dropdowns, not tables.

**Why one table, not a separate market/destination model:** every place that already
references a country (`User.homeCountryId`, `Partner.countryId`, `City.countryId`,
`PromoBanner`) needs the *same* identity — a second "destination" table would require
duplicating or syncing that identity, and would still need a name/code for a country that
doesn't yet exist in Apex Card destinations. Extending `Country` with nullable/defaulted
availability fields is the smaller, DB-consistent change and avoids a join layer with no
independent purpose.

#### Country images

Destination images use Supabase Storage (bucket `country-media`, created on first use if it
doesn't already exist), object path `countries/{countryId}/{uuid}.{ext}` — a stable Storage
path is stored in `Country.imagePath`, never a bare public URL, because bucket/CDN URLs can
change; the API derives the public URL from the path at read time
(`packages/api/src/lib/supabaseAdmin.ts`). Uploads/deletes always run through the API server
using `SUPABASE_SERVICE_ROLE_KEY` — the service-role key is never sent to Admin Web. Replacing
an image deletes the previous Storage object after the new one is confirmed persisted.

#### Cities

A `City` always belongs to exactly one `Country` (`@@unique([countryId, slug])`). City names
and slugs may repeat across different countries (e.g. two countries can each have a
"Santa Cruz") but must be unique within the same country — enforced by that composite unique
index for `slug`, and by an application-level case-insensitive check for `name` (which has no
DB-level unique constraint of its own, same pattern as `Category.name`). Cities are never
hard-deleted; **Activate**/**Deactivate** (`PATCH /api/admin/cities/:id/status`) is the only
lifecycle action, preserving historical Partner/PromoBanner relationships.

Categories include:

- `name` — must be unique (case-insensitive), enforced at the application layer since there is no DB-level unique constraint on this column.
- `slug` — unique (DB-enforced), URL-safe, lowercase, hyphen-separated. Auto-generated from `name` on create when omitted; on update, `slug` only changes when explicitly included in the request — editing `name` alone never regenerates it.
- optional `icon` — a stable kebab-case identifier from a curated allow-list (`packages/shared/src/constants/categoryIcons.ts`), never JSX/HTML. Admin Web maps it to a Lucide icon component; an absent or unrecognised value falls back to a generic tag icon.
- `active` — the category's lifecycle flag. Categories are never hard-deleted: **Activate**/**Deactivate** (`PATCH /api/admin/categories/:id/status`) is the only lifecycle action, preserving historical `Partner`/`PromoBanner` relationships. Deactivating only excludes a category from new Partner assignments and mobile browsing (enforced by future consumers of `active`, not by this flag alone).

Categories Management (Admin Portal) supports server-side search (name/slug), status filtering (Active/Inactive), sorting, and pagination — the same list/filter/sort/paginate contract shape used by Members Management (`CategoryListQuery`/`CategoryListResponse`, `packages/shared/src/contracts/categories.ts`).

### Partners

`Partner` stores business profile, contact, location, and categorisation data.

Key fields:

- `name`, `slug` (unique, slugify-normalised; never regenerated on rename — same stability rule as Categories/Cities), and `description`
- contact fields: `email`, `phone`, `whatsapp`, `website` — `whatsapp` follows the same validation convention as `phone` (trimmed string, 3–30 chars)
- address fields and coordinates (`Decimal(9,6)`)
- `status` using `PartnerStatus`
- country (required), city (optional — must belong to the selected country, enforced at the application layer), and category relations

The former `logo`/`coverImage` columns were removed (they were never referenced by code and held only NULLs) — `PartnerMedia` is the single source of truth for partner images.

#### Partner media (`PartnerMedia`)

Partner images live in a dedicated `PartnerMedia` table (`storagePath`, `mimeType`, `isCover`, `sortOrder`, `partnerId` with `onDelete: Cascade`), backed by the public `partner-assets` Storage bucket (same conventions as `country-media`: public, 5MB, JPEG/PNG/WebP, auto-provisioned on first upload). Object paths follow `partners/{partnerId}/{uuid}.{ext}` with randomised filenames; the stable path — never the public URL — is stored in Postgres, and the API derives `imageUrl`/`coverImageUrl` at read time.

Invariants, enforced in the API service (transactions where cover state changes):

- at most **3** images per partner; at least **1** required before activation (Draft/Inactive may have zero);
- exactly one `isCover = true` whenever images exist — the first uploaded image becomes cover automatically, setting a new cover unsets the old one atomically, and deleting the cover promotes the remaining image with the lowest `sortOrder` in the same transaction;
- the last image of an ACTIVE partner cannot be deleted (deactivate first);
- Storage/DB consistency: uploads write Storage first and compensate (delete fresh objects) if the DB write fails; deletes/replaces remove the old Storage object only after the DB commit succeeds.

`categoryId` is **optional**: category assignment is a later Partner-configuration task, and Draft partners may be incomplete. `onDelete: Restrict` still prevents deleting an assigned category.

#### Partner lifecycle

- **DRAFT** — every new partner starts here; may be incomplete, visible/editable in Admin only, never shown in the mobile app.
- **ACTIVE** — ready to participate; activation is allowed before full configuration (categories, discounts, media are later tasks), and the Admin UI flags that additional configuration is still required before full publication. Future public/mobile consumers must filter on `status = ACTIVE`.
- **INACTIVE** — excluded from future public/mobile listings; all data preserved, still editable. Deactivate/reactivate are the only lifecycle actions after creation — no archive or delete.
- **SUSPENDED** — exists in the enum for a future moderation flow; never set by the Admin Portal's core Partner module.

#### Partner Details Workspace (Admin Portal)

`/admin/partners/:id` is the single hub for managing a partner: Overview, Contact, Address, and Configuration sections, with Edit as a mode of the same page (`?edit=1`) reusing the shared `PartnerForm` that the Create page also uses. Future Partner features (Locations, Discounts & Offers, Media, Featured, Ratings, Analytics, Audit History) should replace their placeholder tiles inside this workspace rather than adding disconnected Partner pages.

Partners can have partner users, benefits, visits, reviews, promo banners, and future vouchers.

### Partner Users

`PartnerUser` links user accounts to partner businesses.

This allows a partner account to validate visits or manage a partner in future admin/partner workflows.

### Benefits / Discounts

`Benefit` stores partner discounts.

Key fields:

- `title` and `description`
- `type` using `DiscountType`
- optional `value` and `currency`
- `terms`
- `isActive`
- optional `startsAt` and `endsAt`

Benefits can be permanent by leaving `startsAt` and `endsAt` empty, or limited-time by setting date boundaries.

### Partner Visit Analytics

`PartnerVisit` records every QR scan, partner validation, or manual validation.

Key fields:

- `userId`
- `partnerId`
- optional `benefitId`
- `method` using `VisitMethod`
- optional `scannedById`
- `notes`
- `visitedAt`

This gives the MVP a foundation for admin and partner analytics.

### Reviews

`Review` stores user ratings and comments for partners.

Key fields:

- `rating`
- optional `comment`
- `status` using `ReviewStatus`

The schema prevents duplicate reviews from the same user for the same partner with a unique constraint on `userId` and `partnerId`.

Application code should validate that `rating` is between 1 and 5.

### Promo Banners

`PromoBanner` stores admin-managed promotional placements.

Key fields:

- `title`, `subtitle`, and `imageUrl`
- optional `linkUrl`
- `status` using `BannerStatus`
- optional date scheduling
- optional country, city, category, and partner targeting
- `sortOrder`

## V2 / Not MVP

### Vouchers / Airport Transfers

`Voucher` is included now for a future paid voucher or airport-transfer flow. It should not affect MVP behaviour until the V2 feature is built.

Example business flow:

- Customer pays EUR 25 to Apex.
- Partner redeems the voucher.
- Apex pays the partner EUR 20.
- Apex keeps EUR 5 commission.

Key fields:

- `code`
- `userId`
- `partnerId`
- optional `benefitId`
- `title` and `description`
- `totalAmount`
- `partnerAmount`
- `apexCommission`
- `currency`
- `status` using `VoucherStatus`
- `payoutStatus` using `PartnerPayoutStatus`
- payment provider/reference fields
- redemption fields
- expiry and timestamps

## Enums

The schema defines enums for the main lifecycle and status fields:

- `UserRole`
- `UserStatus`
- `MembershipType` (Membership Status is computed at read time, not stored — see the Memberships section above)
- `PartnerStatus`
- `DiscountType`
- `VisitMethod`
- `ReviewStatus`
- `BannerStatus`
- `VoucherStatus`
- `PartnerPayoutStatus`

## Notes

- IDs use Prisma `cuid()`.
- Most core records include `createdAt` and `updatedAt`.
- The Prisma datasource uses `directUrl = env("DIRECT_URL")` for Supabase migrations.
- Root database scripts are defined in `package.json` as `pnpm db:format`, `pnpm db:migrate`, `pnpm db:status`, `pnpm db:generate`, `pnpm db:studio`, `pnpm db:push`, and `pnpm db:reset`.
- `packages/api` is the backend API package. No separate backend folder is needed.
- Destructive migrations should not be run without confirming the database state.
- The schema is designed for Supabase PostgreSQL but does not require Supabase-specific Prisma types.

## Future Multilingual Database Strategy

The current Prisma schema remains unchanged for the i18n foundation. UI translations are file-based in Admin Web and Mobile.

Future database-backed multilingual content should be introduced in one planned migration rather than adding ad hoc `titleEn` or `titlePt` fields.

Likely multilingual candidates:

- `Category.name`
- `Benefit.title`, `Benefit.description`, and `Benefit.terms`
- `Partner.description`
- `PromoBanner.title` and `PromoBanner.subtitle`
- Support articles
- Terms and conditions
- Privacy policy

Recommended future approach:

- Keep English as the fallback content.
- Store translatable database content in translation tables or JSON translation objects after the content-management requirements are clearer.
- Use stable locale codes such as `en` and `pt`.
- Avoid schema changes until the Admin Portal and content workflows are better defined.
