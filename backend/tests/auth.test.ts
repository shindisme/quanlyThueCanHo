import {
    Role,
    UserStatus,
    type User
} from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import {
    beforeAll,
    describe,
    expect,
    it
} from "vitest";
import {
    authenticate,
    authorizeRole
} from "../src/middleware/auth.middleware.js";
import authRouter from "../src/routes/auth.route.js";
import { getAllUsersService } from "../src/services/auth.service.js";
import { prismaMock } from "./setup.js";
import { createBearerToken } from "./helpers/auth.js";
import { createTestApp } from "./helpers/test-app.js";

const JWT_SECRET = "test-only-jwt-secret";
const PASSWORD = "correct-password";

let passwordHash: string;

const user = (
    overrides: Partial<User> = {}
): User => ({
    id: 101,
    username: "alice",
    password_hash: passwordHash,
    role: Role.MANAGER,
    status: UserStatus.ACTIVE,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides
});

const authenticationRecord = (
    overrides: {
        id?: number;
        role?: Role;
        status?: UserStatus;
        staff?: { id: number; building_id: number | null } | null;
        tenant?: { id: number } | null;
    } = {}
) => ({
    id: 101,
    role: Role.MANAGER,
    status: UserStatus.ACTIVE,
    staff: {
        id: 201,
        building_id: 301
    },
    tenant: null,
    ...overrides
});

const createActorRouter = (roles?: Role[]) => {
    const router = Router();
    const handlers = roles
        ? [authenticate, authorizeRole(roles)]
        : [authenticate];

    router.get("/actor", ...handlers, (req, res) => {
        res.json(req.actor);
    });

    return router;
};

beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
});

describe("authentication", () => {
    it("logs in an ACTIVE user with a subject-only authorization token", async () => {
        prismaMock.user.findUnique.mockResolvedValue(user());

        const response = await request(createTestApp(authRouter, "/auth"))
            .post("/auth/login")
            .send({
                username: "  alice  ",
                password: PASSWORD
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: {
                token: expect.any(String),
                role: Role.MANAGER
            }
        });
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { username: "alice" }
        });

        const payload = jwt.verify(
            response.body.data.token,
            JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        expect(payload).toEqual(expect.objectContaining({
            sub: "101"
        }));
        expect(payload).not.toEqual(expect.objectContaining({
            userId: expect.anything()
        }));
        expect(payload).not.toEqual(expect.objectContaining({
            role: expect.anything()
        }));
        expect(payload).not.toEqual(expect.objectContaining({
            status: expect.anything()
        }));
        expect(payload).not.toEqual(expect.objectContaining({
            staffId: expect.anything()
        }));
        expect(payload).not.toEqual(expect.objectContaining({
            buildingId: expect.anything()
        }));
        expect(payload).not.toEqual(expect.objectContaining({
            tenantId: expect.anything()
        }));
    });

    it("returns the same public error for an unknown username and a wrong password", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(user());

        const app = createTestApp(authRouter, "/auth");
        const unknown = await request(app)
            .post("/auth/login")
            .send({
                username: "unknown",
                password: PASSWORD
            });
        const wrongPassword = await request(app)
            .post("/auth/login")
            .send({
                username: "alice",
                password: "wrong-password"
            });

        expect(unknown.status).toBe(401);
        expect(wrongPassword.status).toBe(401);
        expect(unknown.body.error.code).toBe("INVALID_CREDENTIALS");
        expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
        expect(unknown.body.error.message).toBe(
            wrongPassword.body.error.message
        );
    });

    it.each([
        UserStatus.INACTIVE,
        UserStatus.BANNED
    ])(
        "rejects correct credentials for a %s user",
        async (status) => {
            prismaMock.user.findUnique.mockResolvedValue(user({ status }));

            const response = await request(createTestApp(authRouter, "/auth"))
                .post("/auth/login")
                .send({
                    username: "alice",
                    password: PASSWORD
                });

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
            expect(response.body).not.toHaveProperty("data.token");
        }
    );

    it("requires an Authorization header", async () => {
        const response = await request(createTestApp(createActorRouter()))
            .get("/actor");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe(
            "AUTHENTICATION_REQUIRED"
        );
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it.each([
        ["malformed", "Bearer not-a-jwt"],
        [
            "expired",
            `Bearer ${jwt.sign(
                { sub: "101" },
                JWT_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: -1
                }
            )}`
        ]
    ])(
        "rejects a %s token as invalid",
        async (_kind, authorization) => {
            const response = await request(
                createTestApp(createActorRouter())
            )
                .get("/actor")
                .set("Authorization", authorization);

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("INVALID_TOKEN");
        }
    );

    it("rejects a signed token with an invalid subject", async () => {
        const authorization = `Bearer ${jwt.sign(
            { sub: "not-a-user-id" },
            JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "1h"
            }
        )}`;

        const response = await request(createTestApp(createActorRouter()))
            .get("/actor")
            .set("Authorization", authorization);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("INVALID_TOKEN");
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("rejects a valid token when its database user no longer exists", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await request(createTestApp(createActorRouter()))
            .get("/actor")
            .set("Authorization", createBearerToken(101));

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("INVALID_TOKEN");
    });

    it.each([
        UserStatus.INACTIVE,
        UserStatus.BANNED
    ])(
        "rejects a valid token when its database user is %s",
        async (status) => {
            prismaMock.user.findUnique.mockResolvedValue(
                authenticationRecord({ status }) as never
            );

            const response = await request(
                createTestApp(createActorRouter())
            )
                .get("/actor")
                .set("Authorization", createBearerToken(101));

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
        }
    );

    it("uses the database role instead of a forged token role", async () => {
        prismaMock.user.findUnique.mockResolvedValue(
            authenticationRecord({
                role: Role.STAFF
            }) as never
        );

        const response = await request(
            createTestApp(createActorRouter([Role.ADMIN]))
        )
            .get("/actor")
            .set(
                "Authorization",
                createBearerToken(101, { role: Role.ADMIN })
            );

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("builds an ACTIVE manager actor from current database relations", async () => {
        prismaMock.user.findUnique.mockResolvedValue(
            authenticationRecord() as never
        );

        const response = await request(createTestApp(createActorRouter()))
            .get("/actor")
            .set("Authorization", createBearerToken(101));

        expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { id: 101 },
            select: {
                id: true,
                role: true,
                status: true,
                staff: {
                    select: {
                        id: true,
                        building_id: true
                    }
                },
                tenant: {
                    select: {
                        id: true
                    }
                }
            }
        });
        expect(
            prismaMock.user.findUnique.mock.calls[0][0].select
        ).not.toHaveProperty("password_hash");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userId: 101,
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
            staffId: 201,
            buildingId: 301
        });
    });

    it("builds an ACTIVE tenant actor from the current database relation", async () => {
        prismaMock.user.findUnique.mockResolvedValue(
            authenticationRecord({
                role: Role.TENANT,
                staff: null,
                tenant: { id: 501 }
            }) as never
        );

        const response = await request(createTestApp(createActorRouter()))
            .get("/actor")
            .set("Authorization", createBearerToken(101));

        expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userId: 101,
            role: Role.TENANT,
            status: UserStatus.ACTIVE,
            tenantId: 501
        });
    });

    it("loads user summaries with an explicit credential-safe projection", async () => {
        const createdAt = new Date("2026-02-01T00:00:00.000Z");
        prismaMock.user.findMany.mockResolvedValue([
            {
                id: 101,
                username: "alice",
                role: Role.MANAGER,
                status: UserStatus.ACTIVE,
                created_at: createdAt,
                staff: {
                    building: {
                        id: 301,
                        branch_name: "Central",
                        address_new: "123 Main Street"
                    }
                }
            }
        ] as never);

        const users = await getAllUsersService({
            userId: 1,
            role: Role.ADMIN,
            status: UserStatus.ACTIVE
        });

        expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            select: {
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
            }
        });
        expect(
            prismaMock.user.findMany.mock.calls[0][0].select
        ).not.toHaveProperty("password_hash");
        expect(users).toEqual([
            {
                id: 101,
                username: "alice",
                role: Role.MANAGER,
                status: UserStatus.ACTIVE,
                created_at: createdAt,
                managed_building: {
                    id: 301,
                    branch_name: "Central",
                    address_new: "123 Main Street"
                }
            }
        ]);
    });

    it("returns 400 INVALID_PASSWORD for a wrong current password", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce(user());

        const response = await request(createTestApp(authRouter, "/auth"))
            .post("/auth/change-password")
            .set("Authorization", createBearerToken(101))
            .send({
                oldPass: "wrong-password",
                newPass: "new-password"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "INVALID_PASSWORD",
                message: "Current password is incorrect"
            }
        });
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("verifies the old password and persists a hash of the new password", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce(user());
        prismaMock.user.update.mockResolvedValue(user());

        const response = await request(createTestApp(authRouter, "/auth"))
            .post("/auth/change-password")
            .set("Authorization", createBearerToken(101))
            .send({
                oldPass: PASSWORD,
                newPass: "new-password"
            });

        expect(prismaMock.user.findUnique).toHaveBeenNthCalledWith(
            2,
            { where: { id: 101 } }
        );
        expect(prismaMock.user.update).toHaveBeenCalledOnce();

        const updateArguments = prismaMock.user.update.mock.calls[0][0];
        const updatedHash = updateArguments.data.password_hash as string;

        expect(updateArguments).toEqual({
            where: { id: 101 },
            data: { password_hash: expect.any(String) }
        });
        expect(updatedHash).not.toBe(PASSWORD);
        expect(await bcrypt.compare("new-password", updatedHash)).toBe(true);
        expect(await bcrypt.compare(PASSWORD, updatedHash)).toBe(false);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: { changed: true }
        });
    });

    it("returns 404 NOT_FOUND when deleting a missing user", async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce(null);

        const response = await request(createTestApp(authRouter, "/auth"))
            .delete("/auth/delete-user/999")
            .set("Authorization", createBearerToken(101));

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "NOT_FOUND",
                message: "User was not found"
            }
        });
        expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it("updates a user with an explicit credential-safe projection", async () => {
        const createdAt = new Date("2026-02-01T00:00:00.000Z");

        prismaMock.user.findUnique
            .mockResolvedValueOnce(authenticationRecord() as never)
            .mockResolvedValueOnce({
                id: 102,
                role: Role.MANAGER
            } as never)
            .mockResolvedValueOnce({
                id: 102,
                username: "bob",
                role: Role.MANAGER,
                status: UserStatus.ACTIVE,
                created_at: createdAt
            } as never);
        prismaMock.user.findFirst.mockResolvedValueOnce({
            id: 102
        } as never);
        prismaMock.user.updateMany.mockResolvedValueOnce({ count: 1 });

        const response = await request(createTestApp(authRouter, "/auth"))
            .put("/auth/users/102")
            .set("Authorization", createBearerToken(101))
            .send({ username: "bob" });

        expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
            where: {
                id: 102,
                role: {
                    not: Role.ADMIN
                },
                OR: [
                    {
                        staff: {
                            is: {
                                building_id: 301
                            }
                        }
                    },
                    {
                        tenant: {
                            is: {
                                onboarding_building_id: 301
                            }
                        }
                    },
                    {
                        tenant: {
                            is: {
                                contracts: {
                                    some: {
                                        apartment: {
                                            building_id: 301
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            data: { username: "bob" }
        });
        expect(prismaMock.user.findUnique).toHaveBeenNthCalledWith(
            3,
            {
                where: { id: 102 },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    status: true,
                    created_at: true
                }
            }
        );
        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: {
                id: 102,
                username: "bob",
                role: Role.MANAGER,
                status: UserStatus.ACTIVE,
                created_at: createdAt.toISOString()
            }
        });
    });
});
