ALTER TABLE "payments" ALTER COLUMN "paid_at" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "paid_at" DROP NOT NULL;
UPDATE "payments" SET "paid_at" = NULL WHERE "status" <> 'SUCCESS';
