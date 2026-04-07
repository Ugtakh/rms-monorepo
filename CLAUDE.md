# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all dev servers (API on :4000, Web on :3000)
pnpm dev

# Start individual services
pnpm dev:api
pnpm dev:web

# Build all packages (respects Turbo dependency order)
pnpm build

# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Database setup (run in order for fresh environment)
docker-compose up -d          # Start PostgreSQL, MongoDB, Redis
pnpm db:init                  # Run Prisma migrations
pnpm db:seed                  # Seed test data

# Prisma operations (from apps/api)
pnpm --filter @rms/api prisma:generate   # Regenerate Prisma client after schema changes
pnpm --filter @rms/api db:push           # Sync schema without migration files
pnpm --filter @rms/api db:migrate        # Create and run a migration
```

## Architecture Overview

**Monorepo layout**: pnpm workspaces + Turbo build orchestration.
- `apps/api` — Express 5 backend (TypeScript, ESM)
- `apps/web` — Next.js 15 App Router frontend
- `packages/shared` — Shared types, RBAC constants, permission definitions consumed by both apps

### Backend (`apps/api`)

Follows a strict **Routes → Controllers → Services → Repositories** layering. No business logic in controllers; no DB calls in services.

**11 API modules** under `src/`: `health`, `auth`, `tenant`, `branch`, `menu`, `inventory`, `orders`, `payments`, `ebarimt`, `kds`, `reports`.

**Datastores**:
- **PostgreSQL** (Prisma) — transactional data: tenants, branches, users, orders, payments, inventory
- **MongoDB** (Mongoose) — flexible document data: KDS tickets, menu catalog
- **Redis** (ioredis) — caching and pub/sub

**Middleware order** (applied globally in `app.ts`): helmet → cors → morgan → json body parser → cookieParser → requestId → then per-route: `authMiddleware` → `tenantScopeMiddleware` → `requirePermissions()`.

**Multi-tenancy**: JWT claims carry `tenantId`/`branchId`. All data queries are scoped by these. Super admin (`super_admin:*` permission) bypasses isolation. Headers `x-tenant-id` and `x-branch-id` are validated against JWT claims.

**Real-time**: Socket.IO with JWT auth on handshake. Clients auto-join `tenant:{id}` and `branch:{id}` rooms. Used for KDS ticket updates and order status events.

**Swagger docs** available at `http://localhost:4000/docs` when API is running.

### Frontend (`apps/web`)

Next.js App Router with `(home)/` route group wrapping all authenticated pages. Key pages: `pos/`, `kitchen/`, `menu/`, `inventory/`, `reports/`, `employees/`, `ebarimt-settings/`.

State management: React Query (TanStack) for server state, React Hook Form for forms. Auth via NextAuth with JWT stored in httpOnly cookies. Real-time updates consumed via Socket.IO client.

All API calls go to `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`) with `Authorization: Bearer <token>` + tenant headers.

### Shared Package (`packages/shared`)

Single source of truth for:
- `PERMISSIONS` — all permission codes (e.g. `order:write`)
- `DEFAULT_ROLE_PERMISSIONS` — maps roles (`SUPER_ADMIN`, `ORG_ADMIN`, `MANAGER`, `CASHIER`, `CHEF`, `WAITER`) to permission arrays
- `JwtClaims`, `AuthTokens`, `TenantContext`, `ApiResponse` types

Always rebuild shared after changes: `pnpm --filter @rms/shared build`.

## Key Conventions

- **Error handling**: Throw `AppError` (from `src/utils/AppError.ts`) in services/controllers. The centralized Express error handler catches and formats all errors.
- **Validation**: Zod schemas live alongside their module (e.g. `src/orders/order.schema.ts`). Validate in controllers before passing to services.
- **RBAC**: Use `requirePermissions(PERMISSIONS.ORDER_WRITE)` middleware on routes — never do manual permission checks inside controllers.
- **Path aliases**: `@/*` maps to `apps/web/src/` in the frontend. Use `@rms/shared` for shared imports in both apps.

## Environment

Copy `.env.example` to `.env` in `apps/api` and `apps/web`. Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `MONGODB_URI` — MongoDB connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — Token signing secrets
- `NEXT_PUBLIC_API_URL` — Web → API base URL

## Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@rms.local` | `Admin@123` |
| Org Admin (org N) | `admin+org{N}@rms.local` | `Admin@123` |
| Cashier (org N, branch M) | `cashier+org{N}b{M}@rms.local` | `Cashier@123` |
