# Maintenance Request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng API backend cho luồng cư dân gửi/hủy yêu cầu sửa chữa, quản lý đặt lịch và phân công, kỹ thuật báo hoãn hoặc hoàn tất, kèm thông báo trong tài khoản.

**Architecture:** Mở rộng `MaintenanceRequest` hiện có và giữ cấu trúc route → controller → service → Prisma đang dùng trong backend. Mọi truy vấn được giới hạn theo actor; các chuyển trạng thái và thông báo chạy trong cùng Prisma transaction.

**Tech Stack:** TypeScript, Express 5, Prisma 6/PostgreSQL, Zod 4, Vitest, Supertest.

---

## File map

- Modify `backend/prisma/schema.prisma`: enum, lịch sửa và quan hệ kỹ thuật.
- Create `backend/prisma/migrations/20260703000000_add_maintenance_workflow/migration.sql`: thay đổi PostgreSQL tương ứng.
- Modify `backend/tests/database-migration.test.ts`: khóa cấu trúc migration mới.
- Create `backend/src/schemas/maintenance.schema.ts`: validate toàn bộ request.
- Create `backend/src/services/maintenance.service.ts`: scope, trạng thái và thông báo.
- Create `backend/src/controllers/maintenance.controller.ts`: chuyển request đã validate sang service.
- Create `backend/src/routes/maintenance.routes.ts`: RBAC và các endpoint.
- Modify `backend/src/app.ts`: mount `/maintenance`.
- Create `backend/tests/maintenance.test.ts`: kiểm thử API, scope và luồng trạng thái.

### Task 1: Mở rộng database

**Files:**
- Modify: `backend/tests/database-migration.test.ts`
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260703000000_add_maintenance_workflow/migration.sql`

- [ ] **Step 1: Viết kiểm thử migration thất bại**

Thêm đường dẫn:

```ts
const maintenanceWorkflowPath = fileURLToPath(
    new URL(
        "../prisma/migrations/20260703000000_add_maintenance_workflow/migration.sql",
        import.meta.url
    )
);
```

Đổi danh sách migration mong đợi:

```ts
expect(migrationDirectories).toEqual([
    "20260627000000_baseline_current_database",
    "20260628000000_harden_integrity_and_scope",
    "20260703000000_add_maintenance_workflow"
]);
```

Thêm test:

```ts
it("adds the maintenance workflow without destructive changes", () => {
    expect(existsSync(maintenanceWorkflowPath)).toBe(true);
    if (!existsSync(maintenanceWorkflowPath)) return;

    const migration = readFileSync(maintenanceWorkflowPath, "utf8");
    const schema = readFileSync(schemaPath, "utf8");

    expect(migration).toContain(
        'ALTER TYPE "RequestStatus" ADD VALUE \'NEEDS_RESCHEDULE\''
    );
    expect(migration).toContain(
        'ALTER TYPE "RequestStatus" ADD VALUE \'CANCELLED\''
    );
    expect(migration).toMatch(
        /ALTER TABLE "maintenance_requests"[\s\S]*"assigned_staff_id" INTEGER[\s\S]*"scheduled_at" TIMESTAMP\(3\)[\s\S]*"unable_reason" TEXT/
    );
    expect(migration).toContain(
        'CREATE INDEX "maintenance_requests_assigned_staff_id_status_idx"'
    );
    expect(migration).toMatch(
        /FOREIGN KEY \("assigned_staff_id"\)[\s\S]*REFERENCES "staffs"\("id"\)[\s\S]*ON DELETE SET NULL/
    );
    expect(migration).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);

    expect(schema).toMatch(
        /enum RequestStatus \{[\s\S]*NEEDS_RESCHEDULE[\s\S]*CANCELLED[\s\S]*\}/
    );
    expect(schema).toMatch(
        /model MaintenanceRequest \{[\s\S]*assigned_staff_id Int\?[\s\S]*scheduled_at\s+DateTime\?[\s\S]*unable_reason\s+String\?/
    );
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
cd backend
npx vitest run tests/database-migration.test.ts
```

Expected: FAIL vì migration thứ ba và file SQL chưa tồn tại.

- [ ] **Step 3: Sửa Prisma schema tối thiểu**

Thay enum:

```prisma
enum RequestStatus {
  PENDING
  PROCESSING
  NEEDS_RESCHEDULE
  DONE
  CANCELLED
}
```

Thêm vào `Staff`:

```prisma
maintenance_requests MaintenanceRequest[] @relation("MaintenanceTechnician")
```

Thay model yêu cầu bằng:

```prisma
model MaintenanceRequest {
  id                Int           @id @default(autoincrement())
  tenant_id         Int
  apartment_id      Int
  assigned_staff_id Int?
  title             String
  description       String        @db.Text
  image_url         String?
  priority          Priority      @default(MEDIUM)
  status            RequestStatus @default(PENDING)
  scheduled_at      DateTime?
  unable_reason     String?       @db.Text
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  tenant         Tenant @relation(fields: [tenant_id], references: [id])
  apartment      Apartment @relation(fields: [apartment_id], references: [id])
  assigned_staff Staff? @relation("MaintenanceTechnician", fields: [assigned_staff_id], references: [id], onDelete: SetNull)

  @@index([tenant_id])
  @@index([apartment_id])
  @@index([status, created_at])
  @@index([assigned_staff_id, status])
  @@map("maintenance_requests")
}
```

- [ ] **Step 4: Tạo migration SQL**

```sql
ALTER TYPE "RequestStatus" ADD VALUE 'NEEDS_RESCHEDULE';
ALTER TYPE "RequestStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "maintenance_requests"
ADD COLUMN "assigned_staff_id" INTEGER,
ADD COLUMN "scheduled_at" TIMESTAMP(3),
ADD COLUMN "unable_reason" TEXT;

CREATE INDEX "maintenance_requests_assigned_staff_id_status_idx"
ON "maintenance_requests"("assigned_staff_id", "status");

ALTER TABLE "maintenance_requests"
ADD CONSTRAINT "maintenance_requests_assigned_staff_id_fkey"
FOREIGN KEY ("assigned_staff_id")
REFERENCES "staffs"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
```

- [ ] **Step 5: Sinh lại Prisma Client và xác nhận GREEN**

Run:

```powershell
cd backend
npm run prisma:gen
npx vitest run tests/database-migration.test.ts
```

Expected: Prisma generate thành công; test migration PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- backend/prisma/schema.prisma backend/prisma/migrations/20260703000000_add_maintenance_workflow/migration.sql backend/tests/database-migration.test.ts
git commit -m "feat: add maintenance workflow data model"
```

### Task 2: API xem danh sách và chi tiết theo vai trò

**Files:**
- Create: `backend/tests/maintenance.test.ts`
- Create: `backend/src/schemas/maintenance.schema.ts`
- Create: `backend/src/services/maintenance.service.ts`
- Create: `backend/src/controllers/maintenance.controller.ts`
- Create: `backend/src/routes/maintenance.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Viết test scope và route mount**

Tạo phần đầu `backend/tests/maintenance.test.ts`:

```ts
import {
    Priority,
    RequestStatus,
    Role,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import { ROUTE_MOUNTS } from "../src/app.js";
import maintenanceRouter from "../src/routes/maintenance.routes.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import { prismaMock } from "./setup.js";

const MANAGER_USER_ID = 101;
const TENANT_USER_ID = 102;
const STAFF_USER_ID = 103;
const MANAGER_STAFF_ID = 201;
const TECHNICIAN_ID = 202;
const TENANT_ID = 301;
const BUILDING_ID = 401;
const APARTMENT_ID = 501;
const REQUEST_ID = 601;

const authorizationFor = (userId: number) =>
    createBearerToken(userId);

const authenticateAs = (role: Role) => {
    const userId = role === Role.MANAGER
        ? MANAGER_USER_ID
        : role === Role.STAFF
            ? STAFF_USER_ID
            : TENANT_USER_ID;

    prismaMock.user.findUnique.mockResolvedValueOnce({
        id: userId,
        role,
        status: UserStatus.ACTIVE,
        staff: role === Role.MANAGER
            ? { id: MANAGER_STAFF_ID, building_id: BUILDING_ID }
            : role === Role.STAFF
                ? { id: TECHNICIAN_ID, building_id: BUILDING_ID }
                : null,
        tenant: role === Role.TENANT ? { id: TENANT_ID } : null
    } as never);

    return authorizationFor(userId);
};

const maintenanceApp = () =>
    createTestApp(maintenanceRouter, "/maintenance");

const maintenanceRow = (
    status: RequestStatus = RequestStatus.PENDING
) => ({
    id: REQUEST_ID,
    tenant_id: TENANT_ID,
    apartment_id: APARTMENT_ID,
    assigned_staff_id: null,
    title: "Rò rỉ nước",
    description: "Ống nước dưới bồn rửa bị rò",
    image_url: null,
    priority: Priority.HIGH,
    status,
    scheduled_at: null,
    unable_reason: null,
    created_at: new Date("2026-07-03T01:00:00.000Z"),
    updated_at: new Date("2026-07-03T01:00:00.000Z"),
    tenant: {
        id: TENANT_ID,
        user_id: TENANT_USER_ID,
        full_name: "Nguyễn Văn A"
    },
    apartment: {
        id: APARTMENT_ID,
        building_id: BUILDING_ID,
        floor: 3,
        room_number: "302",
        building: {
            id: BUILDING_ID,
            branch_name: "Tòa A",
            address_new: "1 Nguyễn Huệ"
        }
    },
    assigned_staff: null
});

beforeEach(() => {
    prismaMock.$transaction.mockImplementation(
        async (operation: unknown) => {
            if (typeof operation === "function") {
                return (
                    operation as (
                        client: typeof prismaMock
                    ) => Promise<unknown>
                )(prismaMock);
            }

            return Promise.all(operation as Promise<unknown>[]);
        }
    );
});

describe("maintenance read API", () => {
    it("mounts /maintenance exactly once", () => {
        expect(
            ROUTE_MOUNTS.filter(([path]) => path === "/maintenance")
        ).toHaveLength(1);
    });

    it("scopes a Manager list to the assigned building", async () => {
        const authorization = authenticateAs(Role.MANAGER);
        prismaMock.maintenanceRequest.findMany.mockResolvedValueOnce([]);
        prismaMock.maintenanceRequest.count.mockResolvedValueOnce(0);

        const response = await request(maintenanceApp())
            .get("/maintenance?status=PENDING")
            .set("Authorization", authorization);

        expect(response.status).toBe(200);
        expect(prismaMock.maintenanceRequest.findMany)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    AND: [
                        {
                            apartment: {
                                building_id: BUILDING_ID,
                                building: expect.any(Object)
                            }
                        },
                        { status: RequestStatus.PENDING }
                    ]
                }
            }));
    });

    it("hides a Tenant point read outside their scope", async () => {
        const authorization = authenticateAs(Role.TENANT);
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(null);

        const response = await request(maintenanceApp())
            .get(`/maintenance/${REQUEST_ID}`)
            .set("Authorization", authorization);

        expect(response.status).toBe(404);
        expect(prismaMock.maintenanceRequest.findFirst)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: REQUEST_ID,
                    tenant_id: TENANT_ID
                }
            }));
    });
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
```

Expected: FAIL vì route và module maintenance chưa tồn tại.

- [ ] **Step 3: Tạo schema cho read API**

Tạo `backend/src/schemas/maintenance.schema.ts`:

```ts
import {
    Priority,
    RequestStatus
} from "@prisma/client";
import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const optionalEmptyBodySchema = emptyObjectSchema.default({});
const positiveIdSchema = z.coerce.number().int().positive();

export const listMaintenanceRequestSchema = z.object({
    params: emptyObjectSchema,
    query: z.object({
        status: z.nativeEnum(RequestStatus).optional(),
        priority: z.nativeEnum(Priority).optional(),
        building_id: positiveIdSchema.optional(),
        page: positiveIdSchema.default(1),
        limit: positiveIdSchema.max(100).default(10)
    }).strict(),
    body: optionalEmptyBodySchema
}).strict();

export const maintenanceIdRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: optionalEmptyBodySchema
}).strict();

export type ListMaintenanceRequest = z.infer<
    typeof listMaintenanceRequestSchema
>;
export type MaintenanceIdRequest = z.infer<
    typeof maintenanceIdRequestSchema
>;
```

- [ ] **Step 4: Tạo service đọc có scope**

Tạo `backend/src/services/maintenance.service.ts` với các phần sau:

```ts
import {
    Prisma,
    Role
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type { ListMaintenanceRequest } from "../schemas/maintenance.schema.js";
import type { Actor } from "../types/auth.js";
import {
    getCurrentManagerAssignment,
    getCurrentStaffAssignment
} from "./manager-scope.js";

const maintenanceInclude = {
    tenant: {
        select: {
            id: true,
            user_id: true,
            full_name: true
        }
    },
    apartment: {
        select: {
            id: true,
            building_id: true,
            floor: true,
            room_number: true,
            building: {
                select: {
                    id: true,
                    branch_name: true,
                    address_new: true
                }
            }
        }
    },
    assigned_staff: {
        select: {
            id: true,
            full_name: true,
            phone: true,
            position: true,
            building_id: true
        }
    }
} satisfies Prisma.MaintenanceRequestInclude;

const notFound = () => new AppError(
    404,
    "NOT_FOUND",
    "Maintenance request was not found"
);

const forbidden = () => new AppError(
    403,
    "FORBIDDEN",
    "You do not have access to maintenance requests"
);

const conflict = (message: string) => new AppError(
    409,
    "INVALID_STATUS_TRANSITION",
    message
);

const getScope = (
    actor: Actor
): Prisma.MaintenanceRequestWhereInput => {
    if (actor.role === Role.ADMIN) {
        return {};
    }

    if (actor.role === Role.MANAGER) {
        const assignment = getCurrentManagerAssignment(actor);
        return {
            apartment: {
                building_id: assignment.buildingId,
                building: assignment.assignmentWhere
            }
        };
    }

    if (actor.role === Role.STAFF) {
        const assignment = getCurrentStaffAssignment(actor);
        return {
            assigned_staff_id: actor.staffId!,
            apartment: {
                building_id: assignment.buildingId,
                building: assignment.assignmentWhere
            }
        };
    }

    if (actor.role === Role.TENANT && actor.tenantId !== undefined) {
        return { tenant_id: actor.tenantId };
    }

    throw forbidden();
};

export const getMaintenanceRequestsService = async (
    filters: ListMaintenanceRequest["query"],
    actor: Actor
) => {
    const conditions: Prisma.MaintenanceRequestWhereInput[] = [
        getScope(actor)
    ];

    if (filters.status !== undefined) {
        conditions.push({ status: filters.status });
    }
    if (filters.priority !== undefined) {
        conditions.push({ priority: filters.priority });
    }
    if (
        actor.role === Role.ADMIN
        && filters.building_id !== undefined
    ) {
        conditions.push({
            apartment: { building_id: filters.building_id }
        });
    }

    const where = {
        AND: conditions
    } satisfies Prisma.MaintenanceRequestWhereInput;
    const skip = (filters.page - 1) * filters.limit;
    const [data, total] = await prisma.$transaction([
        prisma.maintenanceRequest.findMany({
            where,
            skip,
            take: filters.limit,
            orderBy: { created_at: "desc" },
            include: maintenanceInclude
        }),
        prisma.maintenanceRequest.count({ where })
    ]);

    return {
        data,
        pagination: {
            total,
            page: filters.page,
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        }
    };
};

export const getMaintenanceRequestByIdService = async (
    id: number,
    actor: Actor
) => {
    const maintenanceRequest =
        await prisma.maintenanceRequest.findFirst({
            where: {
                id,
                ...getScope(actor)
            },
            include: maintenanceInclude
        });

    if (!maintenanceRequest) {
        throw notFound();
    }

    return maintenanceRequest;
};
```

- [ ] **Step 5: Tạo controller, route và mount**

Tạo `backend/src/controllers/maintenance.controller.ts`:

```ts
import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    ListMaintenanceRequest,
    MaintenanceIdRequest
} from "../schemas/maintenance.schema.js";
import * as maintenanceService from "../services/maintenance.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const getAll = async (
    request: Request,
    response: Response
) => {
    const { query } =
        getValidated<ListMaintenanceRequest>(request);
    const result =
        await maintenanceService.getMaintenanceRequestsService(
            query,
            request.actor!
        );

    return sendPaginated(
        response,
        result.data,
        result.pagination
    );
};

export const getById = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<MaintenanceIdRequest>(request);
    const result =
        await maintenanceService.getMaintenanceRequestByIdService(
            params.id,
            request.actor!
        );

    return sendSuccess(response, result);
};
```

Tạo `backend/src/routes/maintenance.routes.ts`:

```ts
import { Role } from "@prisma/client";
import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    listMaintenanceRequestSchema,
    maintenanceIdRequestSchema
} from "../schemas/maintenance.schema.js";

const router = Router();
const readRoles = [
    Role.ADMIN,
    Role.MANAGER,
    Role.STAFF,
    Role.TENANT
];

router.get(
    "/",
    authenticate,
    authorizeRole(readRoles),
    validate(listMaintenanceRequestSchema),
    maintenanceController.getAll
);
router.get(
    "/:id",
    authenticate,
    authorizeRole(readRoles),
    validate(maintenanceIdRequestSchema),
    maintenanceController.getById
);

export default router;
```

Trong `backend/src/app.ts`, thêm import:

```ts
import maintenanceRouter from "./routes/maintenance.routes.js";
```

Thêm mount:

```ts
["/maintenance", maintenanceRouter],
```

- [ ] **Step 6: Chạy test và type-check**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
npx tsc --noEmit
```

Expected: cả hai lệnh PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- backend/src/app.ts backend/src/schemas/maintenance.schema.ts backend/src/services/maintenance.service.ts backend/src/controllers/maintenance.controller.ts backend/src/routes/maintenance.routes.ts backend/tests/maintenance.test.ts
git commit -m "feat: add scoped maintenance read API"
```

### Task 3: Cư dân tạo và hủy yêu cầu

**Files:**
- Modify: `backend/tests/maintenance.test.ts`
- Modify: `backend/src/schemas/maintenance.schema.ts`
- Modify: `backend/src/services/maintenance.service.ts`
- Modify: `backend/src/controllers/maintenance.controller.ts`
- Modify: `backend/src/routes/maintenance.routes.ts`

- [ ] **Step 1: Viết test tạo và hủy**

Thêm:

```ts
describe("tenant maintenance commands", () => {
    it("creates only through an active tenant-apartment contract", async () => {
        const authorization = authenticateAs(Role.TENANT);
        const created = maintenanceRow();
        prismaMock.maintenanceRequest.create
            .mockResolvedValueOnce(created as never);

        const response = await request(maintenanceApp())
            .post("/maintenance")
            .set("Authorization", authorization)
            .send({
                apartment_id: APARTMENT_ID,
                title: " Rò rỉ nước ",
                description: " Ống nước dưới bồn rửa bị rò ",
                priority: Priority.HIGH
            });

        expect(response.status).toBe(201);
        expect(prismaMock.maintenanceRequest.create)
            .toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    title: "Rò rỉ nước",
                    description: "Ống nước dưới bồn rửa bị rò",
                    tenant: {
                        connect: {
                            id: TENANT_ID,
                            user_id: TENANT_USER_ID
                        }
                    },
                    apartment: {
                        connect: {
                            id: APARTMENT_ID,
                            contracts: {
                                some: {
                                    tenant_id: TENANT_ID,
                                    status: "ACTIVE"
                                }
                            }
                        }
                    }
                })
            }));
    });

    it("cancels only the owner's PENDING request with PUT", async () => {
        const authorization = authenticateAs(Role.TENANT);
        const current = maintenanceRow();
        const cancelled = {
            ...current,
            status: RequestStatus.CANCELLED
        };
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(current as never);
        prismaMock.maintenanceRequest.update
            .mockResolvedValueOnce(cancelled as never);

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/cancel`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("CANCELLED");
        expect(prismaMock.maintenanceRequest.update)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: REQUEST_ID,
                    tenant_id: TENANT_ID,
                    status: RequestStatus.PENDING
                },
                data: { status: RequestStatus.CANCELLED }
            }));
    });

    it("rejects cancellation after manager confirmation", async () => {
        const authorization = authenticateAs(Role.TENANT);
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(
                maintenanceRow(RequestStatus.PROCESSING) as never
            );

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/cancel`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(409);
        expect(prismaMock.maintenanceRequest.update)
            .not.toHaveBeenCalled();
    });

    it("does not expose PATCH for cancellation", async () => {
        const response = await request(maintenanceApp())
            .patch(`/maintenance/${REQUEST_ID}/cancel`)
            .send({});

        expect(response.status).toBe(404);
    });
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
```

Expected: FAIL với route `POST`/`PUT` chưa tồn tại.

- [ ] **Step 3: Thêm schema create và cancel**

Thêm vào schema:

```ts
export const createMaintenanceRequestSchema = z.object({
    params: emptyObjectSchema,
    query: emptyObjectSchema,
    body: z.object({
        apartment_id: z.number().int().positive(),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(10_000),
        priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
        image_url: z.url().max(2048).optional()
    }).strict()
}).strict();

export const cancelMaintenanceRequestSchema =
    maintenanceIdRequestSchema;

export type CreateMaintenanceRequest = z.infer<
    typeof createMaintenanceRequestSchema
>;
```

- [ ] **Step 4: Thêm service create và cancel**

Mở rộng import Prisma:

```ts
import {
    ContractStatus,
    Prisma,
    RequestStatus,
    Role
} from "@prisma/client";
```

Thêm helper:

```ts
const isRecordNotFound = (error: unknown) =>
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2025";
```

Thêm hai hàm:

```ts
export const createMaintenanceRequestService = async (
    input: CreateMaintenanceRequest["body"],
    actor: Actor
) => {
    if (actor.tenantId === undefined) {
        throw forbidden();
    }

    try {
        return await prisma.maintenanceRequest.create({
            data: {
                title: input.title,
                description: input.description,
                priority: input.priority,
                image_url: input.image_url,
                tenant: {
                    connect: {
                        id: actor.tenantId,
                        user_id: actor.userId
                    }
                },
                apartment: {
                    connect: {
                        id: input.apartment_id,
                        contracts: {
                            some: {
                                tenant_id: actor.tenantId,
                                status: ContractStatus.ACTIVE
                            }
                        }
                    }
                }
            },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw notFound();
        }
        throw error;
    }
};

export const cancelMaintenanceRequestService = async (
    id: number,
    actor: Actor
) => {
    if (actor.tenantId === undefined) {
        throw forbidden();
    }

    const current = await prisma.maintenanceRequest.findFirst({
        where: {
            id,
            tenant_id: actor.tenantId
        },
        include: maintenanceInclude
    });

    if (!current) {
        throw notFound();
    }
    if (current.status !== RequestStatus.PENDING) {
        throw conflict(
            "Only a pending maintenance request can be cancelled"
        );
    }

    try {
        return await prisma.maintenanceRequest.update({
            where: {
                id,
                tenant_id: actor.tenantId,
                status: RequestStatus.PENDING
            },
            data: { status: RequestStatus.CANCELLED },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Maintenance request status changed");
        }
        throw error;
    }
};
```

Thêm type import:

```ts
import type {
    CreateMaintenanceRequest,
    ListMaintenanceRequest
} from "../schemas/maintenance.schema.js";
```

Đổi type import trong controller thành:

```ts
import type {
    CreateMaintenanceRequest,
    ListMaintenanceRequest,
    MaintenanceIdRequest
} from "../schemas/maintenance.schema.js";
```

Đổi schema import trong route thành:

```ts
import {
    cancelMaintenanceRequestSchema,
    createMaintenanceRequestSchema,
    listMaintenanceRequestSchema,
    maintenanceIdRequestSchema
} from "../schemas/maintenance.schema.js";
```

- [ ] **Step 5: Nối controller và route**

Thêm controller:

```ts
export const create = async (
    request: Request,
    response: Response
) => {
    const { body } =
        getValidated<CreateMaintenanceRequest>(request);
    const result =
        await maintenanceService.createMaintenanceRequestService(
            body,
            request.actor!
        );

    return sendSuccess(response, result, 201);
};

export const cancel = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<MaintenanceIdRequest>(request);
    const result =
        await maintenanceService.cancelMaintenanceRequestService(
            params.id,
            request.actor!
        );

    return sendSuccess(response, result);
};
```

Thêm route trước `GET /:id`:

```ts
router.post(
    "/",
    authenticate,
    authorizeRole([Role.TENANT]),
    validate(createMaintenanceRequestSchema),
    maintenanceController.create
);
router.put(
    "/:id/cancel",
    authenticate,
    authorizeRole([Role.TENANT]),
    validate(cancelMaintenanceRequestSchema),
    maintenanceController.cancel
);
```

- [ ] **Step 6: Chạy test**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- backend/src/schemas/maintenance.schema.ts backend/src/services/maintenance.service.ts backend/src/controllers/maintenance.controller.ts backend/src/routes/maintenance.routes.ts backend/tests/maintenance.test.ts
git commit -m "feat: let tenants create and cancel maintenance"
```

### Task 4: Quản lý xác nhận lịch và phân công kỹ thuật

**Files:**
- Modify: `backend/tests/maintenance.test.ts`
- Modify: `backend/src/schemas/maintenance.schema.ts`
- Modify: `backend/src/services/maintenance.service.ts`
- Modify: `backend/src/controllers/maintenance.controller.ts`
- Modify: `backend/src/routes/maintenance.routes.ts`

- [ ] **Step 1: Viết test xác nhận và lên lịch lại**

Thêm test dùng `scheduled_at = "2030-01-10T09:00:00+07:00"`:

```ts
describe("manager maintenance confirmation", () => {
    it.each([
        RequestStatus.PENDING,
        RequestStatus.NEEDS_RESCHEDULE
    ])("confirms %s with a same-building technician", async (status) => {
        const authorization = authenticateAs(Role.MANAGER);
        const current = maintenanceRow(status);
        const technician = {
            id: TECHNICIAN_ID,
            user_id: STAFF_USER_ID,
            building_id: BUILDING_ID,
            full_name: "Trần Kỹ Thuật",
            phone: "0909000000",
            position: "Kỹ thuật",
            user: {
                id: STAFF_USER_ID,
                role: Role.STAFF,
                status: UserStatus.ACTIVE
            }
        };
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(current as never);
        prismaMock.staff.findFirst
            .mockResolvedValueOnce(technician as never);
        prismaMock.maintenanceRequest.update
            .mockResolvedValueOnce({
                ...current,
                status: RequestStatus.PROCESSING,
                assigned_staff_id: TECHNICIAN_ID,
                scheduled_at:
                    new Date("2030-01-10T02:00:00.000Z"),
                assigned_staff: technician
            } as never);
        prismaMock.notification.create
            .mockResolvedValueOnce({} as never);

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/confirm`)
            .set("Authorization", authorization)
            .send({
                assigned_staff_id: TECHNICIAN_ID,
                scheduled_at: "2030-01-10T09:00:00+07:00"
            });

        expect(response.status).toBe(200);
        expect(prismaMock.maintenanceRequest.update)
            .toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    id: REQUEST_ID,
                    status
                }),
                data: expect.objectContaining({
                    status: RequestStatus.PROCESSING,
                    unable_reason: null
                })
            }));
        expect(prismaMock.notification.create)
            .toHaveBeenCalledWith({
                data: expect.objectContaining({
                    user_id: TENANT_USER_ID,
                    type: "MAINTENANCE"
                })
            });
    });

    it("rejects a non-technical assignment", async () => {
        const authorization = authenticateAs(Role.MANAGER);
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(maintenanceRow() as never);
        prismaMock.staff.findFirst.mockResolvedValueOnce(null);

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/confirm`)
            .set("Authorization", authorization)
            .send({
                assigned_staff_id: TECHNICIAN_ID,
                scheduled_at: "2030-01-10T09:00:00+07:00"
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("INVALID_TECHNICIAN");
        expect(prismaMock.maintenanceRequest.update)
            .not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
```

Expected: FAIL với route confirm chưa tồn tại.

- [ ] **Step 3: Thêm confirm schema**

```ts
import { strictRfc3339DateSchema } from "./strict-date.schema.js";

export const confirmMaintenanceRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        assigned_staff_id: z.number().int().positive(),
        scheduled_at: strictRfc3339DateSchema
    }).strict()
}).strict();

export type ConfirmMaintenanceRequest = z.infer<
    typeof confirmMaintenanceRequestSchema
>;
```

- [ ] **Step 4: Thêm confirm service**

Thêm helper:

```ts
const invalidTechnician = () => new AppError(
    400,
    "INVALID_TECHNICIAN",
    "Assigned staff must be an active technician in the same building"
);

const formatSchedule = (value: Date) =>
    new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh"
    }).format(value);
```

Thêm service:

```ts
export const confirmMaintenanceRequestService = async (
    id: number,
    input: ConfirmMaintenanceRequest["body"],
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    if (
        actor.role !== Role.ADMIN
        && actor.role !== Role.MANAGER
    ) {
        throw forbidden();
    }
    if (input.scheduled_at <= new Date()) {
        throw new AppError(
            400,
            "INVALID_SCHEDULE",
            "scheduled_at must be in the future"
        );
    }

    const scope = getScope(actor);
    const current = await transaction.maintenanceRequest.findFirst({
        where: {
            id,
            ...scope
        },
        include: maintenanceInclude
    });

    if (!current) {
        throw notFound();
    }
    if (
        current.status !== RequestStatus.PENDING
        && current.status !== RequestStatus.NEEDS_RESCHEDULE
    ) {
        throw conflict(
            "Only pending or reschedule-required requests can be confirmed"
        );
    }

    const technician = await transaction.staff.findFirst({
        where: {
            id: input.assigned_staff_id,
            building_id: current.apartment.building_id,
            position: "Kỹ thuật",
            user: {
                role: Role.STAFF,
                status: UserStatus.ACTIVE
            }
        },
        include: {
            user: true
        }
    });

    if (!technician) {
        throw invalidTechnician();
    }

    let updated;
    try {
        updated = await transaction.maintenanceRequest.update({
            where: {
                id,
                status: current.status,
                ...scope
            },
            data: {
                status: RequestStatus.PROCESSING,
                scheduled_at: input.scheduled_at,
                unable_reason: null,
                assigned_staff: {
                    connect: {
                        id: technician.id,
                        building_id: current.apartment.building_id,
                        position: "Kỹ thuật",
                        user: {
                            role: Role.STAFF,
                            status: UserStatus.ACTIVE
                        }
                    }
                }
            },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Maintenance request status changed");
        }
        throw error;
    }

    if (current.tenant.user_id !== null) {
        await transaction.notification.create({
            data: {
                user_id: current.tenant.user_id,
                title: "Lịch sửa chữa đã được xác nhận",
                content:
                    `${current.title} - phòng `
                    + `${current.apartment.room_number}, `
                    + `${formatSchedule(input.scheduled_at)}, `
                    + `kỹ thuật: ${technician.full_name}`,
                type: "MAINTENANCE"
            }
        });
    }

    return updated;
});
```

Thêm `UserStatus` và `ConfirmMaintenanceRequest` vào imports.

Các import đầy đủ được đổi thành:

```ts
import {
    ContractStatus,
    Prisma,
    RequestStatus,
    Role,
    UserStatus
} from "@prisma/client";
import type {
    ConfirmMaintenanceRequest,
    CreateMaintenanceRequest,
    ListMaintenanceRequest
} from "../schemas/maintenance.schema.js";
```

- [ ] **Step 5: Nối controller và PUT route**

Controller:

Đổi type import trong controller thành:

```ts
import type {
    ConfirmMaintenanceRequest,
    CreateMaintenanceRequest,
    ListMaintenanceRequest,
    MaintenanceIdRequest
} from "../schemas/maintenance.schema.js";
```

```ts
export const confirm = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<ConfirmMaintenanceRequest>(request);
    const result =
        await maintenanceService.confirmMaintenanceRequestService(
            params.id,
            body,
            request.actor!
        );

    return sendSuccess(response, result);
};
```

Route:

Đổi schema import trong route thành:

```ts
import {
    cancelMaintenanceRequestSchema,
    confirmMaintenanceRequestSchema,
    createMaintenanceRequestSchema,
    listMaintenanceRequestSchema,
    maintenanceIdRequestSchema
} from "../schemas/maintenance.schema.js";
```

```ts
router.put(
    "/:id/confirm",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(confirmMaintenanceRequestSchema),
    maintenanceController.confirm
);
```

- [ ] **Step 6: Chạy test**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- backend/src/schemas/maintenance.schema.ts backend/src/services/maintenance.service.ts backend/src/controllers/maintenance.controller.ts backend/src/routes/maintenance.routes.ts backend/tests/maintenance.test.ts
git commit -m "feat: schedule and assign maintenance requests"
```

### Task 5: Kỹ thuật báo chưa thể sửa hoặc hoàn tất

**Files:**
- Modify: `backend/tests/maintenance.test.ts`
- Modify: `backend/src/schemas/maintenance.schema.ts`
- Modify: `backend/src/services/maintenance.service.ts`
- Modify: `backend/src/controllers/maintenance.controller.ts`
- Modify: `backend/src/routes/maintenance.routes.ts`

- [ ] **Step 1: Viết test hai kết quả kỹ thuật**

Thêm helper:

```ts
const assignedMaintenanceRow = () => ({
    ...maintenanceRow(RequestStatus.PROCESSING),
    assigned_staff_id: TECHNICIAN_ID,
    scheduled_at: new Date("2030-01-10T02:00:00.000Z"),
    assigned_staff: {
        id: TECHNICIAN_ID,
        full_name: "Trần Kỹ Thuật",
        phone: "0909000000",
        position: "Kỹ thuật",
        building_id: BUILDING_ID
    }
});
```

Thêm tests:

```ts
describe("assigned technician commands", () => {
    it("reports an unable reason and notifies tenant and manager", async () => {
        const authorization = authenticateAs(Role.STAFF);
        const current = assignedMaintenanceRow();
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(current as never);
        prismaMock.maintenanceRequest.update
            .mockResolvedValueOnce({
                ...current,
                status: RequestStatus.NEEDS_RESCHEDULE,
                unable_reason: "Không liên hệ được cư dân"
            } as never);
        prismaMock.user.findMany.mockResolvedValueOnce([
            { id: MANAGER_USER_ID }
        ] as never);
        prismaMock.notification.createMany
            .mockResolvedValueOnce({ count: 2 });

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/unable`)
            .set("Authorization", authorization)
            .send({ reason: " Không liên hệ được cư dân " });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(
            RequestStatus.NEEDS_RESCHEDULE
        );
        expect(prismaMock.notification.createMany)
            .toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        user_id: TENANT_USER_ID,
                        type: "MAINTENANCE"
                    }),
                    expect.objectContaining({
                        user_id: MANAGER_USER_ID,
                        type: "MAINTENANCE"
                    })
                ])
            });
    });

    it("completes and notifies the tenant", async () => {
        const authorization = authenticateAs(Role.STAFF);
        const current = assignedMaintenanceRow();
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(current as never);
        prismaMock.maintenanceRequest.update
            .mockResolvedValueOnce({
                ...current,
                status: RequestStatus.DONE
            } as never);
        prismaMock.notification.createMany
            .mockResolvedValueOnce({ count: 1 });

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/complete`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(RequestStatus.DONE);
        expect(prismaMock.notification.createMany)
            .toHaveBeenCalledWith({
                data: [expect.objectContaining({
                    user_id: TENANT_USER_ID,
                    type: "MAINTENANCE"
                })]
            });
    });

    it("hides requests assigned to another technician", async () => {
        const authorization = authenticateAs(Role.STAFF);
        prismaMock.maintenanceRequest.findFirst
            .mockResolvedValueOnce(null);

        const response = await request(maintenanceApp())
            .put(`/maintenance/${REQUEST_ID}/complete`)
            .set("Authorization", authorization)
            .send({});

        expect(response.status).toBe(404);
        expect(prismaMock.maintenanceRequest.update)
            .not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
```

Expected: FAIL vì hai route kỹ thuật chưa tồn tại.

- [ ] **Step 3: Thêm schema unable và complete**

```ts
export const unableMaintenanceRequestSchema = z.object({
    params: z.object({
        id: positiveIdSchema
    }).strict(),
    query: emptyObjectSchema,
    body: z.object({
        reason: z.string().trim().min(1).max(2000)
    }).strict()
}).strict();

export const completeMaintenanceRequestSchema =
    maintenanceIdRequestSchema;

export type UnableMaintenanceRequest = z.infer<
    typeof unableMaintenanceRequestSchema
>;
```

- [ ] **Step 4: Thêm service dùng chung cho kỹ thuật**

Thêm:

```ts
const getAssignedProcessingRequest = async (
    transaction: Prisma.TransactionClient,
    id: number,
    actor: Actor
) => {
    const assignment = getCurrentStaffAssignment(actor);
    const current = await transaction.maintenanceRequest.findFirst({
        where: {
            id,
            assigned_staff_id: actor.staffId,
            assigned_staff: {
                id: actor.staffId,
                user_id: actor.userId,
                position: "Kỹ thuật",
                user: {
                    role: Role.STAFF,
                    status: UserStatus.ACTIVE
                }
            },
            apartment: {
                building_id: assignment.buildingId,
                building: assignment.assignmentWhere
            }
        },
        include: maintenanceInclude
    });

    if (!current) {
        throw notFound();
    }
    if (current.status !== RequestStatus.PROCESSING) {
        throw conflict(
            "Only a processing maintenance request can be updated"
        );
    }

    return {
        current,
        assignment
    };
};

const createMaintenanceNotifications = async (
    transaction: Prisma.TransactionClient,
    userIds: number[],
    title: string,
    content: string
) => {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return;

    await transaction.notification.createMany({
        data: ids.map((userId) => ({
            user_id: userId,
            title,
            content,
            type: "MAINTENANCE"
        }))
    });
};
```

Thêm hai command:

```ts
export const markMaintenanceUnableService = async (
    id: number,
    input: UnableMaintenanceRequest["body"],
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    const {
        current,
        assignment
    } = await getAssignedProcessingRequest(
        transaction,
        id,
        actor
    );
    let updated;
    try {
        updated = await transaction.maintenanceRequest.update({
            where: {
                id,
                assigned_staff_id: actor.staffId,
                status: RequestStatus.PROCESSING,
                apartment: {
                    building_id: assignment.buildingId,
                    building: assignment.assignmentWhere
                }
            },
            data: {
                status: RequestStatus.NEEDS_RESCHEDULE,
                unable_reason: input.reason
            },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Maintenance request status changed");
        }
        throw error;
    }
    const managers = await transaction.user.findMany({
        where: {
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
            staff: {
                building_id: current.apartment.building_id
            }
        },
        select: { id: true }
    });
    const recipientIds = managers.map(({ id: userId }) => userId);

    if (current.tenant.user_id !== null) {
        recipientIds.push(current.tenant.user_id);
    }

    await createMaintenanceNotifications(
        transaction,
        recipientIds,
        "Chưa thể thực hiện sửa chữa",
        `${current.title}: ${input.reason}`
    );

    return updated;
});

export const completeMaintenanceRequestService = async (
    id: number,
    actor: Actor
) => prisma.$transaction(async (transaction) => {
    const {
        current,
        assignment
    } = await getAssignedProcessingRequest(
        transaction,
        id,
        actor
    );
    let updated;
    try {
        updated = await transaction.maintenanceRequest.update({
            where: {
                id,
                assigned_staff_id: actor.staffId,
                status: RequestStatus.PROCESSING,
                apartment: {
                    building_id: assignment.buildingId,
                    building: assignment.assignmentWhere
                }
            },
            data: { status: RequestStatus.DONE },
            include: maintenanceInclude
        });
    } catch (error) {
        if (isRecordNotFound(error)) {
            throw conflict("Maintenance request status changed");
        }
        throw error;
    }

    await createMaintenanceNotifications(
        transaction,
        current.tenant.user_id === null
            ? []
            : [current.tenant.user_id],
        "Yêu cầu sửa chữa đã hoàn tất",
        `${current.title} tại phòng `
        + `${current.apartment.room_number} đã được sửa xong`
    );

    return updated;
});
```

- [ ] **Step 5: Nối controller và PUT routes**

Controller:

Đổi type import trong service thành:

```ts
import type {
    ConfirmMaintenanceRequest,
    CreateMaintenanceRequest,
    ListMaintenanceRequest,
    UnableMaintenanceRequest
} from "../schemas/maintenance.schema.js";
```

Đổi type import trong controller thành:

```ts
import type {
    ConfirmMaintenanceRequest,
    CreateMaintenanceRequest,
    ListMaintenanceRequest,
    MaintenanceIdRequest,
    UnableMaintenanceRequest
} from "../schemas/maintenance.schema.js";
```

```ts
export const unable = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        body
    } = getValidated<UnableMaintenanceRequest>(request);
    const result =
        await maintenanceService.markMaintenanceUnableService(
            params.id,
            body,
            request.actor!
        );

    return sendSuccess(response, result);
};

export const complete = async (
    request: Request,
    response: Response
) => {
    const { params } =
        getValidated<MaintenanceIdRequest>(request);
    const result =
        await maintenanceService.completeMaintenanceRequestService(
            params.id,
            request.actor!
        );

    return sendSuccess(response, result);
};
```

Routes:

Đổi schema import trong route thành:

```ts
import {
    cancelMaintenanceRequestSchema,
    completeMaintenanceRequestSchema,
    confirmMaintenanceRequestSchema,
    createMaintenanceRequestSchema,
    listMaintenanceRequestSchema,
    maintenanceIdRequestSchema,
    unableMaintenanceRequestSchema
} from "../schemas/maintenance.schema.js";
```

```ts
router.put(
    "/:id/unable",
    authenticate,
    authorizeRole([Role.STAFF]),
    validate(unableMaintenanceRequestSchema),
    maintenanceController.unable
);
router.put(
    "/:id/complete",
    authenticate,
    authorizeRole([Role.STAFF]),
    validate(completeMaintenanceRequestSchema),
    maintenanceController.complete
);
```

- [ ] **Step 6: Chạy test và type-check**

Run:

```powershell
cd backend
npx vitest run tests/maintenance.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- backend/src/schemas/maintenance.schema.ts backend/src/services/maintenance.service.ts backend/src/controllers/maintenance.controller.ts backend/src/routes/maintenance.routes.ts backend/tests/maintenance.test.ts
git commit -m "feat: record maintenance outcomes"
```

### Task 6: Xác minh toàn backend

**Files:**
- Verify only.

- [ ] **Step 1: Chạy test tập trung**

```powershell
cd backend
npx vitest run tests/database-migration.test.ts tests/maintenance.test.ts
```

Expected: PASS.

- [ ] **Step 2: Chạy toàn bộ test**

```powershell
cd backend
npm test
```

Expected: toàn bộ test PASS.

- [ ] **Step 3: Type-check không sinh file build**

```powershell
cd backend
npx tsc --noEmit
```

Expected: không có TypeScript error.

- [ ] **Step 4: Kiểm tra diff và phạm vi**

```powershell
git diff --check
git status --short
```

Expected: không có whitespace error; không có file frontend bị thay đổi; thư mục `backend/api/` chưa được stage.
