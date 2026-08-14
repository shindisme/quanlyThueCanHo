import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
    canCreateVnpayPaymentUrlForRole,
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