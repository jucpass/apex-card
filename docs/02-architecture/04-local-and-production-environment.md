# Local & Production Environment

**Version:** 1.0

## Local Development
- Node.js LTS
- pnpm
- PostgreSQL
- Prisma
- Expo CLI
- React + Vite
- PM2 optional for API testing

## Production
- Ubuntu Server
- Nginx
- PM2
- Node.js
- PostgreSQL
- Let's Encrypt SSL

## Deployment Workflow
1. Pull latest code.
2. Install dependencies.
3. Build applications.
4. Run Prisma migrations.
5. Restart PM2 services.
