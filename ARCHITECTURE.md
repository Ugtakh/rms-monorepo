# RMS Enterprise Architecture

## Monorepo Structure

- `apps/api` - Node.js + TypeScript backend (Express, Prisma, Mongoose, Socket.IO)
- `apps/web` - Next.js dashboard (POS, KDS, Inventory, Analytics, User admin)
- `packages/shared` - shared RBAC constants and cross-app types

## Backend Layers (MVC + Service/Repository)

- `routes` - route registration per module
- `modules/*/routes` - endpoint definitions + middleware composition
- `modules/*/controllers` - request/response handling + validation
- `modules/*/services` - business rules and orchestration
- `modules/*/repositories` - database access (PostgreSQL/MongoDB)
- `common/middleware` - auth, tenant scope, RBAC, error handling
- `infrastructure` - Prisma/Mongoose/Redis/Socket setup

## Datastore Split

- PostgreSQL:
  - tenant/branch/user/role/permission
  - order/order_item/payment
  - inventory_item/inventory_ledger
  - refresh_token/audit_log/discount
- MongoDB:
  - menu catalog documents
  - kds ticket snapshots
- Redis:
  - reserved for cache/pubsub (connected and ready for extension)

## Security & Multi-Tenancy

- JWT access and refresh token flow
- Tenant isolation by:
  - JWT claims (`tenantId`, `branchId`)
  - request headers (`x-tenant-id`, `x-branch-id`)
  - middleware guard (`tenantScopeMiddleware`)
- Permission guard by RBAC (`requirePermissions`)
- Super admin bypass supported (`super_admin:*`)

## Implemented API Modules

- `auth` - login, refresh, me, employee registration
- `tenant` - list/create/current tenant
- `branch` - list/create branch
- `menu` - list/create/toggle availability
- `inventory` - list/create/adjust stock
- `orders` - list/create/update status
- `payments` - create payment and auto update order payment status
- `kds` - list tickets and update kitchen status
- `reports` - sales summary (totals, by branch, by payment method)

## Seed Design

- Creates:
  - 1 super admin
  - 10 tenants
  - 5 branches per tenant
  - default tables per branch
  - org admin + cashier + chef accounts
  - starter menu and inventory per branch
