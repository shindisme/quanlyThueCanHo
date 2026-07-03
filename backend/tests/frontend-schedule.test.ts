import { afterEach, describe, expect, it, vi } from "vitest";
import api from "../../frontend/src/lib/api.ts";
import { bookViewing } from "../../frontend/src/services/scheduleService.ts";

const defaultAdapter = api.defaults.adapter;

vi.stubGlobal("localStorage", {
    getItem: () => null,
    removeItem: () => undefined
});

afterEach(() => {
    api.defaults.adapter = defaultAdapter;
});

describe("viewing schedule API boundary", () => {
    it("sends a Vietnam RFC3339 timestamp", async () => {
        let requestBody = "";
        api.defaults.adapter = async (config) => {
            requestBody = config.data;
            return {
                data: {},
                status: 201,
                statusText: "Created",
                headers: {},
                config
            };
        };

        await bookViewing({
            apartment_id: 1,
            guest_name: "Nguyen Van A",
            guest_phone: "0901234567",
            guest_email: "guest@example.com",
            schedule_time: "2026-07-04T09:00:00"
        });

        expect(JSON.parse(requestBody).schedule_time).toBe(
            "2026-07-04T09:00:00+07:00"
        );
    });

    it("exposes a render-safe string error message", async () => {
        const error = await api.get("/test", {
            adapter: async (config) => Promise.reject({
                config,
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: "VALIDATION_ERROR",
                            message: "Request validation failed"
                        }
                    }
                }
            })
        }).catch((caught) => caught);

        expect(error.response.data.error).toBe(
            "Request validation failed"
        );
    });
});
