DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'REFUND'
      AND enumtypid = '"InvoiceType"'::regtype
  ) THEN
    ALTER TYPE "InvoiceType" ADD VALUE 'REFUND';
  END IF;
END $$;