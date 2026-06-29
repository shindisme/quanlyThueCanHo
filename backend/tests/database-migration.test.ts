import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
    new URL(
        "../prisma/migrations/20260628000000_harden_integrity_and_scope/migration.sql",
        import.meta.url
    )
);

describe("database integrity migration", () => {
    it("guards existing data before adding scoped integrity constraints", () => {
        const migration = readFileSync(migrationPath, "utf8");

        expect(migration).toContain("invoices_tenant_id_fkey");
        expect(migration).toContain(
            "apartments_building_id_floor_room_number_key"
        );
        expect(migration).toContain(
            "utility_readings_apartment_id_month_year_key"
        );
        expect(migration).toContain(
            "reviews_apartment_id_tenant_id_key"
        );
        expect(migration).toContain("onboarding_building_id");

        expect(migration.match(/RAISE\s+EXCEPTION/gi)).toHaveLength(4);
        expect(migration).not.toMatch(/\bDROP\s+TABLE\b/i);
        expect(migration).not.toMatch(/\bTRUNCATE\b/i);
        expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
        expect(migration).not.toMatch(/\bDROP\s+COLUMN\b/i);
        expect(migration).not.toMatch(/\bALTER\s+TYPE\b/i);
    });
});
