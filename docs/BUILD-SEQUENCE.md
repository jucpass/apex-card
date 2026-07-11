# Apex Card -- MVP Build Sequence

> **Purpose**
>
> This document is the day-to-day development guide for Apex Card.
> Unlike the roadmap (which defines *what* must be built), this document
> defines **the recommended order** to build the application, helping
> avoid unnecessary rework and integration issues.

------------------------------------------------------------------------

# Current Progress

Update this checklist as development progresses.

  Status   Phase
  -------- -------------
  ✅       Completed
  🟡       In Progress
  ⬜       Not Started
  ⏸️       Deferred

------------------------------------------------------------------------

# Phase 1 -- Foundation

-   [x] 1. Create GitHub repository
-   [x] 2. Create monorepo structure
-   [x] 3. Create `project-context.md`
-   [x] 4. Configure Node.js, pnpm, TypeScript, ESLint and Prettier
-   [x] 5. Create Admin Web "Hello World"
-   [x] 6. Create Mobile App "Hello World"
-   [x] 7. Create Supabase project
-   [x] 8. Design database schema with Prisma ← **Current Step**

**Goal:** A stable development environment.

**Required Services** - GitHub - Supabase - Expo

------------------------------------------------------------------------

# Phase 2 -- Backend Foundation

-   [x] Finalise Initial Prisma schema
-   [x] Configure Prisma migrations
-   [x] Apply initial migration to Supabase
-   [x] Confirm tables and relationships in Supabase
-   [x] Configure root `.env` workflow
-   [x] Connect Express API to PostgreSQL
-   [x] Configure environment variables
-   [x] Create shared TypeScript package
-   [x] Configure Supabase Authentication - Admin Web email/password login
-   [x] Implement Admin Web session restoration
-   [x] Implement API token verification
-   [x] Implement API role checks
-   [x] Create API health endpoint
-   [x] Implement basic error handling
-   [x] Create temporary admin data-management endpoints
-   [x] Confirm Admin Web can read and write database records

**Goal:** Working backend exposing APIs.

------------------------------------------------------------------------

# Phase 3 -- Admin Portal

Build the administration portal **before** the mobile application.

-   [x] Admin authentication - basic Supabase login/session
-   [ ] Dashboard
-   [x] Countries CRUD - basic/test
-   [x] Cities CRUD - basic/test
-   [x] Categories CRUD - basic/test
-   [ ] Partners CRUD
-   [ ] Benefits/Discounts CRUD
-   [ ] Users management
-   [ ] Ratings moderation

**Goal:** Allow administrators to populate the system with real data.

------------------------------------------------------------------------

# Phase 4 -- Mobile Application

Connect the mobile app to the real backend.

-   [ ] Login
-   [ ] Register
-   [ ] Home
-   [ ] Categories
-   [ ] Partner list
-   [ ] Partner details
-   [ ] Membership card / QR
-   [ ] Profile
-   [ ] Ratings & Reviews
-   [ ] Settings / Language

**Goal:** Consume live data from the backend.

------------------------------------------------------------------------

# Phase 5 -- Integrations

-   [ ] Supabase Storage
-   [ ] Resend
-   [ ] RevenueCat
-   [ ] Sentry
-   [ ] Firebase (Analytics / Push Notifications)
-   [ ] Better Stack (optional)

**Goal:** Complete production-ready integrations.

------------------------------------------------------------------------

# Phase 6 -- Deployment

-   [ ] VPS (Hetzner)
-   [ ] Nginx
-   [ ] PM2
-   [ ] SSL
-   [ ] CI/CD validation
-   [ ] Staging environment
-   [ ] Production deployment

------------------------------------------------------------------------

# Phase 7 -- Release

-   [ ] Apple Developer configuration
-   [ ] Google Play Console
-   [ ] TestFlight
-   [ ] Internal Android testing
-   [ ] Bug fixing
-   [ ] Production release

------------------------------------------------------------------------

# Visual Development Flow

``` text
Foundation
    ↓
Backend
    ↓
Admin Portal
    ↓
Mobile App
    ↓
Integrations
    ↓
Deployment
    ↓
App Stores
```

------------------------------------------------------------------------

# Service Creation Timeline

## Create Immediately

-   GitHub
-   Supabase
-   Expo
-   Figma / Canva
-   AI coding tools

## Create During Development

-   Resend
-   RevenueCat
-   Sentry
-   Cloudflare

## Create Before Release

-   Apple Developer
-   Google Play Console
-   VPS
-   Better Stack

## Future

-   Stripe
-   PostHog
-   OpenAI Platform

------------------------------------------------------------------------

# Development Rules

-   Build backend before frontend integrations.
-   Build Admin Portal before Mobile features requiring real data.
-   Complete one phase before starting the next.
-   Avoid adding new infrastructure until it is needed.
-   Keep commits small using Conventional Commits.
-   Update this document whenever a milestone is completed.

------------------------------------------------------------------------

# References

-   `docs/project-context.md`
-   `docs/roadmap/apex-roadmap.md`
-   `docs/architecture/`
-   `docs/setup/`

------------------------------------------------------------------------

**Last Updated:** July 2026
