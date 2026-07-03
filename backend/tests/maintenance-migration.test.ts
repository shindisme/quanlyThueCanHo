import {
    existsSync,
    readFileSync
} from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
    new URL(
        "../prisma/migrations/20260703000000_add_maintenance_workflow/migration.sql",
        import.meta.url
    )
);
const schemaPath = fileURLToPath(
    new URL("../prisma/schema.prisma", import.meta.url)
);

describe("maintenance workflow migration", () => {
    it("adds statuses, scheduling, and technician assignment safely", () => {
        expect(existsSync(migrationPath)).toBe(true);
        if (!existsSync(migrationPath)) return;

        const migration = readFileSync(migrationPath, "utf8");
        const schema = readFileSync(schemaPath, "utf8");

        expect(migration).toContain(
            "ALTER TYPE \"RequestStatus\" ADD VALUE 'NEEDS_RESCHEDULE'"
        );
        expect(migration).toContain(
            "ALTER TYPE \"RequestStatus\" ADD VALUE 'CANCELLED'"
        );
        expect(migration).toMatch(
            /ALTER TABLE "maintenance_requests"[\s\S]*"assigned_staff_id" INTEGER[\s\S]*"scheduled_at" TIMESTAMP\(3\)[\s\S]*"unable_reason" TEXT/
        );
        expect(migration).toContain(
            "CREATE INDEX \"maintenance_requests_assigned_staff_id_status_idx\""
        );
        expect(migration).toMatch(
            /FOREIGN KEY \("assigned_staff_id"\)[\s\S]*REFERENCES "staffs"\("id"\)[\s\S]*ON DELETE SET NULL/
        );
        expect(migration).not.toMatch(/\bDROP\s+TABLE\b/i);
        expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
        expect(schema).toMatch(
            /enum RequestStatus \{[\s\S]*NEEDS_RESCHEDULE[\s\S]*CANCELLED[\s\S]*\}/
        );
    });
});
