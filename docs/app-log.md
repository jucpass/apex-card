# Apex Card App Log

Track main code updates and additions here.

## 09/07/2026

Update: Initial Prisma database schema created.

Notes: Includes MVP tables for users, memberships, countries, cities, categories, partners, benefits, QR/visit analytics, reviews, promo banners, and V2-ready voucher tables.

### Database / Supabase Configuration
- Connected Prisma configuration to Supabase PostgreSQL.
- Added DATABASE_URL and DIRECT_URL environment variable examples.
- Prepared schema for MVP database tables and V2-ready voucher flow.

### Database Developer Workflow
- Added root database scripts for Prisma format, migrate, status, generate, studio, push, and reset.
- Standardised Prisma commands on the repository root `.env`.
- Removed the duplicated database package environment example.

### Backend Foundation
- Connected Express API package to PostgreSQL through Prisma Client.
- Added database health check endpoint.
- Added database metadata/count endpoint for connection testing.
- Confirmed packages/api is the backend API package; no separate backend folder is needed.

### Admin Web MVP Setup Tool
- Added basic admin setup page for countries, cities, and categories.
- Added temporary unprotected admin API endpoints for MVP data entry.
- Added frontend API base URL configuration.

## 10/07/2026

### Internationalisation Foundation
- Added project-wide i18n architecture.
- Configured English and Portuguese locale support.
- Established translation key conventions.
- Added language detection and fallback strategy.
- Prepared project for multilingual UI without modifying database schema.

### Development Standards
- Expanded the canonical Apex Card development standards.
- Added coding, database, API, security, i18n, documentation, and Codex workflow conventions.
- Established a single engineering handbook for future development tasks.

### Admin Web Authentication Foundation
- Added Supabase email/password login for the Admin Web.
- Added Admin Web session restoration and logout.
- Protected the temporary Admin Web setup screen behind a Supabase session.
- Added English and Portuguese authentication UI labels.

### API Authentication Foundation
- Added Supabase access-token verification for Express API data routes.
- Protected temporary admin setup endpoints behind authenticated Admin Web sessions.
- Linked Supabase identities to Prisma application users.
- Added ACTIVE account status validation and ADMIN/SUPER_ADMIN role checks.
- Added first SUPER_ADMIN bootstrap support through a server-only environment variable.

### Shared TypeScript Package
- Created `@apex-card/shared` for framework-neutral contracts, DTOs, constants, and validation helpers.
- Added shared Admin setup API contracts for countries, cities, and categories.
- Integrated shared contracts into the Express API and Admin Web.

## 11/07/2026

### Admin Web Frontend Foundation
- Installed Tailwind CSS.
- Installed shadcn/ui.
- Installed Lucide React.
- Configured the Admin Web UI foundation.
- Verified compatibility with the existing React + Vite + TypeScript application.
