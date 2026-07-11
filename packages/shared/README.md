# @apex-card/shared

Shared framework-neutral contracts and domain concepts for Apex Card.

Use this package for values that are genuinely shared by more than one workspace package or app, especially API-facing DTOs, response contracts, domain enum values, language constants, and validation helpers.

Do not put implementation details here:

- Prisma Client, Prisma queries, or generated Prisma runtime types
- Express route handlers or middleware
- Supabase clients
- React components, hooks, or browser-only utilities
- Expo or React Native utilities
- Environment-variable loading

## Imports

Import through the package barrel only:

```ts
import type { CountryDto, CountriesResponse } from '@apex-card/shared';
```

## Adding A Contract

Add only API-facing fields that are safe for frontend/mobile clients. Keep Prisma models behind the API boundary:

```text
Prisma model -> API mapping -> shared contract -> frontend/mobile consumer
```

If a field exists only for database mechanics, server secrets, framework state, or persistence internals, it does not belong here.

## Validation

Shared validators should preserve existing API behavior and stay framework-neutral. Zod can replace these helpers later when dependency installation is available, but the package should still avoid Express, React, Prisma, and Supabase dependencies.

## Mobile

The Expo mobile app can later consume the same DTOs and constants for public/mobile API contracts without depending on Prisma, Express, Supabase clients, or Admin Web code.
