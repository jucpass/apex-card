# Apex Card — AI Onboarding

Lightweight orientation for AI coding tools working in this repo. This is a pointer document, not a replacement for the docs it references — read those before non-trivial changes.

## Read Before Changing Code

In this order:

1. [`docs/project-context.md`](docs/project-context.md) — i18n strategy (English + Portuguese foundation).
2. [`docs/BUILD-SEQUENCE.md`](docs/BUILD-SEQUENCE.md) — current build phase and what's next.
3. [`docs/02-architecture/02-development-standards.md`](docs/02-architecture/02-development-standards.md) — **the canonical engineering handbook**. Coding rules, standards per package, security, Definition of Done.
4. Only the feature-specific doc relevant to the task (see `docs/` map below).

Do not scan the whole `docs/` tree by default — the standards doc explicitly says not to.

## What This Project Is

Apex Card is an MVP membership/discounts marketplace platform: mobile app for members, admin portal for managing partners/discounts, Express API, Postgres via Prisma/Supabase. Currently in **Phase 3 (Admin Portal)** per BUILD-SEQUENCE — backend auth and core CRUD (countries/cities/categories) exist; Partners CRUD, Benefits CRUD, Users management, and the mobile app are not yet built. See [`docs/BUILD-SEQUENCE.md`](docs/BUILD-SEQUENCE.md) for the authoritative current status before assuming a feature exists.

## Monorepo Layout

pnpm workspaces, no Docker for MVP (ADR-005).

| Path | Responsibility |
| --- | --- |
| `apps/admin-web` | React + Vite admin portal. Temporary MVP setup tools live here. |
| `apps/mobile` | Expo React Native app (iOS/Android/web). |
| `packages/api` | Express backend — **the** backend, no separate `backend/` folder. |
| `packages/database` | Prisma schema/migrations + the single reusable Prisma client singleton (`@apex/database`). |
| `packages/shared` | Framework-neutral shared types/DTOs/constants (`@apex-card/shared`). No Prisma types — kept safe for browser/mobile. |
| `docs` | Product, architecture, database, and change-log documentation. |

Frontends never touch the database directly — always through `packages/api`. Only `packages/database` may construct `PrismaClient`.

## Key Rules (see standards doc for full list)

- Keep changes minimal, focused, reversible; reuse existing code; no duplicate implementations or parallel architecture.
- TypeScript strict; avoid `any` without a local comment explaining why.
- No hardcoded user-facing strings — use `i18next`/`react-i18next` keys, add both `en.json` and `pt.json` (English is the fallback).
- Auth: Supabase Auth for identity, Prisma `User.role` for authorization. Admin routes require `ADMIN`/`SUPER_ADMIN` and live under `/api/admin/*`. No second JWT system.
- Schema changes go through `packages/database/prisma/schema.prisma` + a named migration; never edit Supabase structure by hand. Monetary values use `Decimal`.
- Never commit secrets; root `/.env` is the real local env file, `/.env.example` is the template. Browser vars need `VITE_` (admin) / `EXPO_PUBLIC_` (mobile) prefixes.
- V2 voucher/airport-transfer models exist in the schema but must not affect MVP behavior.

## Common Scripts

```bash
pnpm admin:dev          # Admin Web dev server
pnpm dev:mobile         # Expo dev server
pnpm api:dev            # Express API dev (builds shared + database first)
pnpm api:typecheck
pnpm build:admin
pnpm build:mobile
pnpm db:migrate -- --name meaningful_name
pnpm db:generate
pnpm db:status
```

## Docs Map

- [`docs/database-schema.md`](docs/database-schema.md) — Prisma models (Users, Memberships, Countries/Cities/Categories, Partners, Benefits, PartnerVisit, Reviews, PromoBanners, V2 Vouchers) and DB workflow.
- [`docs/app-log.md`](docs/app-log.md) — chronological log of meaningful changes; add an entry for non-trivial work.
- [`docs/01-product/apex-card-documentation-structure.md`](docs/01-product/apex-card-documentation-structure.md) — how `docs/` is organized; don't create a second `development-standards.md`.
- `docs/01-product/*` — product vision, scope, personas, roadmap (read only if the task needs product context).

## After Changing Code

Follow the standards doc's Definition of Done: run relevant build/typecheck/lint, report exact files changed and commands run, update `docs/app-log.md` for meaningful changes, and don't leave unexplained TODOs.
