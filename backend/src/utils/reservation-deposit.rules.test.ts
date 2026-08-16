import { describe, expect, it } from "vitest";
import { getReservationDepositBlockReason } from "./reservation-deposit.rules.js";

describe("getReservationDepositBlockReason", () => {
    it("blocks tenants with an active contract first", () => {
        expect(getReservationDepositBlockReason({
            isNewTenantPayload: false,
            tenantExists: true,
            hasActiveContract: true,
            hasActiveReservation: true
        })).toBe("ACTIVE_CONTRACT");
    });

    it("blocks tenants with an active reservation", () => {
        expect(getReservationDepositBlockReason({
            isNewTenantPayload: false,
            tenantExists: true,
            hasActiveContract: false,
            hasActiveReservation: true
        })).toBe("ACTIVE_RESERVATION");
    });

    it("blocks new tenant payloads when citizen id already exists", () => {
        expect(getReservationDepositBlockReason({
            isNewTenantPayload: true,
            tenantExists: true,
            hasActiveContract: false,
            hasActiveReservation: false
        })).toBe("EXISTING_TENANT");
    });

    it("allows existing tenants without active contract or reservation", () => {
        expect(getReservationDepositBlockReason({
            isNewTenantPayload: false,
            tenantExists: true,
            hasActiveContract: false,
            hasActiveReservation: false
        })).toBeNull();
    });
});
