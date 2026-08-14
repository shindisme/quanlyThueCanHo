import { describe, expect, it } from "vitest";
import { getInvoicePeriod } from "../../../frontend/src/utils/invoicePeriod";

describe("getInvoicePeriod", () => {
    it("uses the invoice creation date for the payment period", () => {
        expect(
            getInvoicePeriod({
                invoice_code: "INV-999-202607",
                created_at: "2026-08-15T10:30:00.000Z"
            })
        ).toEqual({
            month: 8,
            year: 2026,
            label: "8/2026"
        });
    });
});
