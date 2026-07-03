import { describe, expect, it } from "vitest";

describe("module imports", () => {
    it("resolves the source alias when importing the building controller", async () => {
        const controller = await import(
            "../src/controllers/building.controller.js"
        );

        expect(controller.getAll).toEqual(expect.any(Function));
    });
});
