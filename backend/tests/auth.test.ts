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

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userId: 101,
            role: Role.TENANT,
            status: UserStatus.ACTIVE,
            tenantId: 501
        });
    });
});
