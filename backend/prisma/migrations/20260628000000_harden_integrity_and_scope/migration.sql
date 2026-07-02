BEGIN;

-- Abort before any schema change if existing data cannot satisfy the new
-- foreign key and uniqueness constraints. This migration intentionally does
-- not repair or remove live data; the database remains the source of truth.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "public"."invoices" AS i
        LEFT JOIN "public"."tenants" AS t ON t."id" = i."tenant_id"
        WHERE t."id" IS NULL
    ) THEN
        RAISE EXCEPTION 'Preflight failed: invoices.tenant_id contains orphaned tenant references';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "public"."apartments"
        GROUP BY "building_id", "floor", "room_number"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Preflight failed: duplicate apartment building/floor/room combinations exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "public"."utility_readings"
        GROUP BY "apartment_id", "month", "year"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Preflight failed: duplicate utility reading periods exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "public"."reviews"
        GROUP BY "apartment_id", "tenant_id"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Preflight failed: duplicate apartment/tenant reviews exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "public"."rental_contracts"
        WHERE "status" = 'ACTIVE'
        GROUP BY "apartment_id"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Preflight failed: multiple active rental contracts exist for one apartment';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "public"."viewing_schedules"
        WHERE "status" IN ('PENDING', 'CONFIRMED')
        GROUP BY "apartment_id", "schedule_time"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Preflight failed: multiple active viewing schedules exist for one apartment and exact slot';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "public"."tenants"
ADD COLUMN "onboarding_building_id" INTEGER;

-- CreateIndex
CREATE INDEX "tenants_onboarding_building_id_idx"
ON "public"."tenants"("onboarding_building_id");

-- CreateIndex
CREATE UNIQUE INDEX "apartments_building_id_floor_room_number_key"
ON "public"."apartments"("building_id", "floor", "room_number");

-- CreateIndex
CREATE UNIQUE INDEX "utility_readings_apartment_id_month_year_key"
ON "public"."utility_readings"("apartment_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_apartment_id_tenant_id_key"
ON "public"."reviews"("apartment_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_one_active_per_apartment_key"
ON "public"."rental_contracts"("apartment_id")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "viewing_schedules_one_active_slot_key"
ON "public"."viewing_schedules"("apartment_id", "schedule_time")
WHERE "status" IN ('PENDING', 'CONFIRMED');

-- AddForeignKey
ALTER TABLE "public"."tenants"
ADD CONSTRAINT "tenants_onboarding_building_id_fkey"
FOREIGN KEY ("onboarding_building_id")
REFERENCES "public"."buildings"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices"
ADD CONSTRAINT "invoices_tenant_id_fkey"
FOREIGN KEY ("tenant_id")
REFERENCES "public"."tenants"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

COMMIT;
