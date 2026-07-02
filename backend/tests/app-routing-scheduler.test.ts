import request from "supertest";
import {
    afterEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import app, { ROUTE_MOUNTS } from "../src/app.js";

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

describe("application route registration", () => {
    it("mounts every backend route exactly once", () => {
        const paths = ROUTE_MOUNTS.map(([path]) => path);
        const expected = [
            "/buildings",
            "/apartments",
            "/auth",
            "/schedules",
            "/chat",
            "/tenants",
            "/staff",
            "/contracts",
            "/reviews",
            "/utility-readings",
            "/invoices",
            "/payments",
            "/notifications",
            "/uploads"
        ];

        expect(paths).toEqual(expected);
        expect(new Set(paths).size).toBe(paths.length);
        expect(paths.filter((path) => path === "/contracts"))
            .toHaveLength(1);
        expect(paths.filter((path) => path === "/uploads"))
            .toHaveLength(1);
    });

    it("returns the standard root envelope", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            data: {
                message: "API is running"
            }
        });
    });
});

describe("server startup", () => {
    it("does not listen when server is imported in test mode", async () => {
        const listen = vi.spyOn(app, "listen");

        await import("../src/server.js");

        expect(listen).not.toHaveBeenCalled();
    });

    it("starts the monthly scheduler once, only after listen", async () => {
        const { startServer } = await import("../src/server.js");
        const events: string[] = [];
        const scheduler = vi.fn(() => {
            events.push("scheduler");
        });
        const close = vi.fn();
        const listen = vi.spyOn(app, "listen")
            .mockImplementation(((
                _port: number,
                callback: () => void
            ) => {
                events.push("listen");
                expect(scheduler).not.toHaveBeenCalled();
                callback();
                return { close };
            }) as never);

        const server = startServer(scheduler);

        expect(listen).toHaveBeenCalledTimes(1);
        expect(scheduler).toHaveBeenCalledTimes(1);
        expect(events).toEqual(["listen", "scheduler"]);
        expect(server).toEqual({ close });
    });

    it("preserves explicit PORT zero", async () => {
        vi.stubEnv("PORT", "0");
        const { startServer } = await import("../src/server.js");
        const listen = vi.spyOn(app, "listen")
            .mockReturnValue({ close: vi.fn() } as never);

        startServer(vi.fn());

        expect(listen).toHaveBeenCalledWith(
            0,
            expect.any(Function)
        );
    });

    it("rejects an invalid configured PORT", async () => {
        vi.stubEnv("PORT", "not-a-port");
        const { startServer } = await import("../src/server.js");
        const listen = vi.spyOn(app, "listen");
        const scheduler = vi.fn();

        expect(() => startServer(scheduler))
            .toThrow("PORT must be an integer between 0 and 65535");
        expect(listen).not.toHaveBeenCalled();
        expect(scheduler).not.toHaveBeenCalled();
    });
});
