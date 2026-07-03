ALTER TYPE "RequestStatus" ADD VALUE 'NEEDS_RESCHEDULE';
ALTER TYPE "RequestStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "maintenance_requests"
ADD COLUMN "assigned_staff_id" INTEGER,
ADD COLUMN "scheduled_at" TIMESTAMP(3),
ADD COLUMN "unable_reason" TEXT;

CREATE INDEX "maintenance_requests_assigned_staff_id_status_idx"
ON "maintenance_requests"("assigned_staff_id", "status");

ALTER TABLE "maintenance_requests"
ADD CONSTRAINT "maintenance_requests_assigned_staff_id_fkey"
FOREIGN KEY ("assigned_staff_id")
REFERENCES "staffs"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
