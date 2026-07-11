# Apex Card – Product Documentation Structure

**Version:** 1.0  
**Status:** Approved  
**Last Updated:** 05 July 2026  
**Owner:** Steps Tech Ltd

---

# Purpose

This directory contains the functional and technical documentation required to design, develop, test and maintain the Apex Card platform.

The objective is to keep documentation concise, practical and version-controlled, ensuring it supports development without creating unnecessary maintenance overhead.

The documentation follows the project roadmap. Each major roadmap milestone should produce one or more documents. Once approved, documents should only be updated when requirements change.

---

# Documentation Principles

- Keep documentation simple and focused.
- Store all documentation in Markdown.
- Version documents using Git.
- Update documentation only when requirements change.
- Avoid documenting implementation details that are already clear from the source code.
- Prefer diagrams and tables where appropriate.
- Ensure every document contributes directly to development or maintenance.

---

# Recommended Repository Structure

```text
docs/
│
├── 01-product/
│   ├── 01-project-vision.md
│   ├── 02-mvp-scope.md
│   ├── 03-business-objectives.md
│   ├── 04-user-personas.md
│   ├── 05-feature-backlog.md
│   ├── 06-version-roadmap.md
│   └── 07-success-metrics.md
│
├── 02-architecture/
│   ├── 01-repositories-and-project-structure.md
│   ├── 02-development-standards.md
│   ├── 03-environment-management.md
│   ├── 04-local-and-production-environment.md
│   └── 05-cicd-foundation.md
│
├── 03-database/
│   ├── database-design.md
│   ├── entity-relationships.md
│   └── migrations.md
│
├── 04-api/
│   ├── api-overview.md
│   └── endpoints.md
│
├── 05-mobile/
│   ├── navigation.md
│   ├── screens.md
│   └── ui-guidelines.md
│
├── 06-admin/
│   ├── dashboard.md
│   └── admin-features.md
│
└── README.md
```

---

# Documentation Workflow

For every roadmap milestone:

1. Complete the planning and discussion.
2. Produce the corresponding Markdown document(s).
3. Review and approve the document.
4. Commit it to the repository.
5. Continue to the next roadmap item.

Documentation should evolve alongside the project and remain the single source of truth for product and architecture decisions.

The canonical development standards document is:

```text
docs/02-architecture/02-development-standards.md
```

Do not create another `development-standards.md` at the docs root.

---

# Document Template

Each document should begin with:

```md
# Document Title

**Version:** 1.0
**Status:** Draft / Approved
**Last Updated:** DD Month YYYY
**Owner:** Steps Tech Ltd
```

Each document should end with:

```md
## Future Revisions

| Version | Description |
|----------|-------------|
| 1.1 | Planned updates |
```

---

# Scope

The documentation is intended to support the development of:

- React Native mobile application (iOS & Android)
- Partner interface within the same application
- React Administration Portal
- Node.js + Express + TypeScript REST API
- PostgreSQL database using Prisma ORM
- Supabase Authentication
- RevenueCat subscriptions
- Stripe integration (future services)
- Cloud image storage
- Deployment without Docker for the MVP

---

# Notes

The documentation is intentionally lightweight to support rapid delivery of the MVP while maintaining a professional standard suitable for future expansion and onboarding.
