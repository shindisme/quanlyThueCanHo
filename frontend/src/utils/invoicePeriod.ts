import type { Invoice } from "../types";

type InvoicePeriodSource = Pick<Invoice, "invoice_code" | "created_at">;

export function getInvoicePeriod(invoice: InvoicePeriodSource) {
  const createdAt = new Date(invoice.created_at);
  const month = createdAt.getMonth() + 1;
  const year = createdAt.getFullYear();

  return {
    month,
    year,
    label: `${month}/${year}`,
  };
}

export function getInvoicePeriodSortValue(invoice: InvoicePeriodSource) {
  const period = getInvoicePeriod(invoice);

  return period.year * 100 + period.month;
}