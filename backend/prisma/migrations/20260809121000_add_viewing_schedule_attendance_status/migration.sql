-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'AttendanceStatus'
    ) THEN
        CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_YET', 'ATTENDED', 'ABSENT');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "viewing_schedules"
ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT,
ADD COLUMN IF NOT EXISTS "attendance_status" "AttendanceStatus" NOT NULL DEFAULT 'NOT_YET';
