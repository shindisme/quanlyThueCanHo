import { describe, expect, it } from "vitest";
import { changePasswordRequestSchema } from "./auth.schema.js";

describe("changePasswordRequestSchema", () => {
    it("rejects a new password that matches the current password", () => {
        const password = "secret123";
        const result = changePasswordRequestSchema.safeParse({
            params: {},
            query: {},
            body: {
                oldPass: password,
                newPass: password
            }
        });

        expect(result.success).toBe(false);
    });
});
