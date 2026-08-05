DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'VACATING_SOON'
          AND enumtypid = '"ApartmentStatus"'::regtype
    ) THEN
        ALTER TYPE "ApartmentStatus" ADD VALUE 'VACATING_SOON';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'FINAL_SETTLEMENT'
          AND enumtypid = '"InvoiceType"'::regtype
    ) THEN
        ALTER TYPE "InvoiceType" ADD VALUE 'FINAL_SETTLEMENT';
    END IF;
END $$;

DO $$
BEGIN
    CREATE TYPE "ContractTerminationType" AS ENUM ('TENANT_REQUEST', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ContractTerminationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INSPECTION', 'SETTLING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "DepositPolicy" AS ENUM ('REFUNDABLE', 'FORFEITED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "SettlementFinancialStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PARTIALLY_PAID', 'SETTLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "contract_terminations" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "type" "ContractTerminationType" NOT NULL,
    "status" "ContractTerminationStatus" NOT NULL DEFAULT 'PENDING',
    "requested_end_date" TIMESTAMP(3) NOT NULL,
    "effective_end_date" TIMESTAMP(3),
    "reason" TEXT,
    "notice_days" INTEGER NOT NULL,
    "deposit_policy" "DepositPolicy" NOT NULL,
    "refund_rate" DECIMAL(5,2) NOT NULL,
    "requested_by" INTEGER,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "completed_at" TIMESTAMP(3),
    "completed_by" INTEGER,
    "inspection_note" TEXT,
    "final_electricity_old" DECIMAL(10,2),
    "final_electricity_new" DECIMAL(10,2),
    "final_water_old" DECIMAL(10,2),
    "final_water_new" DECIMAL(10,2),
    "requires_maintenance" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_terminations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_termination_damages" (
    "id" SERIAL NOT NULL,
    "termination_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_termination_damages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_settlements" (
    "id" SERIAL NOT NULL,
    "termination_id" INTEGER NOT NULL,
    "final_invoice_id" INTEGER,
    "deposit_paid" DECIMAL(12,2) NOT NULL,
    "eligible_deposit" DECIMAL(12,2) NOT NULL,
    "outstanding_debt" DECIMAL(12,2) NOT NULL,
    "final_rent" DECIMAL(12,2) NOT NULL,
    "final_electricity" DECIMAL(12,2) NOT NULL,
    "final_water" DECIMAL(12,2) NOT NULL,
    "final_service_fee" DECIMAL(12,2) NOT NULL,
    "other_charges" DECIMAL(12,2) NOT NULL,
    "damage_amount" DECIMAL(12,2) NOT NULL,
    "deposit_applied" DECIMAL(12,2) NOT NULL,
    "refund_amount" DECIMAL(12,2) NOT NULL,
    "additional_amount_due" DECIMAL(12,2) NOT NULL,
    "financial_status" "SettlementFinancialStatus" NOT NULL DEFAULT 'PENDING',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_settlements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contract_terminations_contract_id_status_idx" ON "contract_terminations"("contract_id", "status");
CREATE INDEX "contract_terminations_status_requested_at_idx" ON "contract_terminations"("status", "requested_at");
CREATE INDEX "contract_termination_damages_termination_id_idx" ON "contract_termination_damages"("termination_id");
CREATE INDEX "contract_settlements_financial_status_idx" ON "contract_settlements"("financial_status");
CREATE UNIQUE INDEX "contract_settlements_termination_id_key" ON "contract_settlements"("termination_id");
CREATE UNIQUE INDEX "contract_settlements_final_invoice_id_key" ON "contract_settlements"("final_invoice_id");
CREATE UNIQUE INDEX "contract_terminations_one_open_per_contract_key"
    ON "contract_terminations"("contract_id")
    WHERE "status" IN ('PENDING', 'APPROVED', 'INSPECTION', 'SETTLING');

ALTER TABLE "contract_terminations" ADD CONSTRAINT "contract_terminations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "rental_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contract_termination_damages" ADD CONSTRAINT "contract_termination_damages_termination_id_fkey" FOREIGN KEY ("termination_id") REFERENCES "contract_terminations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_settlements" ADD CONSTRAINT "contract_settlements_termination_id_fkey" FOREIGN KEY ("termination_id") REFERENCES "contract_terminations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_settlements" ADD CONSTRAINT "contract_settlements_final_invoice_id_fkey" FOREIGN KEY ("final_invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;