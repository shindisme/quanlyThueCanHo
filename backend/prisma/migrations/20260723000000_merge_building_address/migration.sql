-- Merge the historical building address columns into the current single address column.
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "address" TEXT;

UPDATE "buildings"
SET "address" = COALESCE(
    NULLIF(TRIM("address_new"), ''),
    NULLIF(TRIM("address_old"), ''),
    "branch_name"
)
WHERE "address" IS NULL;

ALTER TABLE "buildings" ALTER COLUMN "address" SET NOT NULL;
ALTER TABLE "buildings" DROP COLUMN IF EXISTS "address_old";
ALTER TABLE "buildings" DROP COLUMN IF EXISTS "address_new";