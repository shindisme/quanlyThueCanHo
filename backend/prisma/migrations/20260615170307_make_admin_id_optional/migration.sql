-- DropForeignKey
ALTER TABLE "public"."buildings" DROP CONSTRAINT "buildings_admin_id_fkey";

-- AlterTable
ALTER TABLE "public"."buildings" ALTER COLUMN "admin_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."buildings" ADD CONSTRAINT "buildings_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
