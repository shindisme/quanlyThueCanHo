import type { Invoice } from "../types";

type InvoicePeriodSource = Pick<Invoice, "invoice_code" | "created_at">;

export function getInvoicePeriod(invoice: InvoicePeriodSource) {
  const match = invoice.invoice_code.match(/-(\d{4})(0[1-9]|1[0-2])$/);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);

    return {
      month,
      year,
      label: `${month}/${year}`,
    };
  }

  const fallback = new Date(invoice.created_at);
  const month = fallback.getMonth() + 1;
  const year = fallback.getFullYear();

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