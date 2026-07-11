# Repositories & Project Structure

**Version:** 1.0
**Status:** Approved

## Repository Strategy
Apex Card will use a single GitHub monorepo.

## Proposed Structure

```text
apex-card/
├── apps/
│   ├── mobile/
│   └── admin-web/
├── packages/
│   ├── api/
│   ├── database/
│   └── shared/
├── docs/
├── .github/workflows/
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Responsibilities
- mobile: React Native (Expo)
- admin-web: React + Vite
- api: Express + TypeScript
- database: Prisma schema and migrations
- shared: Types, validation and constants
