import {
    existsSync,
    readFileSync,
    readdirSync
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationsPath = fileURLToPath(
    new URL("../prisma/migrations", import.meta.url)
);
const baselinePath = fileURLToPath(
    new URL(
        "../prisma/migrations/20260627000000_baseline_current_database/migration.sql",
        import.meta.url
    )
);
const hardeningPath = fileURLToPath(
    new URL(
        "../prisma/migrations/20260628000000_harden_integrity_and_scope/migration.sql",
        import.meta.url
    )
);
const deploymentPath = fileURLToPath(
    new URL(
        "../docs/database/migration-deployment.md",
        import.meta.url
    )
);
const schemaPath = fileURLToPath(
    new URL("../prisma/schema.prisma", import.meta.url)
);

describe("database integrity migration", () => {
    it("replaces the broken migration history with baseline and hardening migrations", () => {
        const migrationDirectories = readdirSync(
            migrationsPath,
            { withFileTypes: true }
        )
            .filter(
                (entry) => entry.isDirectory()
                    && existsSync(
                        join(migrationsPath, entry.name, "migration.sql")
                    )
            )
            .map((entry) => entry.name)
            .sort();

        expect(migrationDirectories).toEqual([
            "20260627000000_baseline_current_database",
            "20260628000000_harden_integrity_and_scope"
        ]);
        expect(migrationDirectories).not.toContain(
            "20260615165626_init_structure"
        );
        expect(migrationDirectories).not.toContain(
            "20260615170307_make_admin_id_optional"
        );
    });

    it("baselines the complete pre-hardening live schema", () => {
        expect(existsSync(baselinePath)).toBe(true);
        if (!existsSync(baselinePath)) return;

        const baseline = readFileSync(baselinePath, "utf8");

        expect(baseline).toContain('CREATE TABLE "staffs"');
        expect(baseline).toContain('CREATE TABLE "reviews"');
        expect(baseline).toMatch(
            /CREATE TABLE "users" \([\s\S]*?"username" TEXT NOT NULL[\s\S]*?CONSTRAINT "users_pkey"/
        );
        expect(baseline).toContain(
            'CREATE UNIQUE INDEX "users_username_key" ON "users"("username")'
        );
        expect(baseline).toMatch(
            /ADD CONSTRAINT "staffs_building_id_fkey" FOREIGN KEY \("building_id"\) REFERENCES "buildings"\("id"\) ON DELETE SET NULL ON UPDATE CASCADE/
        );
        expect(baseline).toMatch(
            /ADD CONSTRAINT "reviews_apartment_id_fkey" FOREIGN KEY \("apartment_id"\) REFERENCES "apartments"\("id"\) ON DELETE CASCADE ON UPDATE CASCADE/
        );

        expect(baseline).not.toContain("onboarding_building_id");
        expect(baseline).not.toContain("invoices_tenant_id_fkey");
        expect(baseline).not.toContain(
            "apartments_building_id_floor_room_number_key"
        );
        expect(baseline).not.toContain(
            "utility_readings_apartment_id_month_year_key"
        );
        expect(baseline).not.toContain(
            "reviews_apartment_id_tenant_id_key"
        );
        expect(baseline).not.toContain(
            "rental_contracts_one_active_per_apartment_key"
        );
    });

    it("guards all existing data before transactional schema changes", () => {
        const migration = readFileSync(hardeningPath, "utf8");
        const firstSchemaChange = migration.search(
            /\b(?:ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX)\b/i
        );
        const raisePositions = [
            ...migration.matchAll(/RAISE\s+EXCEPTION/gi)
        ].map((match) => match.index);

        expect(migration.trimStart()).toMatch(/^BEGIN;/);
        expect(migration.trimEnd()).toMatch(/COMMIT;$/);
        expect(firstSchemaChange).toBeGreaterThan(-1);
        expect(raisePositions).toHaveLength(6);
        for (const position of raisePositions) {
            expect(position).toBeLessThan(firstSchemaChange);
        }

        expect(migration).toMatch(
            /FROM "public"\."invoices" AS i\s+LEFT JOIN "public"\."tenants" AS t ON t\."id" = i\."tenant_id"\s+WHERE t\."id" IS NULL/
        );
        expect(migration).toMatch(
            /FROM "public"\."apartments"\s+GROUP BY "building_id", "floor", "room_number"\s+HAVING COUNT\(\*\) > 1/
        );
        expect(migration).toMatch(
            /FROM "public"\."utility_readings"\s+GROUP BY "apartment_id", "month", "year"\s+HAVING COUNT\(\*\) > 1/
        );
        expect(migration).toMatch(
            /FROM "public"\."reviews"\s+GROUP BY "apartment_id", "tenant_id"\s+HAVING COUNT\(\*\) > 1/
        );
        expect(migration).toMatch(
            /FROM "public"\."rental_contracts"\s+WHERE "status" = 'ACTIVE'\s+GROUP BY "apartment_id"\s+HAVING COUNT\(\*\) > 1/
        );

        expect(migration).toMatch(
            /CREATE UNIQUE INDEX "apartments_building_id_floor_room_number_key"\s+ON "public"\."apartments"\("building_id", "floor", "room_number"\);/
        );
        expect(migration).toMatch(
            /CREATE UNIQUE INDEX "utility_readings_apartment_id_month_year_key"\s+ON "public"\."utility_readings"\("apartment_id", "month", "year"\);/
        );
        expect(migration).toMatch(
            /CREATE UNIQUE INDEX "reviews_apartment_id_tenant_id_key"\s+ON "public"\."reviews"\("apartment_id", "tenant_id"\);/
        );
        expect(migration).toMatch(
            /CREATE UNIQUE INDEX "rental_contracts_one_active_per_apartment_key"\s+ON "public"\."rental_contracts"\("apartment_id"\)\s+WHERE "status" = 'ACTIVE';/
        );
        expect(migration).toMatch(
            /ADD CONSTRAINT "tenants_onboarding_building_id_fkey"\s+FOREIGN KEY \("onboarding_building_id"\)\s+REFERENCES "public"\."buildings"\("id"\)\s+ON DELETE SET NULL\s+ON UPDATE CASCADE;/
        );
        expect(migration).toMatch(
            /ADD CONSTRAINT "invoices_tenant_id_fkey"\s+FOREIGN KEY \("tenant_id"\)\s+REFERENCES "public"\."tenants"\("id"\)\s+ON DELETE RESTRICT\s+ON UPDATE CASCADE;/
        );

        expect(migration).not.toMatch(/\bDROP\s+TABLE\b/i);
        expect(migration).not.toMatch(/\bTRUNCATE\b/i);
        expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
        expect(migration).not.toMatch(/\bDROP\s+COLUMN\b/i);
        expect(migration).not.toMatch(/\bALTER\s+TYPE\b/i);
    });

    it("documents active-contract preflight, verification, and index locking", () => {
        const deployment = readFileSync(deploymentPath, "utf8");

        expect(deployment).toMatch(
            /FROM public\.rental_contracts\s+WHERE status = 'ACTIVE'\s+GROUP BY apartment_id\s+HAVING COUNT\(\*\) > 1;/
        );
        expect(deployment).toContain(
            "rental_contracts_one_active_per_apartment_key"
        );
        expect(deployment).toMatch(
            /partial unique index[\s\S]*lock/i
        );
    });

    it("guards one active viewing schedule per apartment and exact slot", () => {
        const migration = readFileSync(hardeningPath, "utf8");
        const deployment = readFileSync(deploymentPath, "utf8");
        const schema = readFileSync(schemaPath, "utf8");
        const firstSchemaChange = migration.search(
            /\b(?:ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX)\b/i
        );
        const viewingPreflight = migration.search(
            /FROM "public"\."viewing_schedules"\s+WHERE "status" IN \('PENDING', 'CONFIRMED'\)\s+GROUP BY "apartment_id", "schedule_time"\s+HAVING COUNT\(\*\) > 1/
        );

        expect(viewingPreflight).toBeGreaterThan(-1);
        expect(viewingPreflight).toBeLessThan(firstSchemaChange);
        expect(migration).toMatch(
            /CREATE UNIQUE INDEX "viewing_schedules_one_active_slot_key"\s+ON "public"\."viewing_schedules"\("apartment_id", "schedule_time"\)\s+WHERE "status" IN \('PENDING', 'CONFIRMED'\);/
        );
        expect(deployment).toMatch(
            /viewing_schedules[\s\S]*status IN \('PENDING', 'CONFIRMED'\)[\s\S]*GROUP BY apartment_id, schedule_time[\s\S]*HAVING COUNT\(\*\) > 1;/
        );
        expect(deployment).toMatch(
            /viewing_schedules_one_active_slot_key[\s\S]*partial unique index[\s\S]*lock/i
        );
        expect(schema).toContain(
            "viewing_schedules_one_active_slot_key"
        );
        expect(schema).not.toMatch(
            /model ViewingSchedule \{[\s\S]*@@unique\(\[apartment_id, schedule_time\]\)/
        );
    });

    it("keeps both migration files free of destructive data cleanup", () => {
        expect(existsSync(baselinePath)).toBe(true);
        if (!existsSync(baselinePath)) return;

        const migrations = [
            readFileSync(baselinePath, "utf8"),
            readFileSync(hardeningPath, "utf8")
        ];

        for (const migration of migrations) {
            expect(migration).not.toMatch(/\bDROP\s+TABLE\b/i);
            expect(migration).not.toMatch(/\bTRUNCATE\b/i);
            expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
            expect(migration).not.toMatch(/\bDROP\s+COLUMN\b/i);
            expect(migration).not.toMatch(/\bALTER\s+TYPE\b/i);
        }
    });
});
