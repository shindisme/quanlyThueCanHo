import { describe, expect, it } from "vitest";
import {
    calculateElectricTierDetails,
    calculateWaterTierDetails
} from "./invoice-billing.js";

describe("fixed utility tiers", () => {
    it("splits electricity consumption into the six fixed tiers", () => {
        const details = calculateElectricTierDetails(
            450,
            [1, 2, 3, 4, 5, 6]
        );

        expect(details.map((detail) => detail.quantity))
            .toEqual([50, 50, 100, 100, 100, 50]);
        expect(details.map((detail) => detail.amount))
            .toEqual([50, 100, 300, 400, 500, 300]);
    });

    it("scales only the fixed water thresholds by occupant count", () => {
        const details = calculateWaterTierDetails(
            15,
            2,
            [1, 2, 3]
        );

        expect(details.map((detail) => detail.quantity))
            .toEqual([8, 4, 3]);
        expect(details.map((detail) => detail.amount))
            .toEqual([8, 8, 9]);
    });
});
