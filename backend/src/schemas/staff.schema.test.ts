import { describe, expect, it } from "vitest";
import { listStaffRequestSchema } from "./staff.schema.js";

describe("listStaffRequestSchema", () => {
    it("defaults staff list requests to a full 100 item batch", () => {
        const parsed = listStaffRequestSchema.parse({
            params: {},
            query: {},
            body: {}
        });

        expect(parsed.query).toMatchObject({
            page: 1,
            limit: 100
        });
    });
});
