import { describe, expect, it } from "vitest";
import { apartmentSchema } from "../../frontend/src/schemas/apartment.schema.ts";
import { createApartmentRequestSchema } from "../src/schemas/apartment.schema.ts";

describe("apartment form schema", () => {
    it("accepts Decimal strings returned by the apartment API", () => {
        const result = apartmentSchema.safeParse({
            room_number: "12",
            building_id: 1,
            floor: 1,
            area: "12.00",
            bedrooms: 1,
            bathrooms: 1,
            rental_price: "13000000.00",
            description: "",
            status: "AVAILABLE"
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.area).toBe(12);
            expect(result.data.rental_price).toBe(13_000_000);
        }
    });

    it("accepts zero bedrooms and rejects negative bedrooms", () => {
        const apartment = {
            room_number: "12",
            building_id: 1,
            floor: 1,
            area: 12,
            bedrooms: 0,
            bathrooms: 1,
            rental_price: 13_000_000,
            description: "",
            status: "AVAILABLE"
        };

        expect(apartmentSchema.safeParse(apartment).success).toBe(true);
        expect(createApartmentRequestSchema.safeParse({
            params: {},
            query: {},
            body: apartment
        }).success).toBe(true);

        const negativeBedrooms = { ...apartment, bedrooms: -1 };
        expect(apartmentSchema.safeParse(negativeBedrooms).success).toBe(false);
        expect(createApartmentRequestSchema.safeParse({
            params: {},
            query: {},
            body: negativeBedrooms
        }).success).toBe(false);
    });
});
