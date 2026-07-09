# Tenant Occupants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm chức năng tenant tự CRUD người ở cùng, admin/manager chỉ xem.

**Architecture:** Tận dụng model Prisma `Occupant` đã có. Thêm schema, service/controller/route trong module tenant hiện tại và đổi FE `useProfile` sang API thay vì `localStorage`.

**Tech Stack:** Node.js, Express, TypeScript, Prisma, Zod, Vitest, React, TanStack Query.

## Global Constraints

- Không thêm dependency.
- Không thêm bảng mới.
- Tenant chỉ thao tác occupant thuộc `actor.tenantId`.
- User-facing Vietnamese text dùng UTF-8 trực tiếp.

---

### Task 1: Backend Occupant API

**Files:**
- Modify: `backend/src/schemas/tenant.schema.ts`
- Modify: `backend/src/services/tenant.service.ts`
- Modify: `backend/src/controllers/tenant.controller.ts`
- Modify: `backend/src/routes/tenant.route.ts`
- Test: `backend/src/services/tenant.service.test.ts`

**Interfaces:**
- Consumes: `Actor` with `tenantId`.
- Produces: `getMyOccupants(actor)`, `createMyOccupant(input, actor)`, `updateMyOccupant(id, input, actor)`, `deleteMyOccupant(id, actor)`.

- [ ] Write failing service tests for create and tenant-scoped update/delete.
- [ ] Run `rtk npm test -- tenant.service.test.ts` in `backend`; expected fail because functions do not exist.
- [ ] Add occupant request schemas and controller methods.
- [ ] Add service methods using Prisma `occupant`.
- [ ] Add tenant routes under `/tenants/me/occupants`.
- [ ] Run `rtk npm test -- tenant.service.test.ts` in `backend`; expected pass.

### Task 2: Frontend Profile Integration

**Files:**
- Modify: `frontend/src/types/tenant.ts`
- Modify: `frontend/src/services/tenantService.ts`
- Modify: `frontend/src/hooks/common/useProfile.ts`

**Interfaces:**
- Consumes: backend `/tenants/me/occupants`.
- Produces: existing `useProfile()` return shape for `ProfilePage`.

- [ ] Add FE `Occupant` type matching UI fields.
- [ ] Add `getMyOccupants`, `createMyOccupant`, `updateMyOccupant`, `deleteMyOccupant` in `tenantService`.
- [ ] Replace localStorage occupant state in `useProfile` with query/mutation.
- [ ] Keep existing `ProfilePage` JSX unchanged unless TypeScript requires a small adjustment.

### Task 3: Verification

**Commands:**
- Backend: `cd backend; rtk npm test -- tenant.service.test.ts`
- Backend build: `cd backend; rtk npm run build`
- Frontend build: `cd frontend; rtk npm run build`

**Expected:** all commands exit 0.
