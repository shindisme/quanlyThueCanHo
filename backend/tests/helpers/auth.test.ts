import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { createBearerToken } from "./auth.js";

describe("createBearerToken", () => {
    it("creates an identity-only HS256 bearer token by default", () => {
        const authorization = createBearerToken(101);
        const token = authorization.replace(/^Bearer /, "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            algorithms: ["HS256"]
        });

        expect(authorization).toMatch(/^Bearer /);
        expect(decoded).toEqual(expect.objectContaining({
            sub: "101"
        }));
        expect(decoded).not.toHaveProperty("role");
        expect(decoded).not.toHaveProperty("status");
        expect(decoded).not.toHaveProperty("buildingId");
    });

    it("includes extra claims only when they are explicitly supplied", () => {
        const authorization = createBearerToken(101, {
            role: "forged-role",
            buildingId: 301
        });
        const token = authorization.replace(/^Bearer /, "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        expect(decoded).toEqual(expect.objectContaining({
            sub: "101",
            role: "forged-role",
            buildingId: 301
        }));
    });
});
