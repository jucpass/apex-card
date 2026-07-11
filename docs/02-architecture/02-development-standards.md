# Apex Card Development Standards

**Version:** 2.0

## 1. Purpose and Scope

This file defines how Apex Card code should be written, changed, tested, and documented. It is the canonical engineering handbook for contributors and AI coding tools.

Future contributors and Codex sessions SHOULD read documents in this order:

1. [`docs/project-context.md`](../project-context.md)
2. [`docs/BUILD-SEQUENCE.md`](../BUILD-SEQUENCE.md)
3. [`docs/02-architecture/02-development-standards.md`](./02-development-standards.md)
4. Only the feature-specific documents relevant to the task

MUST NOT scan every document by default. Use this file for implementation rules, [`docs/database-schema.md`](../database-schema.md) for database details, [`docs/app-log.md`](../app-log.md) for change history, and [`docs/BUILD-SEQUENCE.md`](../BUILD-SEQUENCE.md) for build order.

## 2. Core Engineering Principles

- MUST prefer simple, readable code over clever abstractions.
- MUST keep changes minimal, focused, and reversible.
- MUST inspect the relevant files before editing.
- MUST reuse existing components, scripts, package boundaries, and utilities.
- MUST NOT create duplicate implementations of an existing capability.
- SHOULD avoid refactors unless they are required for the requested change.
- MUST preserve existing behaviour unless the task explicitly asks to change it.
- MUST keep TypeScript type safety by default.
- MUST treat security as a default requirement, not a later cleanup.
- MUST document important architectural changes in the relevant document.

## 3. Monorepo Responsibilities

| Path | Responsibility |
| --- | --- |
| `apps/admin-web` | React + Vite administration portal. Temporary MVP setup tools live here until production admin features replace them. |
| `apps/mobile` | Expo React Native mobile app for iOS, Android, and web checks. |
| `packages/api` | Express backend API. This is the backend. There is no separate `backend` folder. |
| `packages/database` | Prisma schema, migrations, generated Prisma Client dependency, and the reusable Prisma singleton export. |
| `packages/shared` | Shared TypeScript types, constants, and utilities used across packages when appropriate. |
| `docs` | Product, architecture, database, workflow, and change documentation. |

Frontend applications MUST NOT access the database directly. They MUST call API endpoints. `packages/api` MUST import Prisma through `@apex/database`.

## 4. TypeScript Standards

- MUST keep strict TypeScript compatibility.
- MUST avoid `any` unless there is a clear reason and a local comment explains it.
- SHOULD prefer explicit types at package boundaries, API request/response boundaries, and shared exports.
- SHOULD reuse shared types from `packages/shared` where that avoids duplication.
- MUST NOT duplicate DTOs across packages when a shared type is already available or clearly needed.
- MUST run the relevant typecheck/build command before considering a code task complete.
- SHOULD keep internal types close to their feature when they are not reused.

## 5. React Admin Web Standards

- MUST use functional React components.
- SHOULD keep components small and focused.
- SHOULD separate API/data logic from presentation when the component starts to grow.
- MUST use i18n keys for new user-facing text.
- MUST show useful loading, validation, success, and error states for forms.
- MUST NOT add large UI libraries without explicit approval.
- SHOULD maintain accessible labels, button text, keyboard usability, and readable focus states.
- SHOULD be desktop-friendly and responsive, because Admin Web is operational software.
- MUST use `VITE_` prefixes for variables exposed to the browser.
- The approved UI foundation is Tailwind CSS v4 (via `@tailwindcss/vite`, CSS-first config in `src/styles.css`), shadcn/ui components, and Lucide React icons. Do not introduce a competing styling approach or icon library.
- shadcn/ui components live in `src/components/ui` and are added/updated through the `shadcn` CLI rather than hand-written from scratch.
- Use the `@/*` import alias (mapped to `src/*` in both `tsconfig.json` and `vite.config.ts`) for new Admin Web code.

Relevant scripts:

```bash
pnpm admin:dev
pnpm build:admin
```

## 6. Expo Mobile Standards

- MUST use React Native and Expo-compatible libraries only.
- MUST support iOS and Android.
- SHOULD design mobile-first layouts.
- MUST NOT use web-only APIs without an abstraction or platform guard.
- MUST bundle static UI translations locally.
- SHOULD preserve performance on older devices by avoiding unnecessary work during render.
- SHOULD avoid unnecessary network requests during screen loading.
- SHOULD use `expo install` for Expo-native packages so versions match the SDK.

Relevant scripts:

```bash
pnpm dev:mobile
pnpm build:mobile
```

## 7. Internationalisation Standards

- Supported languages are English (`en`) and Portuguese (`pt`).
- English MUST remain the fallback language.
- MUST NOT hardcode new user-facing UI text.
- MUST use translation keys through `i18next` and `react-i18next`.
- Static UI translations live in:
  - `apps/admin-web/src/locales/en.json`
  - `apps/admin-web/src/locales/pt.json`
  - `apps/mobile/src/locales/en.json`
  - `apps/mobile/src/locales/pt.json`
- Admin Web persists language preference in `localStorage` using `apex.language`.
- Mobile persists language preference in AsyncStorage using `apex.language`.
- Database-managed public content MAY later use multilingual fields or translation tables.
- User-generated content is not automatically translated.

Use consistent namespaces:

```text
common.*
auth.*
dashboard.*
countries.*
cities.*
categories.*
partners.*
benefits.*
users.*
settings.*
subscription.*
```

## 8. Express API Standards

- Routes SHOULD remain thin.
- MUST validate external input before database operations.
- SHOULD move business logic out of route registration when it becomes more than simple CRUD.
- MUST return consistent JSON responses.
- MUST NOT expose stack traces, credentials, tokens, or raw internal errors in JSON responses.
- MUST use appropriate HTTP status codes.
- Admin routes use `/api/admin/*`.
- Public/mobile routes SHOULD use a consistent route namespace under `/api/*`.
- The health endpoint remains `/health`.
- Protected routes MUST verify Supabase access tokens and application roles once authentication is implemented.

Current response examples:

```json
{ "status": "ok", "database": "connected" }
```

```json
{ "status": "error", "message": "Request failed" }
```

Relevant scripts:

```bash
pnpm api:dev
pnpm api:build
pnpm api:typecheck
```

## 9. Prisma and Database Standards

- Prisma schema is the database source of truth.
- MUST NOT make structural database changes manually in Supabase.
- MUST update `packages/database/prisma/schema.prisma` first for schema changes.
- MUST create a named migration for schema changes.
- MUST generate Prisma Client after migration/schema changes.
- MUST verify migration status after applying migrations.
- `packages/database` exports the reusable Prisma singleton.
- MUST NOT create `PrismaClient` instances in other packages.
- SHOULD use IDs, timestamps, relations, and cascade behaviour consistently with the existing schema.
- SHOULD include `createdAt` and `updatedAt` where appropriate.
- MUST use `Decimal` for monetary values.
- MUST NOT run destructive database commands without explicit approval.
- V2 voucher/airport-transfer models MUST NOT affect MVP behaviour until that feature is intentionally built.

Current database commands:

```bash
pnpm db:format
pnpm db:migrate -- --name meaningful_migration_name
pnpm db:generate
pnpm db:status
pnpm db:studio
```

Use `pnpm db:push` only for deliberate non-migration sync work. Use `pnpm db:reset` only with explicit destructive-action approval.

## 10. Authentication and Authorisation Standards

**Status: planned, not implemented yet.**

- Supabase Auth will manage identity, passwords, sessions, and access tokens.
- Express will verify Supabase access tokens.
- Prisma `User` records store application profile fields and roles.
- Role checks occur after token verification.
- Admin routes require `ADMIN` or future `SUPER_ADMIN`-equivalent access.
- MUST NOT create a second custom JWT/refresh-token system unless explicitly approved.
- Supabase service-role keys and other secret keys are server-only.
- Admin setup routes are temporary and MUST be protected before production.

## 11. Environment Variable Standards

- The real local environment file is repository root `/.env`.
- `/.env.example` is committed as the template.
- MUST never commit real secrets.
- MUST NOT duplicate environment files across packages unless a framework strictly requires a public-client-specific file.
- Frontend-exposed variables MUST use the correct public prefix:
  - Admin Web: `VITE_*`
  - Mobile: `EXPO_PUBLIC_*`
- MUST never expose Supabase service-role keys, database URLs, or other secrets to Admin Web or Mobile.
- Prisma and API scripts MUST load the root environment correctly.

Variable categories:

- Database: `DATABASE_URL`, `DIRECT_URL`
- Supabase public client: `SUPABASE_URL`, publishable/anon keys where appropriate
- Supabase server-only: service-role keys
- API runtime: host, port, environment
- Frontend public config: API base URLs only

## 12. Naming Conventions

- React components: `PascalCase`
- Hooks: `useSomething`
- TypeScript functions and variables: `camelCase`
- Prisma models and enums: `PascalCase`
- Environment variables: `SCREAMING_SNAKE_CASE`
- API route resources: lowercase plural names such as `/countries`
- Migrations: descriptive `snake_case` names
- Constants: follow the existing local convention; introduce all-caps constants only when it improves readability.
- Files: follow the package's existing convention. Do not rename files only for style.

## 13. Validation and Error Handling

- MUST validate all external input.
- SHOULD use one consistent validation approach per API area.
- MUST display useful frontend errors.
- MUST keep server errors safe for clients.
- SHOULD log unexpected server errors without leaking sensitive data.
- MUST distinguish validation, authentication, authorisation, not-found, conflict, and internal errors.
- MUST NOT silently swallow failures.
- SHOULD test failure paths, not just success paths.

## 14. Security Standards

- MUST never trust client input.
- MUST never expose database credentials or Supabase secret keys.
- MUST protect all admin routes before production.
- SHOULD use least privilege for database, API, and third-party access.
- MUST validate uploaded files before accepting them.
- MUST avoid logging tokens, credentials, payment references, or sensitive profile data.
- SHOULD configure CORS explicitly before production.
- SHOULD add rate limiting before production.
- MUST review Row Level Security strategy before introducing direct Supabase client access from frontend apps.

## 15. Testing and Verification

Minimum checks are proportional to the task:

- Build passes for affected apps/packages.
- TypeScript passes for affected apps/packages.
- Lint passes if lint is configured and relevant.
- Relevant endpoint or UI flow is tested.
- Database changes include migration and status verification.
- Relevant error paths are tested.
- No unrelated application area is broken.

Examples:

```bash
pnpm api:typecheck
pnpm api:build
pnpm build:admin
pnpm build:mobile
pnpm db:status
```

Do not require large test suites for every small task, but every task needs enough verification for its risk.

## 16. Git and Change Discipline

- SHOULD keep changes small and focused.
- MUST avoid mixing unrelated work.
- MUST NOT commit `.env`, credentials, generated secrets, or local-only files.
- SHOULD use Conventional Commits:
  - `feat:`
  - `fix:`
  - `refactor:`
  - `docs:`
  - `test:`
  - `chore:`
- MUST NOT rewrite working architecture without approval.
- SHOULD preserve user changes already present in the worktree.

## 17. Documentation Rules

Update documentation only when it helps future work:

- [`docs/app-log.md`](../app-log.md): main additions or meaningful changes.
- [`docs/database-schema.md`](../database-schema.md): schema, migration, or database workflow changes.
- [`docs/project-context.md`](../project-context.md): major architecture or project-context changes.
- [`docs/BUILD-SEQUENCE.md`](../BUILD-SEQUENCE.md): build-order or milestone status changes.
- This file: engineering convention changes.
- Feature-specific documents: only when affected.

Do not log trivial formatting or minor internal edits in `docs/app-log.md`.

## 18. Definition of Done

- Requested behaviour is implemented.
- Build, typecheck, and lint pass as applicable.
- Relevant success and failure paths are tested.
- No secrets are exposed.
- No unnecessary duplicate code is added.
- Documentation is updated where required.
- Manual steps are clearly reported.
- No unexplained TODOs are left behind.
- Existing features are preserved.

## 19. Codex Working Rules

Before changing code:

- Read [`docs/project-context.md`](../project-context.md).
- Read this standards document.
- Read [`docs/BUILD-SEQUENCE.md`](../BUILD-SEQUENCE.md) when sequencing matters.
- Inspect only packages and files relevant to the task.
- Check existing scripts and dependencies.
- Confirm whether the capability already exists.

While changing code:

- Prefer editing existing code over creating duplicates.
- Keep changes minimal.
- Do not install dependencies unnecessarily.
- Do not update package versions without need.
- Do not create parallel architecture.
- Do not create duplicate Prisma clients.
- Do not create a `backend` folder.
- Do not modify unrelated mobile/admin/API code.
- Do not run destructive database commands.
- Do not hardcode user-facing strings.
- Preserve English and Portuguese compatibility.

After changing code:

- Run relevant checks.
- Report exact files changed.
- Report commands run.
- Report test results.
- Report manual steps.
- Update relevant documentation.
- Clearly state anything not completed.

## 20. Architecture Decisions Summary

| ADR | Decision | Rationale |
| --- | --- | --- |
| ADR-001 | pnpm monorepo | Keeps Admin Web, Mobile, API, Database, and Shared packages in one coordinated workspace. |
| ADR-002 | `packages/api` is the Express backend | Avoids duplicate backend folders and keeps backend code in the established package. |
| ADR-003 | PostgreSQL on Supabase with Prisma | Combines managed PostgreSQL hosting with a typed schema/migration workflow. |
| ADR-004 | `packages/database` is the single Prisma access layer | Prevents duplicate Prisma clients and centralises database access. |
| ADR-005 | No Docker for MVP | Keeps local setup and early deployment simpler until infrastructure needs are clearer. |
| ADR-006 | Admin Portal before full Mobile App | Real marketplace data should be manageable before mobile feature integration expands. |
| ADR-007 | Supabase Auth for identity and Prisma roles for authorisation | Uses managed identity while keeping application roles in the app database. |
| ADR-008 | RevenueCat as subscription source of truth | Keeps subscription state aligned with mobile purchase infrastructure. |
| ADR-009 | English and Portuguese from the beginning | Supports the initial audience and avoids retrofitting i18n later. |
| ADR-010 | Local translation files for static UI text | Keeps UI translation fast, simple, and available offline. |
| ADR-011 | Database-managed content prepared for multilingual support | Public content will need multilingual fields or translation records in a planned migration. |
| ADR-012 | Future voucher/airport-transfer flow remains outside MVP | V2 data structures exist, but MVP behaviour must stay focused on memberships and discounts. |
