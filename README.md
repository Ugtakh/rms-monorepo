# Restaurant Management System Monorepo

Enterprise-grade, multi-tenant Restaurant Management System scaffold using Node.js, TypeScript, PostgreSQL, MongoDB, Redis, and Next.js.

## Stack
- Backend: Express + TypeScript + Prisma + Mongoose + Socket.IO
- Frontend: Next.js 15 (App Router) + TypeScript
- Databases: PostgreSQL (transactional), MongoDB (menu/kds/documents), Redis (caching/pubsub)
- Architecture: Modular MVC + service/repository pattern + tenant isolation + RBAC

## Features (Implemented Base)
- Multi-tenant organization and branch model
- RBAC with permission-based route guards
- Auth with JWT access/refresh token
- POS order lifecycle (draft -> submitted -> served -> closed)
- KDS realtime updates using Socket.IO rooms per branch
- Payment support (pay now / pay later)
- Menu and inventory CRUD base
- Reports endpoints for sales analytics per org or branch
- Ebarimt POS API 3.0 integration module (branch config + receipt issue/void + reference lookups)
- Seed script: creates super admin + 10 organizations, each with 5 branches

## Quick Start
1. Copy env:
   - `cp .env.example .env`
2. Start infrastructure:
   - `docker compose up -d`
3. Install deps:
   - `pnpm install`
4. Generate and migrate DB:
   - `pnpm --filter @rms/api prisma:generate`
   - `pnpm --filter @rms/api prisma:migrate`
5. Seed sample data:
   - `pnpm db:seed`
6. Run apps:
   - `pnpm dev`

## Swagger Docs (Step By Step)
1. `.env` файлд `API_PORT` тохируулсан эсэхийг шалга:
   - default: `API_PORT=4000`
2. API-г асаа:
   - `pnpm dev:api`
3. Swagger UI нээ:
   - `http://localhost:4000/docs`
4. OpenAPI JSON нээ:
   - `http://localhost:4000/docs/json`
5. Swagger дээр authorize хийх:
   - `POST /api/auth/login` ажиллуулаад `accessToken` авна
   - `Authorize` товч дарж `Bearer <accessToken>` оруулна
6. Tenant/branch scope-той endpoint дуудахад header өг:
   - `x-tenant-id`
   - `x-branch-id`

Хэрэв заавал `http://localhost/docs` (портгүй) хэлбэрээр нээх бол `API_PORT=80` болгож ажиллуулна (OS permission шаардаж болно).

## Ebarimt POS API 3.0 (Step By Step)
1. `PosAPI 3.0` локал service-ээ тусдаа machine/instance дээр суулгаж ажиллуул.
   - default local URL: `http://localhost:7080`
2. PosAPI дээр оператор эрхтэй хэрэглэгчээр login хийж `идэвхжүүлэлт`-ээ бүрэн хий.
   - Идэвхжүүлээгүй PosAPI дээр `/rest/*` endpoint-ууд ажиллахгүй.
3. API environment тохируул:
   - `apps/api/.env` дотор:
   - `EBARIMT_POSAPI_DEFAULT_URL=http://localhost:7080`
   - `EBARIMT_STAGING_API_URL=https://st-api.ebarimt.mn`
   - `EBARIMT_PRODUCTION_API_URL=https://api.ebarimt.mn`
4. RMS API болон Web асаа:
   - `pnpm dev:api`
   - `pnpm dev:web`
5. Dashboard дээр tenant + branch сонгоод `Ebarimt` page нээ:
   - `http://localhost:3000/ebarimt-settings`
6. Branch config хадгал:
   - `enabled=true`
   - `merchantTin`, `districtCode`, `branchNo`, `posNo` талбаруудаа бөглөнө
   - шаардлагатай бол `xApiKey` оруулна (`save-merchants` endpoint-д)
7. Холболтоо шалга:
   - `Check POS Info` (`/rest/info`)
   - `Sync sendData` (`/rest/sendData`)
   - `Bank Accounts by Merchant TIN` (`/rest/bankAccounts?tin=...`)
8. POS дээр захиалга төлөхөд автоматаар ebarimt issue хийнэ.
   - Хэсэгчилсэн төлбөр дээр `PARTIAL_PAYMENT` reason-оор skip хийнэ.
   - Бүрэн төлөгдсөн үед баримт үүснэ.
9. Баримт хэвлэх:
   - POS ebarimt dialog дээр `F12` эсвэл `Баримт хэвлэх` товч ашиглана.
10. Swagger-аар удирдах/турших endpoint-ууд:
   - `GET/PUT /api/ebarimt/config`
   - `POST /api/ebarimt/issue`
   - `POST /api/ebarimt/void`
   - `GET /api/ebarimt/pos/info`
   - `POST /api/ebarimt/pos/send-data`
   - `GET /api/ebarimt/pos/bank-accounts?tin=...`
   - `GET /api/ebarimt/refs/*`
   - `POST /api/ebarimt/operator/save-merchants`

## Default Accounts (from seed)
- Super Admin:
  - Email: `superadmin@rms.local`
  - Password: `Admin@123`
- Org Admin pattern:
  - `admin+org1@rms.local` ... `admin+org10@rms.local`
  - Password: `Admin@123`
- Branch cashier pattern:
  - `cashier+org{n}b{m}@rms.local`
  - Password: `Cashier@123`

## Project Structure
- `apps/api` Backend API (MVC modules)
- `apps/web` Next.js dashboard/POS/KDS client
- `packages/shared` Shared types/constants for API and Web
- `ARCHITECTURE.md` Detailed architecture and module map

## Notes
- PostgreSQL holds transactional data (tenant, branch, users, orders, payments, inventory)
- MongoDB holds flexible documents (menu catalog details, KDS snapshots)
- API isolates tenant context from JWT and headers (`x-tenant-id`, `x-branch-id`)

## API Modules
- `/api/auth` Login, refresh, profile, employee registration
- `/api/tenants` Multi-tenant organization management
- `/api/branches` Branch management
- `/api/menu` Menu CRUD and availability
- `/api/inventory` Stock CRUD and adjustment
- `/api/orders` POS order lifecycle
- `/api/payments` Payment transactions (pay now / partial)
- `/api/ebarimt` Ebarimt POSAPI 3.0 config + issue + void + references
- `/api/kds` Kitchen ticket flow
- `/api/reports` Financial summary analytics

## Swagger-д баримтжуулсан зүйлс
- Бүх endpoint path
- Request body schema
- Path/query/header parameter-ууд
- Auth (`Bearer` JWT) security scheme
- Error envelope болон success envelope бүтэц
