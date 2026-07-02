import {
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import bcrypt from "bcrypt";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import staffRouter from "../src/routes/staff.routes.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import { prismaMock } from "./setup.js";

const MANAGER_USER_ID = 101;
const ADMIN_USER_ID = 102;
const STAFF_USER_ID = 103;
const TENANT_USER_ID = 104;
const MANAGER_STAFF_ID = 201;
const STAFF_ID = 202;
const BUILDING_ID = 301;
const OTHER_BUILDING_ID = 302;

const assignmentWhere = {
    assigned_staff: {
        some: {
            id: MANAGER_STAFF_ID,
            user_id: MANAGER_USER_ID,
            user: {
                is: {
                    id: MANAGER_USER_ID,
                    role: Role.MANAGER,
                    status: UserStatus.ACTIVE
                }
            }
        }
    }
};

const safeLinkedUserWhere = {
    OR: [
        {
            user: {
                is: null
            }
        },
        {
            user: {
                is: {
                    role: {
                        not: Role.ADMIN
                    }
                }
            }
        }
    ]
};

const managerStaffWhere = {
    id: STAFF_ID,
    building_id: BUILDING_ID,
    building: assignmentWhere,
    ...safeLinkedUserWhere
};

const staffSelect = {
    id: true,
    user_id: true,
    building_id: true,
    full_name: true,
    phone: true,
    position: true,
    created_at: true,
    user: {
        select: {
            id: true,
            username: true,
            role: true,
            status: true,
            created_at: true
        }
    },
    building: {
        select: {
            id: true,
            branch_name: true,
            address_new: true
        }
    }
};

const createdAt = new Date("2026-06-01T00:00:00.000Z");
const validStaff = {
    full_name: "Nguyen Van Bao",
    phone: "0901234567",
    position: "Bảo vệ",
    building_id: OTHER_BUILDING_ID
};

const staffRecord = {
    id: STAFF_ID,
    user_id: STAFF_USER_ID,
    building_id: BUILDING_ID,
    full_name: validStaff.full_name,
    phone: validStaff.phone,
    position: validStaff.position,
    created_at: createdAt,
    user: {
        id: STAFF_USER_ID,
        username: "nhanvien1",
        role: Role.STAFF,
        status: UserStatus.ACTIVE,
        created_at: createdAt
    },
    building: {
        id: BUILDING_ID,
        branch_name: "Central",
        address_new: "123 Main Street"
    }
};

const authenticationRecord = (
    role: Role,
    buildingId: number | null = role === Role.MANAGER
        ? BUILDING_ID
        : null
) => ({
    id: role === Role.ADMIN
        ? ADMIN_USER_ID
        : role === Role.STAFF
            ? STAFF_USER_ID
            : role === Role.TENANT
                ? TENANT_USER_ID
                : MANAGER_USER_ID,
    role,
    status: UserStatus.ACTIVE,
    staff: role === Role.MANAGER
        ? {
            id: MANAGER_STAFF_ID,
            building_id: buildingId
        }
        : role === Role.STAFF
            ? {
                id: STAFF_ID,
                building_id: BUILDING_ID
            }
            : null,
    tenant: role === Role.TENANT
        ? { id: 401 }
        : null
});

const authenticateAs = (
    role: Role,
    buildingId?: number | null
) => {
    prismaMock.user.findUnique.mockResolvedValueOnce(
        authenticationRecord(
            role,
            buildingId === undefined
                ? role === Role.MANAGER
                    ? BUILDING_ID
                    : null
                : buildingId
        ) as never
    );
};

const authorizationFor = (role: Role) =>
    createBearerToken(
        role === Role.ADMIN
            ? ADMIN_USER_ID
            : role === Role.STAFF
                ? STAFF_USER_ID
                : role === Role.TENANT
                    ? TENANT_USER_ID
                    : MANAGER_USER_ID
    );

const prismaKnownError = (
    code: string,
    meta?: Record<string, unknown>
) => new Prisma.PrismaClientKnownRequestError(
    "Prisma operation failed",
    {
        code,
        clientVersion: "6.15.0",
        meta
    }
);

const app = () => createTestApp(staffRouter, "/staff");

beforeEach(() => {
    prismaMock.user.findMany.mockResolvedValue([] as never);
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

describe("staff authentication and validation", () => {
    it("authenticates every staff route before validation or Prisma access", async () => {
        const cases = [
            request(app()).get("/staff"),
            request(app()).get(`/staff/${STAFF_ID}`),
            request(app()).post("/staff").send(validStaff),
            request(app()).put(`/staff/${STAFF_ID}`).send({
                full_name: "Changed"
            }),
            request(app()).delete(`/staff/${STAFF_ID}`)
        ];

        for (const pending of cases) {
            const response = await pending;
            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe(
                "AUTHENTICATION_REQUIRED"
            );
        }

        expect(prismaMock.staff.findMany).not.toHaveBeenCalled();
        expect(prismaMock.staff.create).not.toHaveBeenCalled();
        expect(prismaMock.staff.update).not.toHaveBeenCalled();
        expect(prismaMock.staff.delete).not.toHaveBeenCalled();
    });

    it.each([Role.STAFF, Role.TENANT])(
        "rejects the %s role on staff routes",
        async (role) => {
            authenticateAs(role);

            const response = await request(app())
                .get("/staff")
                .set("Authorization", authorizationFor(role));

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
            expect(prismaMock.staff.findMany).not.toHaveBeenCalled();
        }
    );

    it("rejects client user_id and unknown create fields through strict Zod", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                ...validStaff,
                user_id: 999,
                privileged: true
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it.each([
        [{}, "empty update"],
        [{ position: "Giám đốc" }, "invalid position"],
        [{ full_name: "" }, "empty name"],
        [{ phone: "abc" }, "invalid phone"]
    ])("rejects %s input", async (body) => {
        authenticateAs(Role.ADMIN);

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.staff.update).not.toHaveBeenCalled();
    });

    it.each([
        ["/staff?page=0", "invalid page"],
        ["/staff?limit=101", "invalid limit"],
        ["/staff?unknown=true", "unknown query"]
    ])("rejects %s", async (path) => {
        authenticateAs(Role.ADMIN);

        const response = await request(app())
            .get(path)
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.staff.findMany).not.toHaveBeenCalled();
    });
});

describe("staff account creation", () => {
    it("requires a Manager current assignment before provisioning", async () => {
        authenticateAs(Role.MANAGER, null);

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validStaff);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("creates linked User and Staff atomically and forces a live Manager building connect", async () => {
        authenticateAs(Role.MANAGER);
        let transactionActive = false;
        let createdPasswordHash = "";
        prismaMock.$transaction.mockImplementationOnce(
            async (operation) => {
                transactionActive = true;
                try {
                    return await (
                        operation as (
                            client: typeof prismaMock
                        ) => Promise<unknown>
                    )(prismaMock);
                } finally {
                    transactionActive = false;
                }
            }
        );
        prismaMock.user.create.mockImplementationOnce(async (args) => {
            expect(transactionActive).toBe(true);
            expect(args.data.username).toBe("nhanvien1");
            expect(args.data.role).toBe(Role.STAFF);
            expect(args.data.status).toBe(UserStatus.ACTIVE);
            createdPasswordHash =
                args.data.password_hash as string;

            return staffRecord.user as never;
        });
        prismaMock.staff.create.mockImplementationOnce(async (args) => {
            expect(transactionActive).toBe(true);
            expect(args.data).toEqual({
                full_name: validStaff.full_name,
                phone: validStaff.phone,
                position: validStaff.position,
                user: {
                    connect: { id: STAFF_USER_ID }
                },
                building: {
                    connect: {
                        id: BUILDING_ID,
                        ...assignmentWhere
                    }
                }
            });
            expect(args.data).not.toHaveProperty("building_id");
            expect(args.select).toEqual(staffSelect);
            return staffRecord as never;
        });

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validStaff);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.username).toBe("nhanvien1");
        expect(response.body.data.user).not.toHaveProperty(
            "password_hash"
        );
        const initialPassword =
            response.body.data.initial_password;

        expect(initialPassword).toEqual(expect.any(String));
        expect(initialPassword.length).toBeGreaterThanOrEqual(32);
        expect(initialPassword).not.toBe("123456");
        expect(
            await bcrypt.compare(
                initialPassword,
                createdPasswordHash
            )
        ).toBe(true);
        expect(JSON.stringify(response.body).match(
            /initial_password/g
        )).toHaveLength(1);
        expect(response.body.data).not.toHaveProperty(
            "temporary_password"
        );
        expect(response.body.data).not.toHaveProperty("password_hash");
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it("keeps account and staff inserts in one rollback boundary", async () => {
        authenticateAs(Role.MANAGER);
        let transactionActive = false;
        prismaMock.$transaction.mockImplementationOnce(
            async (operation) => {
                transactionActive = true;
                try {
                    return await (
                        operation as (
                            client: typeof prismaMock
                        ) => Promise<unknown>
                    )(prismaMock);
                } finally {
                    transactionActive = false;
                }
            }
        );
        prismaMock.user.create.mockImplementationOnce(async () => {
            expect(transactionActive).toBe(true);
            return staffRecord.user as never;
        });
        prismaMock.staff.create.mockImplementationOnce(async () => {
            expect(transactionActive).toBe(true);
            throw new Error("staff insert failed");
        });

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validStaff);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
        expect(prismaMock.user.create).toHaveBeenCalledOnce();
        expect(prismaMock.staff.create).toHaveBeenCalledOnce();
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it.each([
        ["Quản lý", Role.MANAGER, "quanly", "quanly5"],
        ["Kỹ thuật", Role.STAFF, "nhanvien", "nhanvien5"]
    ] as const)(
        "maps %s to %s and sequences the %s username",
        async (position, expectedRole, prefix, expectedUsername) => {
            authenticateAs(Role.ADMIN);
            prismaMock.user.findMany.mockResolvedValueOnce([
                { username: `${prefix}1` },
                { username: `${prefix}4` },
                { username: `${prefix}invalid` }
            ] as never);
            prismaMock.user.create.mockImplementationOnce(async (args) => {
                expect(args.data.username).toBe(expectedUsername);
                expect(args.data.role).toBe(expectedRole);
                return {
                    ...staffRecord.user,
                    username: expectedUsername,
                    role: expectedRole
                } as never;
            });
            prismaMock.staff.create.mockResolvedValueOnce({
                ...staffRecord,
                position
            } as never);

            const response = await request(app())
                .post("/staff")
                .set("Authorization", authorizationFor(Role.ADMIN))
                .send({
                    ...validStaff,
                    position
                });

            expect(response.status).toBe(201);
            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                where: {
                    username: {
                        startsWith: prefix
                    }
                },
                select: { username: true }
            });
        }
    );

    it("retries the whole transaction for a username-only P2002 race", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.findMany
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ username: "nhanvien1" }] as never);
        prismaMock.user.create
            .mockRejectedValueOnce(prismaKnownError("P2002", {
                target: ["username"]
            }))
            .mockResolvedValueOnce({
                ...staffRecord.user,
                username: "nhanvien2"
            } as never);
        prismaMock.staff.create.mockResolvedValueOnce(staffRecord as never);

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validStaff);

        expect(response.status).toBe(201);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
        expect(prismaMock.staff.create).toHaveBeenCalledOnce();
        expect(
            prismaMock.user.create.mock.calls[1][0].data.username
        ).toBe("nhanvien2");
    });

    it("stops after three username P2002 conflicts and returns the standard conflict", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.create.mockRejectedValue(
            prismaKnownError("P2002", {
                target: ["username"]
            })
        );

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validStaff);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "UNIQUE_CONFLICT",
                message:
                    "A record with the same unique value already exists"
            }
        });
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
        expect(prismaMock.user.create).toHaveBeenCalledTimes(3);
        expect(prismaMock.staff.create).not.toHaveBeenCalled();
    });

    it("does not retry a non-username unique conflict", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.create.mockResolvedValueOnce(
            staffRecord.user as never
        );
        prismaMock.staff.create.mockRejectedValueOnce(
            prismaKnownError("P2002", { target: ["phone"] })
        );

        const response = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validStaff);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe("UNIQUE_CONFLICT");
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it("lets Admin use the supplied building and omit an assignment", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.user.create.mockResolvedValue(
            staffRecord.user as never
        );
        prismaMock.staff.create.mockResolvedValue(staffRecord as never);

        const assigned = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send(validStaff);

        expect(assigned.status).toBe(201);
        expect(prismaMock.staff.create).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                data: expect.objectContaining({
                    building: {
                        connect: { id: OTHER_BUILDING_ID }
                    }
                })
            })
        );

        authenticateAs(Role.ADMIN);
        const unassigned = await request(app())
            .post("/staff")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({
                full_name: validStaff.full_name,
                phone: null,
                position: validStaff.position
            });

        expect(unassigned.status).toBe(201);
        expect(
            prismaMock.staff.create.mock.calls[1][0].data
        ).not.toHaveProperty("building");
    });
});

describe("staff Manager scope and mutations", () => {
    it("lists only the live Manager building with standard pagination", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.findMany.mockResolvedValueOnce([
            staffRecord
        ] as never);
        prismaMock.staff.count.mockResolvedValueOnce(1);

        const response = await request(app())
            .get("/staff?page=2&limit=5&position=B%E1%BA%A3o%20v%E1%BB%87")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(prismaMock.staff.findMany).toHaveBeenCalledWith({
            where: {
                AND: [
                    {
                        building_id: BUILDING_ID,
                        building: assignmentWhere,
                        ...safeLinkedUserWhere
                    },
                    { position: "Bảo vệ" }
                ]
            },
            skip: 5,
            take: 5,
            orderBy: { created_at: "desc" },
            select: staffSelect
        });
        expect(response.body.meta.pagination).toEqual({
            page: 2,
            limit: 5,
            total: 1,
            totalPages: 1
        });
    });

    it("reads a Manager detail only through live assignment scope", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.findFirst.mockResolvedValueOnce(
            staffRecord as never
        );

        const response = await request(app())
            .get(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(prismaMock.staff.findFirst).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: staffSelect
        });
    });

    it("conceals an out-of-building Manager detail with 404", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.findFirst.mockResolvedValueOnce(null);

        const response = await request(app())
            .get(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
    });

    it("preserves user RBAC by concealing an Admin-linked staff profile", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.findFirst.mockResolvedValueOnce(null);

        const response = await request(app())
            .get(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(404);
        expect(prismaMock.staff.findFirst).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: staffSelect
        });
    });

    it("rejects a Manager transfer attempt before a write", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ building_id: OTHER_BUILDING_ID });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
        expect(prismaMock.staff.updateMany).not.toHaveBeenCalled();
    });

    it("returns 404 if live assignment is lost at the final Manager update", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.updateMany.mockResolvedValueOnce({ count: 0 });

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ full_name: "Changed" });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.staff.updateMany).toHaveBeenCalledWith({
            where: managerStaffWhere,
            data: { full_name: "Changed" }
        });
        expect(prismaMock.staff.update).not.toHaveBeenCalled();
    });

    it("syncs a linked User role with a position update in the same transaction", async () => {
        authenticateAs(Role.MANAGER);
        let transactionActive = false;
        prismaMock.$transaction.mockImplementationOnce(
            async (operation) => {
                transactionActive = true;
                try {
                    return await (
                        operation as (
                            client: typeof prismaMock
                        ) => Promise<unknown>
                    )(prismaMock);
                } finally {
                    transactionActive = false;
                }
            }
        );
        prismaMock.staff.updateMany.mockImplementationOnce(async () => {
            expect(transactionActive).toBe(true);
            return { count: 1 };
        });
        prismaMock.staff.findFirst.mockResolvedValueOnce({
            ...staffRecord,
            position: "Quản lý"
        } as never);
        prismaMock.user.update.mockImplementationOnce(async (args) => {
            expect(transactionActive).toBe(true);
            expect(args).toEqual({
                where: {
                    id: STAFF_USER_ID,
                    role: {
                        not: Role.ADMIN
                    }
                },
                data: { role: Role.MANAGER },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    status: true,
                    created_at: true
                }
            });
            return {
                ...staffRecord.user,
                role: Role.MANAGER
            } as never;
        });

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ position: "Quản lý" });

        expect(response.status).toBe(200);
        expect(response.body.data.user.role).toBe(Role.MANAGER);
        expect(response.body.data.user).not.toHaveProperty(
            "password_hash"
        );
        expect(prismaMock.staff.findFirst).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: staffSelect
        });
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it("updates a staff record with no linked user without attempting role sync", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.updateMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.staff.findFirst.mockResolvedValueOnce({
            ...staffRecord,
            user_id: null,
            user: null,
            position: "Kế toán"
        } as never);

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ position: "Kế toán" });

        expect(response.status).toBe(200);
        expect(response.body.data.user).toBeNull();
        expect(prismaMock.staff.updateMany).toHaveBeenCalledWith({
            where: managerStaffWhere,
            data: { position: "Kế toán" }
        });
        expect(prismaMock.staff.findFirst).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: staffSelect
        });
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("uses a scoped post-read for a non-position Manager update", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.updateMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.staff.findFirst.mockResolvedValueOnce({
            ...staffRecord,
            full_name: "Changed"
        } as never);

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ full_name: "Changed" });

        expect(response.status).toBe(200);
        expect(prismaMock.staff.findFirst).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: staffSelect
        });
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("rolls back with 404 when the scoped post-read loses Manager access", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.updateMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.staff.findFirst.mockResolvedValueOnce(null);

        const response = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ position: "Quản lý" });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.staff.findFirst).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: staffSelect
        });
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("returns 404 if live assignment is lost at the final Manager delete", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.staff.delete.mockRejectedValueOnce(
            prismaKnownError("P2025")
        );

        const response = await request(app())
            .delete(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.staff.delete).toHaveBeenCalledWith({
            where: managerStaffWhere,
            select: { user_id: true }
        });
        expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it("deletes Staff and linked User atomically", async () => {
        authenticateAs(Role.MANAGER);
        let transactionActive = false;
        prismaMock.$transaction.mockImplementationOnce(
            async (operation) => {
                transactionActive = true;
                try {
                    return await (
                        operation as (
                            client: typeof prismaMock
                        ) => Promise<unknown>
                    )(prismaMock);
                } finally {
                    transactionActive = false;
                }
            }
        );
        prismaMock.staff.delete.mockImplementationOnce(async () => {
            expect(transactionActive).toBe(true);
            return { user_id: STAFF_USER_ID } as never;
        });
        prismaMock.user.delete.mockImplementationOnce(async () => {
            expect(transactionActive).toBe(true);
            return staffRecord.user as never;
        });

        const response = await request(app())
            .delete(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: { deleted: true }
        });
        expect(prismaMock.user.delete).toHaveBeenCalledWith({
            where: {
                id: STAFF_USER_ID,
                role: {
                    not: Role.ADMIN
                }
            }
        });
    });

    it.each([
        ["P2003", 409, "RELATION_CONFLICT"],
        ["P2025", 404, "NOT_FOUND"]
    ] as const)(
        "rolls back linked deletion when the guarded User delete fails with %s",
        async (code, expectedStatus, expectedErrorCode) => {
            authenticateAs(Role.MANAGER);
            let transactionActive = false;
            prismaMock.$transaction.mockImplementationOnce(
                async (operation) => {
                    transactionActive = true;
                    try {
                        return await (
                            operation as (
                                client: typeof prismaMock
                            ) => Promise<unknown>
                        )(prismaMock);
                    } finally {
                        transactionActive = false;
                    }
                }
            );
            prismaMock.staff.delete.mockImplementationOnce(async () => {
                expect(transactionActive).toBe(true);
                return { user_id: STAFF_USER_ID } as never;
            });
            prismaMock.user.delete.mockImplementationOnce(async () => {
                expect(transactionActive).toBe(true);
                throw prismaKnownError(code);
            });

            const response = await request(app())
                .delete(`/staff/${STAFF_ID}`)
                .set("Authorization", authorizationFor(Role.MANAGER));

            expect(response.status).toBe(expectedStatus);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe(expectedErrorCode);
            expect(transactionActive).toBe(false);
            expect(prismaMock.$transaction).toHaveBeenCalledOnce();
            expect(prismaMock.staff.delete).toHaveBeenCalledOnce();
            expect(prismaMock.user.delete).toHaveBeenCalledOnce();
        }
    );

    it("lets Admin list, detail, update, transfer, and delete globally", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.staff.findMany.mockResolvedValueOnce([]);
        prismaMock.staff.count.mockResolvedValueOnce(0);

        const list = await request(app())
            .get("/staff")
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(list.status).toBe(200);
        expect(prismaMock.staff.findMany).toHaveBeenCalledWith({
            where: {},
            skip: 0,
            take: 10,
            orderBy: { created_at: "desc" },
            select: staffSelect
        });

        authenticateAs(Role.ADMIN);
        prismaMock.staff.findUnique.mockResolvedValueOnce(
            staffRecord as never
        );
        const detail = await request(app())
            .get(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN));
        expect(detail.status).toBe(200);
        expect(prismaMock.staff.findUnique).toHaveBeenCalledWith({
            where: { id: STAFF_ID },
            select: staffSelect
        });

        authenticateAs(Role.ADMIN);
        prismaMock.staff.update.mockResolvedValueOnce({
            ...staffRecord,
            building_id: OTHER_BUILDING_ID
        } as never);
        const update = await request(app())
            .put(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({ building_id: OTHER_BUILDING_ID });
        expect(update.status).toBe(200);
        expect(prismaMock.staff.update).toHaveBeenCalledWith({
            where: { id: STAFF_ID },
            data: {
                building: {
                    connect: { id: OTHER_BUILDING_ID }
                }
            },
            select: staffSelect
        });

        authenticateAs(Role.ADMIN);
        prismaMock.staff.delete.mockResolvedValueOnce({
            user_id: null
        } as never);
        const remove = await request(app())
            .delete(`/staff/${STAFF_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN));
        expect(remove.status).toBe(200);
        expect(prismaMock.staff.delete).toHaveBeenCalledWith({
            where: { id: STAFF_ID },
            select: { user_id: true }
        });
    });
});
