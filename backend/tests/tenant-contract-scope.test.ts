import {
    ApartmentStatus,
    ContractStatus,
    Prisma,
    Role,
    UserStatus
} from "@prisma/client";
import bcrypt from "bcrypt";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import contractRouter from "../src/routes/contract.routes.js";
import tenantRouter from "../src/routes/tenant.route.js";
import { extendContractRequestSchema } from "../src/schemas/contract.schema.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";
import { prismaMock } from "./setup.js";

const MANAGER_USER_ID = 101;
const ADMIN_USER_ID = 102;
const TENANT_USER_ID = 103;
const MANAGER_STAFF_ID = 201;
const BUILDING_ID = 301;
const OTHER_BUILDING_ID = 302;
const TENANT_ID = 401;
const APARTMENT_ID = 501;
const CONTRACT_ID = 601;
const contractServicePath = fileURLToPath(
    new URL("../src/services/contract.service.ts", import.meta.url)
);

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

const tenantManagerScope = {
    OR: [
        {
            onboarding_building_id: BUILDING_ID,
            onboarding_building: assignmentWhere
        },
        {
            contracts: {
                some: {
                    apartment: {
                        building_id: BUILDING_ID,
                        building: assignmentWhere
                    }
                }
            }
        }
    ]
};

const contractManagerScope = {
    apartment: {
        building_id: BUILDING_ID,
        building: assignmentWhere
    }
};

const validTenant = {
    full_name: "Nguyen Van An",
    phone: "0901234567",
    email: "an@example.com",
    date_of_birth: "1990-02-01",
    citizen_id: "001234123456",
    address: "12 Nguyen Hue"
};

const validContract = {
    apartment_id: APARTMENT_ID,
    tenant_id: TENANT_ID,
    start_date: "2030-01-01",
    end_date: "2031-01-01",
    deposit_amount: 10_000_000,
    monthly_rent: 8_000_000,
    signed_at: "2029-12-20"
};

const tenantRecord = {
    id: TENANT_ID,
    user_id: 701,
    onboarding_building_id: BUILDING_ID,
    full_name: validTenant.full_name,
    phone: validTenant.phone,
    email: validTenant.email,
    date_of_birth: new Date("1990-02-01T00:00:00.000Z"),
    citizen_id: validTenant.citizen_id,
    address: validTenant.address,
    is_verified: false,
    created_at: new Date("2026-06-01T00:00:00.000Z"),
    user: {
        id: 701,
        username: "YH123456",
        role: Role.TENANT,
        status: UserStatus.ACTIVE,
        created_at: new Date("2026-06-01T00:00:00.000Z")
    }
};

const contractRecord = {
    id: CONTRACT_ID,
    apartment_id: APARTMENT_ID,
    tenant_id: TENANT_ID,
    start_date: new Date("2030-01-01T00:00:00.000Z"),
    end_date: new Date("2031-01-01T00:00:00.000Z"),
    deposit_amount: 10_000_000,
    monthly_rent: 8_000_000,
    status: ContractStatus.ACTIVE,
    contract_file: null,
    signed_at: new Date("2029-12-20T00:00:00.000Z"),
    created_at: new Date("2029-12-20T00:00:00.000Z"),
    extended_at: null,
    tenant: {
        id: TENANT_ID,
        full_name: validTenant.full_name,
        phone: validTenant.phone,
        email: validTenant.email,
        citizen_id: validTenant.citizen_id,
        user_id: 701
    },
    apartment: {
        id: APARTMENT_ID,
        building_id: BUILDING_ID,
        description: null,
        area: 55,
        bedrooms: 2,
        bathrooms: 1,
        rental_price: 8_000_000,
        status: ApartmentStatus.RENTED,
        floor: 1,
        room_number: "A101",
        building: {
            id: BUILDING_ID,
            branch_name: "Central",
            address_old: "Old address",
            address_new: "New address",
            description: null,
            status: "ACTIVE",
            total_floors: 10,
            total_apartments: 20,
            thumbnail_url: null,
            created_at: new Date("2026-01-01T00:00:00.000Z")
        }
    }
};

const prismaNotFoundError = () =>
    new Prisma.PrismaClientKnownRequestError(
        "Scoped relation was not found",
        {
            code: "P2025",
            clientVersion: "6.15.0"
        }
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

const authenticationRecord = (
    role: Role,
    buildingId: number | null = role === Role.MANAGER
        ? BUILDING_ID
        : null
) => ({
    id: role === Role.ADMIN
        ? ADMIN_USER_ID
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
        : null,
    tenant: role === Role.TENANT
        ? { id: TENANT_ID }
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
            : role === Role.TENANT
                ? TENANT_USER_ID
                : MANAGER_USER_ID
    );

const tenantApp = () => createTestApp(tenantRouter, "/tenants");
const contractApp = () => createTestApp(contractRouter, "/contracts");

beforeEach(() => {
    vi.clearAllMocks();
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

describe("tenant onboarding account transaction", () => {
    it("protects every tenant route before validation or Prisma writes", async () => {
        const cases = [
            request(tenantApp()).get("/tenants"),
            request(tenantApp()).get(`/tenants/${TENANT_ID}`),
            request(tenantApp()).post("/tenants").send(validTenant),
            request(tenantApp()).put(`/tenants/${TENANT_ID}`).send({
                full_name: "Changed"
            }),
            request(tenantApp()).delete(`/tenants/${TENANT_ID}`)
        ];

        for (const pending of cases) {
            const response = await pending;
            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe(
                "AUTHENTICATION_REQUIRED"
            );
        }

        expect(prismaMock.tenant.create).not.toHaveBeenCalled();
        expect(prismaMock.tenant.update).not.toHaveBeenCalled();
        expect(prismaMock.tenant.delete).not.toHaveBeenCalled();
    });

    it("rejects a supplied user_id and unknown fields through strict Zod", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                ...validTenant,
                user_id: 999,
                privileged: true
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
        expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("requires a Manager's current assignment before provisioning", async () => {
        authenticateAs(Role.MANAGER, null);

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validTenant);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("creates an initial-password account and tenant inside one transaction with a live building connect", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.findMany.mockResolvedValueOnce([]);
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
            expect(args.select).toEqual({
                id: true,
                username: true,
                role: true,
                status: true,
                created_at: true
            });
            expect(args.data.username).toBe("YH123456");
            expect(args.data.role).toBe(Role.TENANT);
            expect(args.data.status).toBe(UserStatus.ACTIVE);
            createdPasswordHash =
                args.data.password_hash as string;

            return {
                id: 701,
                username: "YH123456",
                role: Role.TENANT,
                status: UserStatus.ACTIVE,
                created_at: tenantRecord.created_at
            } as never;
        });
        prismaMock.tenant.create.mockImplementationOnce(async (args) => {
            expect(transactionActive).toBe(true);
            expect(args.data).toEqual(expect.objectContaining({
                full_name: validTenant.full_name,
                citizen_id: validTenant.citizen_id,
                user: {
                    connect: { id: 701 }
                },
                onboarding_building: {
                    connect: {
                        id: BUILDING_ID,
                        ...assignmentWhere
                    }
                }
            }));
            expect(args.data).not.toHaveProperty(
                "onboarding_building_id"
            );
            return {
                ...tenantRecord,
                user: undefined
            } as never;
        });

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validTenant);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                id: TENANT_ID,
                user: expect.objectContaining({
                    username: "YH123456"
                })
            })
        }));
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
        expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            where: {
                username: {
                    startsWith: "YH123456"
                }
            },
            select: { username: true }
        });
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it("keeps both inserts in the rollback boundary when tenant creation fails", async () => {
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
            return tenantRecord.user as never;
        });
        prismaMock.tenant.create.mockImplementationOnce(async () => {
            expect(transactionActive).toBe(true);
            throw new Error("tenant insert failed");
        });

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validTenant);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
        expect(prismaMock.user.create).toHaveBeenCalledOnce();
        expect(prismaMock.tenant.create).toHaveBeenCalledOnce();
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it("lets Admin choose an onboarding building globally", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.user.create.mockResolvedValueOnce(
            tenantRecord.user as never
        );
        prismaMock.tenant.create.mockResolvedValueOnce({
            ...tenantRecord,
            onboarding_building_id: OTHER_BUILDING_ID
        } as never);

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({
                ...validTenant,
                onboarding_building_id: OTHER_BUILDING_ID
            });

        expect(response.status).toBe(201);
        expect(prismaMock.tenant.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    onboarding_building: {
                        connect: { id: OTHER_BUILDING_ID }
                    }
                })
            })
        );
    });

    it("forces Manager-created tenants to start unverified", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.create.mockResolvedValueOnce(
            tenantRecord.user as never
        );
        prismaMock.tenant.create.mockResolvedValueOnce(
            tenantRecord as never
        );

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                ...validTenant,
                is_verified: true
            });

        expect(response.status).toBe(201);
        expect(prismaMock.tenant.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    is_verified: false
                })
            })
        );
    });

    it("chooses the first available deterministic username suffix", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.findMany.mockResolvedValueOnce([
            { username: "YH123456" },
            { username: "YH123456_2" },
            { username: "YH123456_4" }
        ] as never);
        prismaMock.user.create.mockImplementationOnce(async (args) => {
            expect(args.data.username).toBe("YH123456_3");
            return {
                ...tenantRecord.user,
                username: "YH123456_3"
            } as never;
        });
        prismaMock.tenant.create.mockResolvedValueOnce(
            tenantRecord as never
        );

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validTenant);

        expect(response.status).toBe(201);
        expect(response.body.data.user.username).toBe("YH123456_3");
    });

    it("retries the whole transaction once for a username race", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.findMany
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                { username: "YH123456" }
            ] as never);
        const passwordHashes: string[] = [];
        prismaMock.user.create
            .mockImplementationOnce(async (args) => {
                passwordHashes.push(args.data.password_hash as string);
                throw prismaKnownError("P2002", {
                    target: ["username"]
                });
            })
            .mockImplementationOnce(async (args) => {
                passwordHashes.push(args.data.password_hash as string);
                expect(args.data.username).toBe("YH123456_2");
                return {
                    ...tenantRecord.user,
                    username: "YH123456_2"
                } as never;
            });
        prismaMock.tenant.create.mockResolvedValueOnce(
            tenantRecord as never
        );

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validTenant);

        expect(response.status).toBe(201);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
        expect(prismaMock.tenant.create).toHaveBeenCalledOnce();
        expect(passwordHashes).toHaveLength(2);
        expect(passwordHashes[0]).toBe(passwordHashes[1]);
    });

    it("does not retry a tenant unique conflict and returns a safe 409", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.user.findMany.mockResolvedValueOnce([]);
        prismaMock.user.create.mockResolvedValueOnce(
            tenantRecord.user as never
        );
        prismaMock.tenant.create.mockRejectedValueOnce(
            prismaKnownError("P2002", {
                target: ["citizen_id"]
            })
        );

        const response = await request(tenantApp())
            .post("/tenants")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validTenant);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe("UNIQUE_CONFLICT");
        expect(response.body.error.message).not.toContain("citizen_id");
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
        expect(prismaMock.user.create).toHaveBeenCalledOnce();
    });
});

describe("tenant Manager scope", () => {
    it("lists only onboarding or contracted tenants with live assignment and standard pagination", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.tenant.findMany.mockResolvedValueOnce([
            tenantRecord
        ] as never);
        prismaMock.tenant.count.mockResolvedValueOnce(1);

        const response = await request(tenantApp())
            .get("/tenants?page=2&limit=5&search=An")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [{
                ...tenantRecord,
                date_of_birth:
                    tenantRecord.date_of_birth.toISOString(),
                created_at: tenantRecord.created_at.toISOString(),
                user: {
                    ...tenantRecord.user,
                    created_at:
                        tenantRecord.user.created_at.toISOString()
                }
            }],
            meta: {
                pagination: {
                    page: 2,
                    limit: 5,
                    total: 1,
                    totalPages: 1
                }
            }
        });
        expect(prismaMock.tenant.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [
                        tenantManagerScope,
                        {
                            OR: expect.any(Array)
                        }
                    ]
                },
                skip: 5,
                take: 5
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it("uses the same onboarding-or-contract scope for detail and conceals outside scope", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.tenant.findFirst.mockResolvedValueOnce(
            tenantRecord as never
        );

        const visible = await request(tenantApp())
            .get(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(visible.status).toBe(200);
        expect(prismaMock.tenant.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: TENANT_ID,
                    ...tenantManagerScope
                }
            })
        );

        authenticateAs(Role.MANAGER);
        prismaMock.tenant.findFirst.mockResolvedValueOnce(null);

        const hidden = await request(tenantApp())
            .get(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(hidden.status).toBe(404);
        expect(hidden.body.error.code).toBe("NOT_FOUND");
    });

    it("guards Manager update and delete with live staff and user assignment", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.tenant.update.mockResolvedValueOnce({
            ...tenantRecord,
            full_name: "Changed"
        } as never);

        const updateResponse = await request(tenantApp())
            .put(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({
                full_name: "Changed",
                onboarding_building_id: OTHER_BUILDING_ID
            });

        expect(updateResponse.status).toBe(200);
        expect(prismaMock.tenant.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: TENANT_ID,
                    ...tenantManagerScope
                },
                data: { full_name: "Changed" }
            })
        );

        authenticateAs(Role.MANAGER);
        prismaMock.tenant.delete.mockResolvedValueOnce({
            ...tenantRecord,
            user_id: 701
        } as never);
        prismaMock.user.delete.mockResolvedValueOnce(
            tenantRecord.user as never
        );

        const deleteResponse = await request(tenantApp())
            .delete(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toEqual({
            success: true,
            data: { deleted: true }
        });
        expect(prismaMock.tenant.delete).toHaveBeenCalledWith({
            where: {
                id: TENANT_ID,
                ...tenantManagerScope
            },
            select: { user_id: true }
        });
        expect(prismaMock.user.delete).toHaveBeenCalledWith({
            where: { id: 701 }
        });
    });

    it("returns 404 when Manager loses assignment at the final tenant mutation", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.tenant.update.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(tenantApp())
            .put(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ full_name: "Changed" });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.tenant.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: TENANT_ID,
                    ...tenantManagerScope
                }
            })
        );
    });

    it("forbids Manager verification changes before mutation", async () => {
        authenticateAs(Role.MANAGER);

        const response = await request(tenantApp())
            .put(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ is_verified: true });

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
        expect(prismaMock.tenant.update).not.toHaveBeenCalled();
    });

    it("gives Admin global tenant detail and update", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.tenant.findUnique.mockResolvedValueOnce(
            tenantRecord as never
        );
        const detail = await request(tenantApp())
            .get(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN));
        expect(detail.status).toBe(200);
        expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: TENANT_ID } })
        );

        authenticateAs(Role.ADMIN);
        prismaMock.tenant.update.mockResolvedValueOnce(
            tenantRecord as never
        );
        const update = await request(tenantApp())
            .put(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send({
                onboarding_building_id: OTHER_BUILDING_ID,
                is_verified: true
            });
        expect(update.status).toBe(200);
        expect(prismaMock.tenant.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: TENANT_ID },
                data: {
                    onboarding_building: {
                        connect: { id: OTHER_BUILDING_ID }
                    },
                    is_verified: true
                }
            })
        );
    });

    it("gives Admin a global atomic tenant and account delete", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.tenant.delete.mockResolvedValueOnce({
            user_id: tenantRecord.user_id
        } as never);
        prismaMock.user.delete.mockResolvedValueOnce(
            tenantRecord.user as never
        );

        const response = await request(tenantApp())
            .delete(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.ADMIN));

        expect(response.status).toBe(200);
        expect(prismaMock.tenant.delete).toHaveBeenCalledWith({
            where: { id: TENANT_ID },
            select: { user_id: true }
        });
        expect(prismaMock.user.delete).toHaveBeenCalledWith({
            where: { id: tenantRecord.user_id }
        });
    });
});

describe("tenant self detail", () => {
    it("allows a Tenant to read only the profile linked to their user", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.tenant.findFirst.mockResolvedValueOnce(
            tenantRecord as never
        );

        const response = await request(tenantApp())
            .get(`/tenants/${TENANT_ID}`)
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(response.status).toBe(200);
        expect(prismaMock.tenant.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: TENANT_ID,
                    user_id: TENANT_USER_ID
                }
            })
        );
    });

    it("conceals another tenant profile and keeps management routes forbidden", async () => {
        authenticateAs(Role.TENANT);
        const other = await request(tenantApp())
            .get(`/tenants/${TENANT_ID + 1}`)
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(other.status).toBe(404);
        expect(other.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.tenant.findFirst).not.toHaveBeenCalled();

        authenticateAs(Role.TENANT);
        const list = await request(tenantApp())
            .get("/tenants")
            .set("Authorization", authorizationFor(Role.TENANT));

        expect(list.status).toBe(403);
        expect(list.body.error.code).toBe("FORBIDDEN");
    });
});

describe("contract creation transaction and scope", () => {
    it("creates all contract side effects in one transaction with final scoped relation connects", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID,
            building_id: BUILDING_ID,
            status: ApartmentStatus.AVAILABLE
        } as never);
        prismaMock.tenant.findFirst.mockResolvedValueOnce({
            id: TENANT_ID,
            onboarding_building_id: BUILDING_ID
        } as never);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(null);
        prismaMock.rentalContract.create.mockResolvedValueOnce({
            ...contractRecord,
            apartment: undefined,
            tenant: undefined,
            deposit_amount: new Prisma.Decimal("10000000.50"),
            monthly_rent: new Prisma.Decimal("8000000.25"),
            status: ContractStatus.ACTIVE
        } as never);
        prismaMock.apartment.update.mockResolvedValueOnce({
            id: APARTMENT_ID,
            status: ApartmentStatus.RENTED
        } as never);
        prismaMock.tenant.updateMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.invoice.create.mockResolvedValueOnce({ id: 801 } as never);

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validContract);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.deposit_amount).toBe(10_000_000.5);
        expect(response.body.data.monthly_rent).toBe(8_000_000.25);
        expect(response.body).not.toHaveProperty("message");
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
        expect(prismaMock.rentalContract.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                apartment: {
                    connect: expect.objectContaining({
                        id: APARTMENT_ID,
                        building_id: BUILDING_ID,
                        building: assignmentWhere,
                        status: ApartmentStatus.AVAILABLE,
                        contracts: {
                            none: { status: ContractStatus.ACTIVE }
                        }
                    })
                },
                tenant: {
                    connect: {
                        id: TENANT_ID,
                        ...tenantManagerScope
                    }
                },
                status: ContractStatus.ACTIVE
            })
        });
        expect(prismaMock.apartment.update).toHaveBeenCalledWith({
            where: {
                id: APARTMENT_ID,
                status: ApartmentStatus.AVAILABLE,
                building_id: BUILDING_ID,
                building: assignmentWhere
            },
            data: { status: ApartmentStatus.RENTED }
        });
        expect(prismaMock.tenant.updateMany).toHaveBeenCalledWith({
            where: {
                id: TENANT_ID,
                onboarding_building_id: BUILDING_ID,
                onboarding_building: assignmentWhere
            },
            data: { onboarding_building_id: null }
        });
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it.each([
        ["apartment", {
            apartment: null,
            tenant: {
                id: TENANT_ID,
                onboarding_building_id: BUILDING_ID
            }
        }],
        ["tenant", {
            apartment: {
                id: APARTMENT_ID,
                building_id: BUILDING_ID,
                status: ApartmentStatus.AVAILABLE
            },
            tenant: null
        }]
    ])("does not create for an out-of-scope %s", async (
        _resource,
        records
    ) => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce(
            records.apartment as never
        );
        prismaMock.tenant.findFirst.mockResolvedValueOnce(
            records.tenant as never
        );

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validContract);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.rentalContract.create).not.toHaveBeenCalled();
        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("rolls back as 404 when live scope changes at final contract relation creation", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID,
            building_id: BUILDING_ID,
            status: ApartmentStatus.AVAILABLE
        } as never);
        prismaMock.tenant.findFirst.mockResolvedValueOnce({
            id: TENANT_ID,
            onboarding_building_id: BUILDING_ID
        } as never);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(null);
        prismaMock.rentalContract.create.mockRejectedValueOnce(
            prismaNotFoundError()
        );

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validContract);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(prismaMock.apartment.update).not.toHaveBeenCalled();
        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("maps the authoritative active-contract index conflict to 409", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID,
            building_id: BUILDING_ID,
            status: ApartmentStatus.AVAILABLE
        } as never);
        prismaMock.tenant.findFirst.mockResolvedValueOnce({
            id: TENANT_ID,
            onboarding_building_id: BUILDING_ID
        } as never);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(null);
        prismaMock.rentalContract.create.mockRejectedValueOnce(
            prismaKnownError("P2002", {
                target: ["apartment_id"]
            })
        );

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validContract);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe(
            "ACTIVE_CONTRACT_EXISTS"
        );
        expect(prismaMock.apartment.update).not.toHaveBeenCalled();
        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("retries a serialization conflict in a Serializable transaction", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.$transaction.mockRejectedValueOnce(
            prismaKnownError("P2034")
        );
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID,
            building_id: BUILDING_ID,
            status: ApartmentStatus.AVAILABLE
        } as never);
        prismaMock.tenant.findFirst.mockResolvedValueOnce({
            id: TENANT_ID,
            onboarding_building_id: BUILDING_ID
        } as never);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(null);
        prismaMock.rentalContract.create.mockResolvedValueOnce({
            ...contractRecord,
            apartment: undefined,
            tenant: undefined
        } as never);
        prismaMock.apartment.update.mockResolvedValueOnce({} as never);
        prismaMock.invoice.create.mockResolvedValueOnce({} as never);
        prismaMock.tenant.updateMany.mockResolvedValueOnce({ count: 1 });

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validContract);

        expect(response.status).toBe(201);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
        expect(prismaMock.$transaction).toHaveBeenLastCalledWith(
            expect.any(Function),
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            }
        );
    });

    it("maps exhausted contract serialization retries to standard 409", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.$transaction
            .mockRejectedValueOnce(prismaKnownError("P2034"))
            .mockRejectedValueOnce(prismaKnownError("P2034"))
            .mockRejectedValueOnce(prismaKnownError("P2034"));

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send(validContract);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "CONCURRENT_MODIFICATION",
                message: "Contract changed during this operation"
            }
        });
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
    });

    it("does not clear onboarding when Admin contracts a tenant in a different building", async () => {
        authenticateAs(Role.ADMIN);
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            id: APARTMENT_ID,
            building_id: OTHER_BUILDING_ID,
            status: ApartmentStatus.AVAILABLE
        } as never);
        prismaMock.tenant.findFirst.mockResolvedValueOnce({
            id: TENANT_ID,
            onboarding_building_id: BUILDING_ID
        } as never);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(null);
        prismaMock.rentalContract.create.mockResolvedValueOnce({
            ...contractRecord,
            apartment_id: APARTMENT_ID
        } as never);
        prismaMock.apartment.update.mockResolvedValueOnce({} as never);
        prismaMock.invoice.create.mockResolvedValueOnce({} as never);

        const response = await request(contractApp())
            .post("/contracts")
            .set("Authorization", authorizationFor(Role.ADMIN))
            .send(validContract);

        expect(response.status).toBe(201);
        expect(prismaMock.tenant.updateMany).not.toHaveBeenCalled();
    });
});

describe("contract read and mutation scope", () => {
    it("requires a Manager assignment before evaluating a building filter", async () => {
        authenticateAs(Role.MANAGER, null);

        const response = await request(contractApp())
            .get(`/contracts?building_id=${BUILDING_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            "MANAGER_BUILDING_REQUIRED"
        );
        expect(
            prismaMock.rentalContract.findMany
        ).not.toHaveBeenCalled();
    });

    it("lists Manager contracts through actor scope without an extra actor lookup", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([
            contractRecord
        ] as never);
        prismaMock.rentalContract.count.mockResolvedValueOnce(1);

        const response = await request(contractApp())
            .get("/contracts?status=ACTIVE&page=1&limit=5")
            .set("Authorization", authorizationFor(Role.MANAGER));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.meta.pagination).toEqual({
            page: 1,
            limit: 5,
            total: 1,
            totalPages: 1
        });
        expect(prismaMock.rentalContract.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [
                        contractManagerScope,
                        { status: ContractStatus.ACTIVE }
                    ]
                }
            })
        );
        expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it("returns Manager detail only through live scope and conceals outside scope", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(
            contractRecord as never
        );

        const visible = await request(contractApp())
            .get(`/contracts/${CONTRACT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));
        expect(visible.status).toBe(200);
        expect(prismaMock.rentalContract.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: CONTRACT_ID,
                    ...contractManagerScope
                }
            })
        );

        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(null);
        const hidden = await request(contractApp())
            .get(`/contracts/${CONTRACT_ID}`)
            .set("Authorization", authorizationFor(Role.MANAGER));
        expect(hidden.status).toBe(404);
        expect(hidden.body.error.code).toBe("NOT_FOUND");
    });

    it("keeps tenant-specific contract list and detail authorized by actor tenantId", async () => {
        authenticateAs(Role.TENANT);
        prismaMock.rentalContract.findMany.mockResolvedValueOnce([] as never);
        prismaMock.rentalContract.count.mockResolvedValueOnce(0);

        const list = await request(contractApp())
            .get("/contracts")
            .set("Authorization", authorizationFor(Role.TENANT));
        expect(list.status).toBe(200);
        expect(prismaMock.rentalContract.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    AND: [{ tenant_id: TENANT_ID }]
                }
            })
        );

        authenticateAs(Role.TENANT);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(
            contractRecord as never
        );
        const detail = await request(contractApp())
            .get(`/contracts/${CONTRACT_ID}`)
            .set("Authorization", authorizationFor(Role.TENANT));
        expect(detail.status).toBe(200);
        expect(prismaMock.rentalContract.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: CONTRACT_ID,
                    tenant_id: TENANT_ID
                }
            })
        );
        expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
    });

    it("extends through a final Manager-scoped mutation and returns 404 when scope is lost", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce({
            id: CONTRACT_ID,
            end_date: contractRecord.end_date,
            status: ContractStatus.ACTIVE
        } as never);
        prismaMock.rentalContract.updateMany.mockResolvedValueOnce({
            count: 1
        });
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce({
            id: CONTRACT_ID,
            end_date: new Date("2032-01-01T00:00:00.000Z"),
            extended_at: new Date("2026-06-30T00:00:00.000Z")
        } as never);

        const response = await request(contractApp())
            .patch(`/contracts/${CONTRACT_ID}/extend`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ new_end_date: "2032-01-01" });

        expect(response.status).toBe(200);
        expect(
            prismaMock.rentalContract.updateMany
        ).toHaveBeenCalledWith({
            where: {
                id: CONTRACT_ID,
                ...contractManagerScope,
                status: ContractStatus.ACTIVE,
                end_date: contractRecord.end_date
            },
            data: {
                end_date: new Date("2032-01-01T00:00:00.000Z"),
                extended_at: expect.any(Date)
            }
        });

        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce(
            null
        );
        const hidden = await request(contractApp())
            .patch(`/contracts/${CONTRACT_ID}/extend`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ new_end_date: "2032-01-01" });
        expect(hidden.status).toBe(404);
        expect(
            prismaMock.rentalContract.updateMany
        ).toHaveBeenCalledOnce();
    });

    it.each([
        ["scope loss", null, "NOT_FOUND"],
        ["status change", {
            id: CONTRACT_ID,
            end_date: contractRecord.end_date,
            status: ContractStatus.ENDED
        }, "CONTRACT_NOT_ACTIVE"],
        ["end-date change", {
            id: CONTRACT_ID,
            end_date: new Date("2031-06-01T00:00:00.000Z"),
            status: ContractStatus.ACTIVE
        }, "CONCURRENT_MODIFICATION"]
    ])("classifies extend race after %s", async (
        _race,
        current,
        expectedCode
    ) => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst
            .mockResolvedValueOnce({
                id: CONTRACT_ID,
                end_date: contractRecord.end_date,
                status: ContractStatus.ACTIVE
            } as never)
            .mockResolvedValueOnce(current as never);
        prismaMock.rentalContract.updateMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(contractApp())
            .patch(`/contracts/${CONTRACT_ID}/extend`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({ new_end_date: "2032-01-01" });

        expect(response.status).toBe(
            expectedCode === "NOT_FOUND" ? 404 : 409
        );
        expect(response.body.error.code).toBe(expectedCode);
    });

    it("ends through a final Manager-scoped mutation", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce({
            ...contractRecord,
            start_date: new Date("2020-01-01T00:00:00.000Z")
        } as never);
        prismaMock.rentalContract.updateMany.mockResolvedValueOnce({
            count: 1
        });
        prismaMock.rentalContract.count.mockResolvedValueOnce(0);
        prismaMock.apartment.updateMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce({
            ...contractRecord,
            status: ContractStatus.ENDED,
            end_date: new Date()
        } as never);

        const response = await request(contractApp())
            .patch(`/contracts/${CONTRACT_ID}/end`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(response.status).toBe(200);
        expect(
            prismaMock.rentalContract.updateMany
        ).toHaveBeenCalledWith({
            where: {
                id: CONTRACT_ID,
                ...contractManagerScope,
                status: ContractStatus.ACTIVE
            },
            data: expect.objectContaining({
                status: ContractStatus.ENDED
            })
        });
        expect(prismaMock.apartment.updateMany).toHaveBeenCalledWith({
            where: {
                id: APARTMENT_ID,
                status: ApartmentStatus.RENTED,
                building_id: BUILDING_ID,
                building: assignmentWhere
            },
            data: { status: ApartmentStatus.AVAILABLE }
        });
    });

    it("does not overwrite a concurrent apartment MAINTENANCE status", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce({
            ...contractRecord,
            start_date: new Date("2020-01-01T00:00:00.000Z")
        } as never);
        prismaMock.rentalContract.updateMany.mockResolvedValueOnce({
            count: 1
        });
        prismaMock.rentalContract.count.mockResolvedValueOnce(0);
        prismaMock.apartment.updateMany.mockResolvedValueOnce({ count: 0 });
        prismaMock.apartment.findFirst.mockResolvedValueOnce({
            status: ApartmentStatus.MAINTENANCE
        } as never);
        prismaMock.rentalContract.findFirst.mockResolvedValueOnce({
            ...contractRecord,
            status: ContractStatus.ENDED,
            end_date: new Date()
        } as never);

        const response = await request(contractApp())
            .patch(`/contracts/${CONTRACT_ID}/end`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data.apartment_status).toBe(
            ApartmentStatus.MAINTENANCE
        );
        expect(prismaMock.apartment.update).not.toHaveBeenCalled();
    });

    it("returns CONTRACT_NOT_ACTIVE when end loses the ACTIVE race", async () => {
        authenticateAs(Role.MANAGER);
        prismaMock.rentalContract.findFirst
            .mockResolvedValueOnce({
                ...contractRecord,
                start_date: new Date("2020-01-01T00:00:00.000Z")
            } as never)
            .mockResolvedValueOnce({
                id: CONTRACT_ID,
                status: ContractStatus.ENDED,
                end_date: new Date()
            } as never);
        prismaMock.rentalContract.updateMany.mockResolvedValueOnce({
            count: 0
        });

        const response = await request(contractApp())
            .patch(`/contracts/${CONTRACT_ID}/end`)
            .set("Authorization", authorizationFor(Role.MANAGER))
            .send({});

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe("CONTRACT_NOT_ACTIVE");
        expect(prismaMock.apartment.updateMany).not.toHaveBeenCalled();
    });
});

describe("strict tenant and contract validation", () => {
    it.each([
        ["/tenants?page=0", "get", undefined],
        [`/tenants/${TENANT_ID}`, "put", {}],
        ["/contracts?status=UNKNOWN", "get", undefined],
        ["/contracts", "post", {
            ...validContract,
            start_date: "2030-02-30"
        }],
        ["/contracts", "post", {
            ...validContract,
            end_date: "2029-01-01"
        }],
        [`/contracts/${CONTRACT_ID}/extend`, "patch", {
            new_end_date: "not-a-date",
            unknown: true
        }]
    ] as const)("rejects invalid %s inputs before mutations", async (
        path,
        method,
        body
    ) => {
        authenticateAs(Role.MANAGER);
        const app = path.startsWith("/tenants")
            ? tenantApp()
            : contractApp();
        let pending = request(app)[method](path)
            .set("Authorization", authorizationFor(Role.MANAGER));

        if (body !== undefined) {
            pending = pending.send(body);
        }

        const response = await pending;

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(prismaMock.tenant.update).not.toHaveBeenCalled();
        expect(prismaMock.rentalContract.create).not.toHaveBeenCalled();
        expect(prismaMock.rentalContract.update).not.toHaveBeenCalled();
        expect(prismaMock.rentalContract.updateMany).not.toHaveBeenCalled();
    });

    it("forbids Tenant contract create, extend, and end at the router", async () => {
        const cases = [
            request(contractApp()).post("/contracts").send(validContract),
            request(contractApp())
                .patch(`/contracts/${CONTRACT_ID}/extend`)
                .send({ new_end_date: "2032-01-01" }),
            request(contractApp())
                .patch(`/contracts/${CONTRACT_ID}/end`)
                .send({})
        ];

        for (const pending of cases) {
            authenticateAs(Role.TENANT);
            const response = await pending.set(
                "Authorization",
                authorizationFor(Role.TENANT)
            );
            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
        }

        expect(prismaMock.rentalContract.create).not.toHaveBeenCalled();
        expect(prismaMock.rentalContract.update).not.toHaveBeenCalled();
    });
});

describe("contract datetime validation", () => {
    it.each([
        ["2032-02-29", "2032-02-29T00:00:00.000Z"],
        ["2032-01-01T12:34:56Z", "2032-01-01T12:34:56.000Z"],
        [
            "2032-01-01t12:34:56.123+07:00",
            "2032-01-01T05:34:56.123Z"
        ],
        [
            "2032-01-01T00:15:00-02:30",
            "2032-01-01T02:45:00.000Z"
        ]
    ])("accepts and normalizes %s", (value, expected) => {
        const result = extendContractRequestSchema.safeParse({
            params: { id: CONTRACT_ID },
            query: {},
            body: { new_end_date: value }
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.body.new_end_date.toISOString()).toBe(
                expected
            );
        }
    });

    it.each([
        "2031-02-29",
        "2032-02-30T12:00:00Z",
        "2032-01-01T24:00:00Z",
        "2032-01-01T23:60:00Z",
        "2032-01-01T23:59:60Z",
        "2032-01-01T12:00:00+24:00",
        "2032-01-01T12:00:00+07:60",
        "2032-01-01T12:00:00"
    ])("rejects invalid or timezone-less datetime %s", (value) => {
        const result = extendContractRequestSchema.safeParse({
            params: { id: CONTRACT_ID },
            query: {},
            body: { new_end_date: value }
        });

        expect(result.success).toBe(false);
    });

    it("uses UTC boundaries for every contract day comparison", () => {
        const source = readFileSync(contractServicePath, "utf8");

        expect(source).toContain("setUTCHours(0, 0, 0, 0)");
        expect(source).not.toContain(".setHours(");
    });
});
