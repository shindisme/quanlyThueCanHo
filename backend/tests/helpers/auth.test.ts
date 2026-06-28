import { Role, UserStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { createBearerToken } from "./auth.js";

describe("createBearerToken", () => {
    it("creates an HS256 bearer token containing the actor", () => {
        const authorization = createBearerToken({
            userId: 101,
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
            staffId: 201,
            buildingId: 301
        });
        const token = authorization.replace(/^Bearer /, "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            algorithms: ["HS256"]
        });

        expect(authorization).toMatch(/^Bearer /);
        expect(decoded).toEqual(expect.objectContaining({
            userId: 101,
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
            staffId: 201,
            buildingId: 301
        }));
    });
});
