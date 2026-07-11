# CI/CD Foundation

**Version:** 1.0

## Repository
GitHub

## Initial Pipeline
On pull request:
- Install dependencies
- Lint
- Type check
- Build validation

On merge to main:
- Production build validation

## MVP Deployment
Deployment will initially be performed manually to the production VPS.

Future enhancement:
- Automated GitHub Actions deployment.
