-- Move persisted settlement/damage data into the existing invoice model before dropping the old tables.
INSERT INTO "invoices" (
    "contract_id",
    "tenant_id",
    "invoice_code",
    "due_date",
    "total_amount",
    "status",
    "created_at",
    "paid_at",
    "type"
)
SELECT
    ct."contract_id",
    rc."tenant_id",
    'SETTLEMENT-' || ct."id",
    COALESCE(ct."completed_at", cs."calculated_at", CURRENT_TIMESTAMP),
    GREATEST(cs."additional_amount_due", 0),
    CASE
        WHEN GREATEST(cs."additional_amount_due", 0) <= 0 THEN 'PAID'::"InvoiceStatus"
        ELSE 'UNPAID'::"InvoiceStatus"
    END,
    COALESCE(cs."created_at", CURRENT_TIMESTAMP),
    CASE
        WHEN GREATEST(cs."additional_amount_due", 0) <= 0 THEN COALESCE(cs."settled_at", ct."completed_at", CURRENT_TIMESTAMP)
        ELSE NULL
    END,
    'FINAL_SETTLEMENT'::"InvoiceType"
FROM "contract_settlements" cs
JOIN "contract_terminations" ct ON ct."id" = cs."termination_id"
JOIN "rental_contracts" rc ON rc."id" = ct."contract_id"
LEFT JOIN "invoices" existing ON existing."id" = cs."final_invoice_id"
LEFT JOIN "invoices" existing_code ON existing_code."invoice_code" = 'SETTLEMENT-' || ct."id"
WHERE existing."id" IS NULL
  AND existing_code."id" IS NULL;

WITH settlement_invoices AS (
    SELECT
        cs.*,
        ct."id" AS termination_row_id,
        COALESCE(cs."final_invoice_id", inv."id") AS invoice_id
    FROM "contract_settlements" cs
    JOIN "contract_terminations" ct ON ct."id" = cs."termination_id"
    JOIN "invoices" inv ON inv."invoice_code" = 'SETTLEMENT-' || ct."id"
), paid AS (
    SELECT
        p."invoice_id",
        COALESCE(SUM(p."amount") FILTER (WHERE p."status" = 'SUCCESS'::"PaymentStatus"), 0) AS paid_amount
    FROM "payments" p
    GROUP BY p."invoice_id"
)
UPDATE "invoices" i
SET
    "total_amount" = GREATEST(s."additional_amount_due", 0),
    "status" = CASE
        WHEN GREATEST(s."additional_amount_due", 0) <= 0 THEN 'PAID'::"InvoiceStatus"
        WHEN COALESCE(p."paid_amount", 0) >= GREATEST(s."additional_amount_due", 0) THEN 'PAID'::"InvoiceStatus"
        ELSE 'UNPAID'::"InvoiceStatus"
    END,
    "paid_at" = CASE
        WHEN GREATEST(s."additional_amount_due", 0) <= 0 THEN COALESCE(i."paid_at", s."settled_at", CURRENT_TIMESTAMP)
        WHEN COALESCE(p."paid_amount", 0) >= GREATEST(s."additional_amount_due", 0) THEN COALESCE(i."paid_at", s."settled_at", CURRENT_TIMESTAMP)
        ELSE NULL
    END,
    "type" = 'FINAL_SETTLEMENT'::"InvoiceType"
FROM settlement_invoices s
LEFT JOIN paid p ON p."invoice_id" = s."invoice_id"
WHERE i."id" = s."invoice_id";

WITH settlement_invoices AS (
    SELECT COALESCE(cs."final_invoice_id", inv."id") AS invoice_id
    FROM "contract_settlements" cs
    JOIN "contract_terminations" ct ON ct."id" = cs."termination_id"
    JOIN "invoices" inv ON inv."invoice_code" = 'SETTLEMENT-' || ct."id"
)
DELETE FROM "invoice_items" ii
USING settlement_invoices s
WHERE ii."invoice_id" = s."invoice_id";

WITH settlement_invoices AS (
    SELECT
        cs.*,
        ct."id" AS termination_row_id,
        COALESCE(cs."final_invoice_id", inv."id") AS invoice_id
    FROM "contract_settlements" cs
    JOIN "contract_terminations" ct ON ct."id" = cs."termination_id"
    JOIN "invoices" inv ON inv."invoice_code" = 'SETTLEMENT-' || ct."id"
), line_items AS (
    SELECT "invoice_id", 'CÃ´ng ná»£ hÃ³a Ä‘Æ¡n chÆ°a thanh toÃ¡n' AS item_name, "outstanding_debt" AS amount
    FROM settlement_invoices WHERE "outstanding_debt" <> 0
    UNION ALL
    SELECT "invoice_id", 'Tiá»n thuÃª cuá»‘i ká»³', "final_rent"
    FROM settlement_invoices WHERE "final_rent" <> 0
    UNION ALL
    SELECT "invoice_id", 'Tiá»n Ä‘iá»‡n cuá»‘i ká»³', "final_electricity"
    FROM settlement_invoices WHERE "final_electricity" <> 0
    UNION ALL
    SELECT "invoice_id", 'Tiá»n nÆ°á»›c cuá»‘i ká»³', "final_water"
    FROM settlement_invoices WHERE "final_water" <> 0
    UNION ALL
    SELECT "invoice_id", 'PhÃ­ dá»‹ch vá»¥ cuá»‘i ká»³', "final_service_fee"
    FROM settlement_invoices WHERE "final_service_fee" <> 0
    UNION ALL
    SELECT "invoice_id", 'Khoáº£n phÃ¡t sinh khÃ¡c', "other_charges"
    FROM settlement_invoices WHERE "other_charges" <> 0
    UNION ALL
    SELECT
        s."invoice_id",
        'Bá»“i thÆ°á»ng: ' || d."description" || COALESCE(NULLIF(' - ' || d."note", ' - '), ''),
        d."amount"
    FROM settlement_invoices s
    JOIN "contract_termination_damages" d ON d."termination_id" = s."termination_row_id"
    WHERE d."amount" <> 0
    UNION ALL
    SELECT "invoice_id", 'CÆ¡ sá»Ÿ váº­t cháº¥t hÆ° háº¡i', "damage_amount"
    FROM settlement_invoices s
    WHERE "damage_amount" <> 0
      AND NOT EXISTS (
          SELECT 1
          FROM "contract_termination_damages" d
          WHERE d."termination_id" = s."termination_row_id"
      )
    UNION ALL
    SELECT "invoice_id", 'Äá»‘i trá»« tiá»n cá»c', -"deposit_applied"
    FROM settlement_invoices WHERE "deposit_applied" <> 0
)
INSERT INTO "invoice_items" ("invoice_id", "item_name", "quantity", "unit_price", "amount")
SELECT "invoice_id", item_name, 1, amount, amount
FROM line_items;

WITH settlement_invoices AS (
    SELECT COALESCE(cs."final_invoice_id", inv."id") AS invoice_id
    FROM "contract_settlements" cs
    JOIN "contract_terminations" ct ON ct."id" = cs."termination_id"
    JOIN "invoices" inv ON inv."invoice_code" = 'SETTLEMENT-' || ct."id"
)
INSERT INTO "invoice_items" ("invoice_id", "item_name", "quantity", "unit_price", "amount")
SELECT s."invoice_id", 'Quyáº¿t toÃ¡n thanh lÃ½ khÃ´ng phÃ¡t sinh pháº£i thu', 1, 0, 0
FROM settlement_invoices s
WHERE NOT EXISTS (
    SELECT 1
    FROM "invoice_items" ii
    WHERE ii."invoice_id" = s."invoice_id"
);

ALTER TABLE "contract_settlements" DROP CONSTRAINT IF EXISTS "contract_settlements_final_invoice_id_fkey";
ALTER TABLE "contract_settlements" DROP CONSTRAINT IF EXISTS "contract_settlements_termination_id_fkey";
ALTER TABLE "contract_termination_damages" DROP CONSTRAINT IF EXISTS "contract_termination_damages_termination_id_fkey";
DROP TABLE IF EXISTS "contract_termination_damages";
DROP TABLE IF EXISTS "contract_settlements";
DROP TYPE IF EXISTS "SettlementFinancialStatus";
