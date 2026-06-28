import type {
    NextFunction,
    Request,
    Response
} from "express";
import {
    describe,
    expect,
    it,
    vi
} from "vitest";
import { errorHandler } from "../src/middleware/error.middleware.js";

describe("errorHandler", () => {
    it("delegates an error when response headers were already sent", () => {
        const error = new Error("stream failed");
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const response = {
            headersSent: true,
            status
        } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        errorHandler(
            error,
            {} as Request,
            response,
            next
        );

        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith(error);
        expect(status).not.toHaveBeenCalled();
    });
});
