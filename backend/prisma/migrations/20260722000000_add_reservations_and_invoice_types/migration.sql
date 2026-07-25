DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'ApartmentStatus'
        AND e.enumlabel = 'RESERVED'
    ) THEN
        ALTER TYPE "ApartmentStatus" ADD VALUE 'RESERVED';
    END IF;
END $$;

CREATE TYPE "InvoiceType" AS ENUM (
    'DEPOSIT',
    'FIRST_RENT',
    'MONTHLY',
    'MAINTENANCE'
);

CREATE TYPE "ReservationStatus" AS ENUM (
    'ACTIVE',
    'CONVERTED',
    'FORFEITED',
    'CANCELLED'
);

CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "apartment_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "contract_id" INTEGER,
    "deposit_amount" DECIMAL(12,2) NOT NULL,
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices"
    ADD COLUMN "reservation_id" INTEGER,
    ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'MONTHLY',
    ALTER COLUMN "contract_id" DROP NOT NULL;

CREATE UNIQUE INDEX "reservations_contract_id_key"
    ON "reservations"("contract_id");
CREATE INDEX "reservations_apartment_id_status_idx"
    ON "reservations"("apartment_id", "status");
CREATE INDEX "reservations_tenant_id_status_idx"
    ON "reservations"("tenant_id", "status");
CREATE INDEX "reservations_expires_at_status_idx"
    ON "reservations"("expires_at", "status");
CREATE INDEX "invoices_reservation_id_idx"
    ON "invoices"("reservation_id");
CREATE INDEX "invoices_type_idx"
    ON "invoices"("type");

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_apartment_id_fkey"
    FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_contract_id_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "rental_contracts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_reservation_id_fkey"
    FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE IF EXISTS "chatbot_messages";
DROP TABLE IF EXISTS "chat_conversations";
