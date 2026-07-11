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

`Membership` stores RevenueCat subscription and entitlement state.

Key fields:

- `status` using `MembershipStatus`
- `isStudent`
- `revenueCatCustomerId`
- `revenueCatEntitlement`
- `revenueCatProductId`
- period, expiry, and cancellation dates

RevenueCat is treated as the subscription source of truth. Stripe can exist behind RevenueCat externally, but the app stores RevenueCat-facing membership state.

### Countries, Cities, And Categories

`Country`, `City`, and `Category` support admin-managed marketplace structure.

Countries contain cities. Partners belong to a country, may belong to a city, and must belong to a category.

Categories include:

- `name`
- `slug`
- optional `icon`
- `active`

### Partners

`Partner` stores business profile, contact, location, and categorisation data.

Key fields:

- `name`, `slug`, and `description`
- `logo` and `coverImage`
- contact fields: `email`, `phone`, `website`
- address fields and coordinates
- `status` using `PartnerStatus`
- country, city, and category relations

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
- `MembershipStatus`
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
