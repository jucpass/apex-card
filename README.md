# apex-card
Apex Card is a digital membership platform designed primarily for members of the PALOP (Portuguese-speaking African countries) diaspora and travellers. Members subscribe to the platform and gain access to exclusive discounts from partner businesses across multiple countries.

## Project Structure

- `apps/admin-web` — React + Vite admin web app.
- `apps/mobile` — Expo + React Native mobile app.
- `packages/api` — Express + TypeScript API.
- `packages/database` — Prisma schema and database client.
- `packages/shared` — Shared utilities, types, and validation code.
- `docs` — Architecture and requirements documentation.

## Local Setup

### Requirements

- Node.js 24.x
- `pnpm` 8.x (managed via `packageManager: pnpm@8.15.9` in root `package.json`)
- PostgreSQL
- Prisma CLI
- Expo CLI for mobile development

### Install

```bash
pnpm install
```

### Environment

Copy the root example env file for local development:

```bash
cp .env.example .env
```

Prisma reads the repository root `.env` through the root database scripts. Do not create duplicated `.env` files inside `packages/database`.

If you use Homebrew Node, ensure the `node@24` path is preferred in your shell startup:

```bash
export PATH="/usr/local/opt/node@24/bin:$PATH"
```

### Development commands

- `pnpm lint` — run ESLint across the repository
- `pnpm typecheck` — run TypeScript type checks
- `pnpm build` — build all workspace packages
- `pnpm dev:admin` — start the admin web app via Vite
- `pnpm admin:dev` — start the admin web app on `127.0.0.1`
- `pnpm dev:mobile` — start the Expo mobile app
- `pnpm api:dev` — start the Express API with live TypeScript reload
- `pnpm api:build` — build the database and API packages
- `pnpm api:typecheck` — type-check the API package
- `pnpm build:admin` — build the admin web app
- `pnpm build:mobile` — run the mobile TypeScript build check
- `pnpm db:format` — format the Prisma schema
- `pnpm db:migrate -- --name migration_name` — create and apply a Prisma migration
- `pnpm db:status` — check Prisma migration status
- `pnpm db:generate` — generate Prisma Client
- `pnpm db:studio` — open Prisma Studio
- `pnpm --filter @apex/api dev` — run the API package development server
- `pnpm --filter admin-web dev` — start the admin web app via Vite
- `pnpm --filter mobile start` — start the Expo mobile app

### Admin web locally

```bash
pnpm admin:dev
```

Equivalent workspace command:

```bash
pnpm --filter admin-web dev
```

The temporary MVP setup page manages countries, cities, and categories. Configure `apps/admin-web/.env` with:

```bash
VITE_API_BASE_URL=http://127.0.0.1:4000
VITE_SUPABASE_URL=https://fofiwolcfspmacbgclfy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

These admin API routes are not authenticated yet and must be protected before production.

### Mobile app locally

```bash
pnpm dev:mobile
```

Equivalent workspace command:

```bash
pnpm --filter mobile start
```

### Build admin web

```bash
pnpm build:admin
```

Equivalent workspace command:

```bash
pnpm --filter admin-web build
```

### Build mobile

Native mobile builds are not configured yet. The current safe mobile build command validates TypeScript:

```bash
pnpm build:mobile
```

Equivalent workspace command:

```bash
pnpm --filter mobile build
```

### Validated commands

- `node -v` → `v24.18.0`
- `pnpm -v` → `8.15.9`
- `pnpm install` — installs dependencies successfully
- `pnpm --filter admin-web build` — builds the admin web app successfully
- `pnpm --filter mobile typecheck` — type-checks the mobile app successfully
- `pnpm --filter admin-web dev` — starts the Vite dev server successfully
- `pnpm --filter mobile start --help` — confirms the Expo start command resolves successfully

### API

- Source: `packages/api/src`
- Entry: `packages/api/src/index.ts`
- Health route: `/health`
- Metadata route: `/api/meta`
- Run locally: `pnpm api:dev`
- Build: `pnpm api:build`
- Type-check: `pnpm api:typecheck`

### Database

- Prisma schema: `packages/database/prisma/schema.prisma`
- Format schema: `pnpm db:format`
- Create migration: `pnpm db:migrate -- --name migration_name`
- Check migration status: `pnpm db:status`
- Generate client: `pnpm db:generate`

### Mobile

- Expo app: `apps/mobile`
- Entry: `apps/mobile/App.tsx`

### Admin Web

- React/Vite app: `apps/admin-web`
- Entry: `apps/admin-web/src/main.tsx`

## Deployment Summary

1. Pull latest code from the repository.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env` and configure production secrets.
4. Run Prisma migrations and `pnpm db:generate`.
5. Build server and web assets with `pnpm build`.
6. Restart the API process managed by your process manager.
7. Use Nginx or your preferred reverse proxy to route requests.

## Notes

- No Docker configuration is included yet.
- Payment, auth, and cloud storage providers are not configured yet.
- Keep secrets out of version control and use `.env.*.example` for placeholders.
