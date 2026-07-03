import request from "supertest";
import {
    describe,
    expect,
    it
} from "vitest";
import app from "../src/app.js";

describe("default application error handling", () => {
    it("returns the standard validation error for an invalid login body", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns a safe client error for malformed JSON", async () => {
        const response = await request(app)
            .post("/auth/login")
            .set("Content-Type", "application/json")
            .send("{");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "MALFORMED_JSON",
                message: "Request body contains malformed JSON"
            }
        });
    });

    it("returns the standard not-found envelope for an unknown route", async () => {
        const response = await request(app)
            .get("/route-that-does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "NOT_FOUND",
                message: "Route GET /route-that-does-not-exist was not found"
            }
        });
    });
});
