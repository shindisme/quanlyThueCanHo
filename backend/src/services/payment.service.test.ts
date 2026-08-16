import { Role, UserStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
    canCreateVnpayPaymentUrlForRole,
    createPaymentService,
    generateCashTransactionCode,
    normalizePaymentMethod,
    PAYMENT_METHODS
} from "./payment.service.js";

describe("normalizePaymentMethod", () => {
    it("accepts cash payments", () => {
        expect(normalizePaymentMethod("CASH")).toBe(PAYMENT_METHODS.CASH);
    });
});


describe("generateCashTransactionCode", () => {
    it("includes the invoice id and timestamp for a cash payment", () => {
        expect(generateCashTransactionCode(12, new Date(0)))
            .toBe("CASH-12-0");
    });
});

describe("canCreateVnpayPaymentUrlForRole", () => {
    it("allows managers to create VNPay links for scoped invoices", () => {
        expect(canCreateVnpayPaymentUrlForRole(Role.MANAGER)).toBe(true);
    });

    it("keeps staff from creating VNPay links", () => {
        expect(canCreateVnpayPaymentUrlForRole(Role.STAFF)).toBe(false);
    });
});

describe("createPaymentService", () => {
    it("rejects manual payment creation from tenants", async () => {
        await expect(createPaymentService(
            {
                invoice_id: 1,
                payment_method: PAYMENT_METHODS.CASH
            },
            {
                userId: 1,
                tenantId: 1,
                role: Role.TENANT,
                status: UserStatus.ACTIVE
            }
        )).rejects.toMatchObject({
            statusCode: 403,
            code: "FORBIDDEN"
        });
    });
});
