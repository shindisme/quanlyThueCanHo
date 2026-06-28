import { Prisma } from "@prisma/client";
import { Router } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import multer from "multer";
import request from "supertest";
import {
    describe,
    expect,
    it,
    vi
} from "vitest";
import { z } from "zod";
import { AppError } from "../src/errors/app-error.js";
import {
    getValidated,
    validate
} from "../src/middleware/validate.middleware.js";
import {
    sendPaginated,
    sendSuccess
} from "../src/utils/api-response.js";
import { createTestApp } from "./helpers/test-app.js";

const requestSchema = z.object({
    params: z.object({}),
    query: z.object({
        page: z.coerce.number().int().positive()
    }),
    body: z.object({
        name: z.string().min(2)
    })
});

type ValidatedRequest = z.infer<typeof requestSchema>;

const createRouter = () => {
    const router = Router();

    router.post("/resources", validate(requestSchema), (req, res) => {
        return sendSuccess(
            res,
            getValidated<ValidatedRequest>(req),
            201
        );
    });

    router.get("/conflict", () => {
        throw new AppError(
            409,
            "CONFLICT",
            "The resource conflicts with existing state",
            { resource: "resource" }
        );
    });

    router.get("/paginated", (_req, res) => {
        return sendPaginated(
            res,
            [{ id: 1 }],
            {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1
            }
        );
    });

    router.get("/jwt-error", (_req, _res, next) => {
        next(new JsonWebTokenError("invalid token"));
    });

    router.get("/upload-error", (_req, _res, next) => {
        next(new multer.MulterError("LIMIT_FILE_SIZE"));
    });

    router.get("/unknown-error", () => {
        throw new Error("database password leaked");
    });

    return router;
};

describe("API infrastructure", () => {
    it("coerces validated input and sends a standard 201 success response", async () => {
        const response = await request(createTestApp(createRouter()))
            .post("/resources?page=2")
            .send({ name: "AB" });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            success: true,
            data: {
                params: {},
                query: { page: 2 },
                body: { name: "AB" }
            }
        });
    });

    it("returns field-level validation details for an invalid body", async () => {
        const response = await request(createTestApp(createRouter()))
            .post("/resources?page=2")
            .send({ name: "A" });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(response.body.error.details).toContainEqual(
            expect.objectContaining({
                field: "body.name"
            })
        );
    });

    it("maps AppError status, code, message, and details", async () => {
        const response = await request(createTestApp(createRouter()))
            .get("/conflict");

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "CONFLICT",
                message: "The resource conflicts with existing state",
                details: { resource: "resource" }
            }
        });
    });

    it("returns a standard not-found response for an unknown route", async () => {
        const response = await request(createTestApp(createRouter()))
            .get("/missing");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("NOT_FOUND");
        expect(response.body.error.message).toEqual(expect.any(String));
    });

    it("nests pagination metadata under meta.pagination", async () => {
        const response = await request(createTestApp(createRouter()))
            .get("/paginated");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: [{ id: 1 }],
            meta: {
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1
                }
            }
        });
    });

    it("maps JWT errors to a standard unauthorized response", async () => {
        const response = await request(createTestApp(createRouter()))
            .get("/jwt-error");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("INVALID_TOKEN");
    });

    it("maps Multer errors to a standard bad-request response", async () => {
        const response = await request(createTestApp(createRouter()))
            .get("/upload-error");

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("UPLOAD_ERROR");
    });

    it.each([
        ["P2002", 409, "UNIQUE_CONFLICT"],
        ["P2003", 409, "RELATION_CONFLICT"],
        ["P2025", 404, "NOT_FOUND"]
    ])(
        "maps Prisma %s errors to %s %s",
        async (code, status, expectedCode) => {
            const router = Router();
            const error = new Prisma.PrismaClientKnownRequestError(
                "Prisma request failed",
                {
                    code,
                    clientVersion: "6.15.0"
                }
            );

            router.get("/prisma-error", (_req, _res, next) => {
                next(error);
            });

            const response = await request(createTestApp(router))
                .get("/prisma-error");

            expect(response.status).toBe(status);
            expect(response.body.error.code).toBe(expectedCode);
        }
    );

    it("logs unknown errors without exposing internals", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        const response = await request(createTestApp(createRouter()))
            .get("/unknown-error");

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
        expect(response.body.error.message).not.toContain("database password");
        expect(consoleError).toHaveBeenCalledOnce();
    });
});
