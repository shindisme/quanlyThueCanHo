# Backend Security Hardening Design

**Date:** 2026-06-28

## Objective

Harden only the backend of the apartment rental management system. The work must preserve existing data, treat the live PostgreSQL database as the schema authority, enforce current user state and building-scoped authorization, standardize API validation and responses, and add automated tests for authentication, RBAC, and data scope.

## Scope and non-goals

In scope:

- Reconcile `schema.prisma` with the live database and create an additive migration.
- Add missing foreign-key and uniqueness guarantees.
- Harden login, user-status checks, RBAC, and Manager data scope.
- Protect building, apartment, tenant, staff, utility reading, invoice, notification, and viewing-schedule operations.
- Move account creation for tenant and staff workflows into backend transactions while preserving the existing account conventions.
- Validate backend input with Zod.
- Standardize success, error, and pagination responses.
- Add global not-found and error middleware.
- Remove duplicate route mounting and mount upload/scheduler correctly.
- Add backend tests.

Out of scope:

- No frontend file changes.
- No reset, truncate, destructive reconciliation, or automatic data cleanup.
- No execution of the new migration against the live database.
- No Redis authorization cache or PostgreSQL row-level security.
- No unrelated refactoring.

The frontend will require a separate follow-up because standardized response envelopes and atomic tenant/staff creation change the client contract.

## Verified current state

The live PostgreSQL database was inspected in read-only mode.

- `prisma db pull --print` and `schema.prisma` describe the same database shape.
- `prisma migrate diff` from the local datamodel to the live datasource produces an empty migration.
- The live database does not record the two migrations currently stored in `prisma/migrations` as applied.
- The current database contains no duplicate apartment identity, utility-period, or tenant-apartment review groups.
- The current database contains no invoice whose `tenant_id` references a missing tenant.
- Every current Manager has a staff record with a building.

The code audit also found:

- Protected requests trust the role stored in JWT and do not reload user status.
- Inactive and banned users can currently log in.
- Manager can currently submit role `ADMIN`.
- Building, apartment, tenant, and staff write routes are not protected.
- Tenant and staff account provisioning is coordinated by frontend code through separate API calls.
- Controllers return several incompatible response and error shapes.
- `/contracts` is mounted twice.
- The upload router is defined but not mounted.
- The invoice scheduler is defined but not started.
- Zod is installed in the backend but is not used.
- No backend test runner or automated tests exist.

## Chosen architecture

Use layered authorization rather than a generic policy engine or PostgreSQL row-level security.

Every protected HTTP request follows this sequence:

1. Verify JWT signature and expiration.
2. Read the current user from the database using the JWT subject.
3. Reject missing, inactive, or banned users.
4. Build a trusted actor from database values.
5. Check the allowed roles for the route.
6. Validate params, query, and body with Zod.
7. Call a service that applies resource scope directly to its Prisma query.
8. Return a standard response or pass an error to the global error middleware.

The trusted actor contains:

- `userId`
- `role`
- `status`
- `staffId`
- `buildingId`
- `tenantId`

Role and scope values from a JWT are never used for authorization. JWT remains the signed proof of identity and expiration; the database remains the authority for current permissions.

## Authentication behavior

### Login

- Validate username and password with Zod.
- Unknown username and incorrect password return the same `INVALID_CREDENTIALS` response.
- Password comparison occurs before exposing account status.
- A correct password for an `INACTIVE` or `BANNED` account returns `ACCOUNT_DISABLED` and no token.
- A successful login signs a JWT whose authorization-relevant identifier is the user ID.
- JWT verification restricts the expected signing algorithm and validates a positive user ID.

### Protected requests

- Invalid, malformed, or expired JWT returns `401`.
- A valid JWT whose user no longer exists returns `401`.
- A valid JWT whose user is no longer active returns `403`.
- The middleware performs one minimal indexed user lookup and stores the result on the request.
- Controllers and services reuse the trusted actor rather than reloading the same user.

### Sensitive user operations

Create user, update role, delete user, and reset password reload the target user inside the operation.

- Manager cannot create or assign role `ADMIN`.
- Manager cannot update, delete, or reset an Admin account.
- Manager cannot act on a staff or tenant account outside the Manager's building scope.
- Admin retains global authority.

Generic account creation is not used to provision tenant or staff records. Those resource workflows create their related accounts atomically, preventing client-supplied `user_id` values from linking arbitrary accounts.

## Role and data-scope rules

### Admin

Admin has global access to all protected resources and may create, update, or delete buildings.

### Manager

Manager scope is the building referenced by `staffs.building_id` for the current user.

- A Manager without a staff profile or assigned building cannot perform management operations.
- List queries include a database `where` filter for the Manager's building.
- Direct reads and mutations outside scope return `404` so resource IDs cannot be enumerated.
- Role denial that is independent of resource identity returns `403`.

Manager permissions:

| Resource | Manager permission |
| --- | --- |
| Building | Read public data and update only the assigned building; cannot create or delete |
| Apartment | Create, read, update, and delete only inside the assigned building |
| Utility reading | Operate only on apartments inside the assigned building |
| Invoice | Operate only on contracts whose apartment is inside the assigned building |
| Notification | Read/send only for recipients and data inside the assigned building |
| Viewing schedule | Manage only schedules for apartments inside the assigned building |
| Staff | Manage only staff assigned to the same building; backend forces the building ID |
| Tenant | Manage tenants with a contract in the building or tenants currently onboarding for the building |
| User | Manage only non-Admin accounts belonging to in-scope staff or tenants |

Staff retains utility-reading access only for the staff member's assigned building. Tenant-facing resources continue to use the current tenant profile and contract ownership rules.

## Tenant onboarding and account creation

The existing user-facing convention is preserved:

- Tenant username is `YH` followed by the last six digits of `citizen_id`.
- Initial password remains `123456`.
- User role is `TENANT`.

The implementation moves provisioning from the frontend into `POST /tenants`:

1. Validate tenant input and reject client-supplied `user_id`.
2. Determine `onboarding_building_id` from the Manager actor. Admin may supply an allowed onboarding building or leave it null.
3. In one database transaction, create the User and linked Tenant.
4. Return the created tenant and generated username in the standard success envelope.
5. If either insert fails, roll back both records.

The `tenants.onboarding_building_id` field establishes temporary scope before a contract exists.

- A Manager can list and manage onboarding tenants only for the Manager's building.
- Contract creation requires the tenant's onboarding building and apartment building to equal the Manager's building.
- Contract creation and clearing `onboarding_building_id` happen in one transaction.
- Afterward, tenant scope is derived from contracts.

This preserves the required workflow:

`create tenant and login account -> create contract`

## Staff account creation

The existing staff account conventions are also preserved:

- Manager-position accounts use the `quanlyN` username pattern and role `MANAGER`.
- Other staff accounts use the `nhanvienN` pattern and role `STAFF`.
- Initial password remains `123456`.

`POST /staff` creates the User and Staff records in one backend transaction. A Manager's `building_id` input is ignored and replaced with the actor's building. Client-supplied `user_id` is rejected for new staff. Database uniqueness remains the final guard against concurrent username allocation.

## Database changes

`schema.prisma` will be updated to describe these additive changes:

1. Nullable `tenants.onboarding_building_id` relation to `buildings.id`, with an index.
2. `invoices.tenant_id` relation to `tenants.id`.
3. Unique apartment identity on `(building_id, floor, room_number)`.
4. Unique utility period on `(apartment_id, month, year)`.
5. Unique review author per apartment on `(apartment_id, tenant_id)`.

Reasons:

- Invoice tenant FK prevents orphan invoices and preserves billing ownership.
- Apartment composite uniqueness prevents two units from sharing the same displayed identity in one building and floor.
- Utility composite uniqueness guarantees one meter reading per apartment and billing month, including under concurrent requests.
- Review composite uniqueness enforces the existing one-review-per-tenant-per-apartment rule under concurrency.
- Onboarding building FK provides a persistent and verifiable Manager scope before contract creation.

The design intentionally does not add uniqueness for `branch_name` or occupant `citizen_id` because global uniqueness for those fields has not been established as a business rule.

## Migration safety

Keep the existing migration files unchanged and add a new migration.

The new migration:

- Contains no `DROP TABLE`, `TRUNCATE`, reset, or record deletion.
- Performs preflight checks for orphan invoice tenants and duplicate unique-key groups.
- Raises an error and stops if unsafe data is found.
- Adds the nullable onboarding column, index, FK, invoice FK, and unique indexes/constraints.

The live database must not receive `prisma migrate deploy` immediately because its migration metadata does not record the two repository migrations.

A separate deployment procedure will document:

1. Re-run the read-only drift and duplicate/orphan checks.
2. Mark the two historical migrations applied with `prisma migrate resolve --applied`.
3. Review the generated SQL.
4. Deploy the additive migration.
5. Verify constraints and Prisma drift again.

`migrate resolve` changes only Prisma migration metadata, but it and the deployment remain separate live-database operations requiring explicit user confirmation.

## Validation design

Create reusable Zod middleware that validates a route schema containing `params`, `query`, and `body`.

- Parsed values replace raw request values.
- Query and multipart string values use explicit coercion where numbers or booleans are expected.
- Unknown or privileged fields such as `user_id`, Manager-controlled `building_id`, and role `ADMIN` are rejected or removed according to the route policy.
- Pagination defaults to page `1`, limit `10`, and an upper limit of `100`.
- IDs must be positive integers.
- Enum values use the Prisma enum domains.

Schemas cover every backend route, with particular attention to login and the protected CRUD/scope modules.

## API contract

Successful single-resource response:

```json
{
  "success": true,
  "data": {}
}
```

Successful paginated response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  }
}
```

HTTP mapping:

- `400`: Zod or malformed input.
- `401`: missing, invalid, or expired authentication.
- `403`: inactive account or role denial.
- `404`: route/resource missing, including scoped resource concealment.
- `409`: uniqueness, FK, or business-state conflict.
- `500`: unexpected internal error without stack trace or database details in the response.

Create a typed application error, async route wrapper, response helpers, not-found middleware, and global error middleware. The error middleware maps Zod, JWT, Multer, Prisma, known application errors, and unknown errors.

## Routes, upload, and scheduler

- Keep public reads for building and apartment list/detail.
- Protect all building and apartment writes.
- Protect all tenant and staff routes.
- Preserve public viewing-schedule booking while protecting schedule management.
- Mount the upload router exactly once at `/uploads`.
- Protect standalone upload with Admin/Manager authorization.
- Restrict upload count, byte size, and accepted image MIME types.
- Mount `/contracts` exactly once.
- Add not-found middleware after routers.
- Add global error middleware last.
- Start the invoice scheduler exactly once from `server.ts` after the HTTP server begins listening.
- Scheduler failures are logged and do not terminate the HTTP server.

## Testing strategy

Add Vitest and Supertest. Build a test app that does not listen on a network port and does not start the scheduler or call real ImageKit/mail services.

Use real bcrypt, JWT, middleware, controllers, policy, and service behavior. Isolate only database and external-service boundaries where a dedicated writable test PostgreSQL database is unavailable. Never write test data to the live database.

Required test groups:

### Authentication

- Valid active user receives a token.
- Unknown username and incorrect password return the same `401` error.
- Inactive and banned users receive no token.
- Invalid and expired JWT is rejected.
- A user deleted or disabled after token issuance is rejected.
- Current database role overrides stale JWT claims.

### RBAC

- Manager cannot create or assign Admin.
- Manager cannot update, delete, or reset an Admin.
- Manager cannot create or delete buildings.
- Admin retains global operations.
- Protected writes reject anonymous requests.

### Data scope

- Manager can update only the assigned building.
- Manager apartment CRUD is restricted to the assigned building.
- Utility, invoice, notification, schedule, and staff access is restricted through the building relationship.
- Manager tenant access includes only same-building contracts or same-building onboarding.
- Tenant creation creates User and Tenant atomically.
- Contract creation accepts only an in-scope onboarding tenant and apartment, then clears onboarding scope.
- Attempts to forge `building_id` or `user_id` do not escape scope.

### API infrastructure

- Public building/apartment reads remain available.
- Zod produces standard validation errors.
- Success, error, and pagination envelopes are stable.
- Upload is mounted and protected.
- Duplicate contract mounting is removed.
- Unknown routes use the standard `404` error.
- Prisma errors map to non-leaking API errors.

Implementation follows red-green-refactor TDD for each behavior. Full tests, TypeScript build, Prisma validation, schema drift checks, and the live read-only duplicate/orphan audit are rerun before completion is claimed.

## Acceptance criteria

- Only backend files are modified.
- No existing data is reset, deleted, or mutated by the migration work.
- The migration exists but is not applied to the live database.
- Live DB and `schema.prisma` are reconciled and documented.
- Login and protected requests enforce current DB status and role.
- Manager cannot grant Admin privileges or access another building's data.
- Required CRUD and scoped modules are protected.
- Tenant creation preserves automatic account creation and the tenant-to-contract workflow.
- Zod validates all backend routes.
- API success, error, and pagination responses are consistent.
- Global error/not-found middleware is active.
- Upload, contract routes, and scheduler are mounted or started once in the correct location.
- Automated tests cover authentication, user state, RBAC, and building data scope.
- Frontend files remain unchanged.
