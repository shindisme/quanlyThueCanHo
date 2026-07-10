import { describe, expect, it } from "vitest";

import {
    calculateElectricAmount,
    calculateElectricTierDetails
} from "../src/utils/invoice-billing.js";

describe("invoice billing", () => {
    it("breaks tiered electricity into invoice detail lines", () => {
        expect(calculateElectricAmount(123)).toBe(256_440);
        expect(calculateElectricTierDetails(123)).toEqual([
            {
                tier: 1,
                label: "Bậc 1 (0-50 kWh)",
                quantity: 50,
                unit_price: 1_984,
                amount: 99_200
            },
            {
                tier: 2,
                label: "Bậc 2 (51-100 kWh)",
                quantity: 50,
                unit_price: 2_050,
                amount: 102_500
            },
            {
                tier: 3,
                label: "Bậc 3 (101-200 kWh)",
                quantity: 23,
                unit_price: 2_380,
                amount: 54_740
            }
        ]);
    });
});
