DROP INDEX IF EXISTS "viewing_schedules_temp_locked_until_idx";

ALTER TABLE "viewing_schedules"
DROP COLUMN IF EXISTS "temp_locked_until";
