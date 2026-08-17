-- AlterTable
ALTER TABLE "viewing_schedules" ADD COLUMN "note" TEXT;

-- Extract existing notes embedded in guest_name if any
UPDATE "viewing_schedules"
SET "note" = SUBSTRING("guest_name" FROM '\[Ghi chú:\s*(.*?)\]')
WHERE "guest_name" LIKE '%[Ghi chú:%' AND "note" IS NULL;

UPDATE "viewing_schedules"
SET "note" = SUBSTRING("guest_name" FROM '\(Ghi chú:\s*(.*?)\)')
WHERE "guest_name" LIKE '%(Ghi chú:%' AND "note" IS NULL;

UPDATE "viewing_schedules"
SET "guest_name" = TRIM(REGEXP_REPLACE("guest_name", '\s*[\(\[]\s*Ghi chú:\s*.*?[\)\]]', '', 'i'))
WHERE "guest_name" ~* '[\(\[]\s*Ghi chú:';
