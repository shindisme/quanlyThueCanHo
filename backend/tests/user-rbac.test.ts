import {
    Role,
    UserStatus
} from "@prisma/client";
import request from "supertest";
import {
    describe,
    expect,
    it
} from "vitest";
import authRouter from "../src/routes/auth.route.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import { prismaMock } from "./setup.js";

const MANAGER_ID = 101;
const ADMIN_ID = 102;
const TARGET_ID = 202;
const BUILDING_ID = 301;

const authenticationRecord = (
    overrides: {
        id?: number;
        role?: Role;
        status?: UserStatus;
        staff?: { id: number; building_id: number | null } | null;
        tenant?: { id: number } | null;
    } = {}
) => ({
    id: MANAGER_ID,
    role: Role.MANAGER,
    status: UserStatus.ACTIVE,
    staff: {
        id: 201,
        building_id: BUILDING_ID
    },
    tenant: null,
    ...overrides
});

const managerScope = {
    OR: [
        {
            staff: {
                is: {
                    building_id: BUILDING_ID
                }
            }
        },
        {
            tenant: {
                is: {
                    onboarding_building_id: BUILDING_ID
                }
            }
        },
        {
            tenant: {
                is: {
                    contracts: {
                        some: {
                            apartment: {
                                building_id: BUILDING_ID
                            }
                        }
                    }
                }
            }
        }
    ]
};

const scopedTargetLookup = {
    where: {
        id: TARGET_ID,
        role: {
            not: Role.ADMIN
        },
        ...managerScope
    },
    select: { id: true }
};

const userSummarySelect = {
    id: true,
    username: true,
    role: true,
    status: true,
    created_at: true,
    staff: {
        select: {
            building: {
                select: {
                    id: true,
                    branch_name: true,
                    address_new: true
                }
            }
        }
    }
};

const authenticateAsManager = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(
        authenticationRecord() as never
    );
};

const authenticateAsAdmin = () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(
        authenticationRecord({
            id: ADMIN_ID,
            role: Role.ADMIN,
            staff: null
        }) as never
    );
};

const app = () => createTestApp(authRouter, "/auth");

describe("user-management RBAC", () => {
    it("rejects Manager creation of an Admin before Prisma create", async () => {
        authenticateAsManager();

        const response = await request(app())
            .post("/auth/create-user")
            .set("Authorization", createBearerToken(MANAGER_ID))
            .send({
                username: "new-admin",
                role: Role.ADMIN
            });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("rejects Manager assignment of Admin before reading or updating the target", async () => {
        authenticateAsManager();

        const response = await request(app())
            .put(`/auth/users/${TARGET_ID}`)
            .set("Authorization", createBearerToken(MANAGER_ID))
            .send({ role: Role.ADMIN });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it.each([
        ["update", "put", `/auth/users/${TARGET_ID}`, { username: "target" }],
        ["delete", "delete", `/auth/delete-user/${TARGET_ID}`, undefined],
        ["reset password", "post", `/auth/reset-password/${TARGET_ID}`, undefined]
    ] as const)(
        "returns 403 when a Manager tries to %s an Admin target",
        async (_operation, method, path, body) => {
            prismaMock.user.findUnique
                .mockResolvedValueOnce(authenticationRecord() as never)
                .mockResolvedValueOnce({
                    id: TARGET_ID,
                    role: Role.ADMIN
                } as never);

            let pending = request(app())[method](path)
                .set("Authorization", createBearerToken(MANAGER_ID));

            if (body) {
                pending = pending.send(body);
            }

            const response = await pending;

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
            expect(prismaMock.user.findUnique).toHaveBeenNthCalledWith(
                2,
                {
                    where: { id: TARGET_ID },
                    select: {
                        id: true,
                        role: true
                    }
                }
            );
            expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
            expect(prismaMock.user.update).not.toHaveBeenCalled();
            expect(prismaMock.user.delete).not.toHaveBeenCalled();
        }
    );

    it("requires a current building assignment for Manager user management", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(
            authenticationRecord({
                staff: {
                    id: 201,
                    building_id: null
                }
            }) as never
        );

        const response = await request(app())
            .get("/auth/users")
            .set("Authorization", createBearerToken(MANAGER_ID));

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it("lists exactly non-Admin staff and tenant users in the Manager building", async () => {
        const createdAt = new Date("2026-06-01T00:00:00.000Z");
        authenticateAsManager();
        prismaMock.user.findMany.mockResolvedValueOnce([
            {
                id: TARGET_ID,
                username: "building-user",
                role: Role.STAFF,
                status: UserStatus.ACTIVE,
                created_at: createdAt,
                staff: {
                    building: {
                        id: BUILDING_ID,
                        branch_name: "Central",
                        address_new: "123 Main Street"
                    }
                }
            },
            {
                id: TARGET_ID + 1,
                username: "tenant-user",
                role: Role.TENANT,
                status: UserStatus.ACTIVE,
                created_at: createdAt,
                staff: null
            }
        ] as never);

        const response = await request(app())
            .get("/auth/users")
            .set("Authorization", createBearerToken(MANAGER_ID));

        expect(response.status).toBe(200);
        expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            where: {
                role: {
                    not: Role.ADMIN
                },
                ...managerScope
            },
            select: userSummarySelect
        });
        expect(response.body.data).toEqual([
            {
                id: TARGET_ID,
                username: "building-user",
                role: Role.STAFF,
                status: UserStatus.ACTIVE,
                created_at: createdAt.toISOString(),
                managed_building: {
                    id: BUILDING_ID,
                    branch_name: "Central",
                    address_new: "123 Main Street"
                }
            },
            {
                id: TARGET_ID + 1,
                username: "tenant-user",
                role: Role.TENANT,
                status: UserStatus.ACTIVE,
                created_at: createdAt.toISOString(),
                managed_building: null
            }
        ]);
    });

    it.each([
        ["update", "put", `/auth/users/${TARGET_ID}`, { username: "target" }],
        ["delete", "delete", `/auth/delete-user/${TARGET_ID}`, undefined],
        ["reset password", "post", `/auth/reset-password/${TARGET_ID}`, undefined]
    ] as const)(
        "conceals an out-of-building target with 404 and no %s write",
        async (_operation, method, path, body) => {
            prismaMock.user.findUnique
                .mockResolvedValueOnce(authenticationRecord() as never)
                .mockResolvedValueOnce({
                    id: TARGET_ID,
                    role: Role.STAFF
                } as never);
            prismaMock.user.findFirst.mockResolvedValueOnce(null);

            let pending = request(app())[method](path)
                .set("Authorization", createBearerToken(MANAGER_ID));

            if (body) {
                pending = pending.send(body);
            }

            const response = await pending;

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("NOT_FOUND");
            expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
                where: {
                    id: TARGET_ID,
                    role: {
                        not: Role.ADMIN
                    },
                    ...managerScope
                },
                select: { id: true }
            });
            expect(prismaMock.user.update).not.toHaveBeenCalled();
            expect(prismaMock.user.delete).not.toHaveBeenCalled();
        }
    );

    it("allows a Manager to delete an in-building staff user", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce({
                id: TARGET_ID,
                role: Role.STAFF
            } as never);
        prismaMock.user.findFirst.mockResolvedValueOnce({
            id: TARGET_ID
        } as never);
        prismaMock.user.delete.mockResolvedValueOnce({
            id: TARGET_ID
        } as never);

        const response = await request(app())
            .delete(`/auth/delete-user/${TARGET_ID}`)
            .set("Authorization", createBearerToken(MANAGER_ID));

        expect(response.status).toBe(200);
        expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
            scopedTargetLookup
        );
        expect(
            prismaMock.user.findFirst.mock.calls[0][0].where?.OR
        ).toContainEqual(managerScope.OR[0]);
        expect(prismaMock.user.delete).toHaveBeenCalledWith({
            where: { id: TARGET_ID }
        });
    });

    it("allows a Manager to update an onboarding tenant in the building", async () => {
        const createdAt = new Date("2026-06-01T00:00:00.000Z");
        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce({
                id: TARGET_ID,
                role: Role.TENANT
            } as never);
        prismaMock.user.findFirst.mockResolvedValueOnce({
            id: TARGET_ID
        } as never);
        prismaMock.user.update.mockResolvedValueOnce({
            id: TARGET_ID,
            username: "tenant-user",
            role: Role.TENANT,
            status: UserStatus.BANNED,
            created_at: createdAt
        } as never);

        const response = await request(app())
            .put(`/auth/users/${TARGET_ID}`)
            .set("Authorization", createBearerToken(MANAGER_ID))
            .send({ status: UserStatus.BANNED });

        expect(response.status).toBe(200);
        expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
            scopedTargetLookup
        );
        expect(
            prismaMock.user.findFirst.mock.calls[0][0].where?.OR
        ).toContainEqual(managerScope.OR[1]);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: TARGET_ID },
            data: { status: UserStatus.BANNED },
            select: {
                id: true,
                username: true,
                role: true,
                status: true,
                created_at: true
            }
        });
    });

    it("allows a Manager to reset an in-building contracted tenant password", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce({
                id: TARGET_ID,
                role: Role.TENANT
            } as never);
        prismaMock.user.findFirst.mockResolvedValueOnce({
            id: TARGET_ID
        } as never);
        prismaMock.user.update.mockResolvedValueOnce({
            id: TARGET_ID
        } as never);

        const response = await request(app())
            .post(`/auth/reset-password/${TARGET_ID}`)
            .set("Authorization", createBearerToken(MANAGER_ID));

        expect(response.status).toBe(200);
        expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
            scopedTargetLookup
        );
        expect(
            prismaMock.user.findFirst.mock.calls[0][0].where?.OR
        ).toContainEqual(managerScope.OR[2]);
        expect(prismaMock.user.update).toHaveBeenCalledOnce();
        expect(prismaMock.user.update.mock.calls[0][0]).toEqual({
            where: { id: TARGET_ID },
            data: {
                password_hash: expect.any(String)
            }
        });
    });

    it("validates user status before reading or updating a target", async () => {
        authenticateAsManager();

        const response = await request(app())
            .put(`/auth/users/${TARGET_ID}`)
            .set("Authorization", createBearerToken(MANAGER_ID))
            .send({ status: "SUSPENDED" });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("allows an Admin to create another Admin globally", async () => {
        authenticateAsAdmin();
        prismaMock.user.create.mockResolvedValueOnce({
            id: TARGET_ID
        } as never);

        const response = await request(app())
            .post("/auth/create-user")
            .set("Authorization", createBearerToken(ADMIN_ID))
            .send({
                username: "another-admin",
                role: Role.ADMIN
            });

        expect(response.status).toBe(201);
        expect(prismaMock.user.create).toHaveBeenCalledOnce();
    });

    it("allows an Admin to list users globally without a scope filter", async () => {
        authenticateAsAdmin();
        prismaMock.user.findMany.mockResolvedValueOnce([]);

        const response = await request(app())
            .get("/auth/users")
            .set("Authorization", createBearerToken(ADMIN_ID));

        expect(response.status).toBe(200);
        expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            select: userSummarySelect
        });
    });

    it.each([
        ["update", "put", `/auth/users/${TARGET_ID}`, { username: "global" }],
        ["delete", "delete", `/auth/delete-user/${TARGET_ID}`, undefined],
        ["reset password", "post", `/auth/reset-password/${TARGET_ID}`, undefined]
    ] as const)(
        "allows an Admin to %s a target globally after a fresh safe read",
        async (_operation, method, path, body) => {
            prismaMock.user.findUnique
                .mockResolvedValueOnce(authenticationRecord({
                    id: ADMIN_ID,
                    role: Role.ADMIN,
                    staff: null
                }) as never)
                .mockResolvedValueOnce({
                    id: TARGET_ID,
                    role: Role.ADMIN
                } as never);
            prismaMock.user.update.mockResolvedValueOnce({
                id: TARGET_ID,
                username: "global",
                role: Role.ADMIN,
                status: UserStatus.ACTIVE,
                created_at: new Date("2026-06-01T00:00:00.000Z")
            } as never);
            prismaMock.user.delete.mockResolvedValueOnce({
                id: TARGET_ID
            } as never);

            let pending = request(app())[method](path)
                .set("Authorization", createBearerToken(ADMIN_ID));

            if (body) {
                pending = pending.send(body);
            }

            const response = await pending;

            expect(response.status).toBe(200);
            expect(prismaMock.user.findUnique).toHaveBeenNthCalledWith(
                2,
                {
                    where: { id: TARGET_ID },
                    select: {
                        id: true,
                        role: true
                    }
                }
            );
            expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
        }
    );
});
