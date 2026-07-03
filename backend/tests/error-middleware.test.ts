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
    it("does not classify an arbitrary SyntaxError as malformed JSON", () => {
        const error = new SyntaxError("application bug");
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const response = {
            headersSent: false,
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

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "An unexpected error occurred"
            }
        });
    });

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
