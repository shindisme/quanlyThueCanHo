import type { Invoice } from "../types";
import type { InvoiceStatus, InvoiceType } from "../constants/enums";
import { formatApartmentDisplay } from "./string";

const SUPPORTED_INVOICE_TYPES: readonly InvoiceType[] = [
  "DEPOSIT",
  "FIRST_RENT",
  "MONTHLY",
  "MAINTENANCE",
  "FINAL_SETTLEMENT",
];

export function getInvoiceType(invoice: Pick<Invoice, "type" | "invoice_code">): InvoiceType {
  if (invoice.invoice_code?.startsWith("MNT-")) {
    return "MAINTENANCE";
  }
  if (invoice.invoice_code?.startsWith("SETTLEMENT-")) {
    return "FINAL_SETTLEMENT";
  }
  if (invoice.invoice_code?.startsWith("DEP-")) {
    return "DEPOSIT";
  }
  return SUPPORTED_INVOICE_TYPES.includes(invoice.type as InvoiceType)
    ? invoice.type as InvoiceType
    : "MONTHLY";
}

export function getInvoiceStatus(
  invoice: Pick<Invoice, "status" | "due_date">
): InvoiceStatus {
  if (invoice.status !== "UNPAID") return invoice.status;

  const dueDate = new Date(invoice.due_date);
  if (Number.isNaN(dueDate.getTime())) return invoice.status;
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.getTime() < Date.now() ? "OVERDUE" : "UNPAID";
}

export function getInvoiceApartment(invoice: Invoice) {
  return invoice.contract?.apartment ?? invoice.reservation?.apartment ?? null;
}

export function getInvoiceTenant(invoice: Invoice) {
  return invoice.contract?.tenant ?? invoice.tenant ?? invoice.reservation?.tenant ?? null;
}

export function getInvoiceRoomDisplay(invoice: Invoice) {
  const apartment = getInvoiceApartment(invoice);

  if (!apartment) {
    return { room: "Chưa rõ", branch: "" };
  }

  return {
    room: formatApartmentDisplay(apartment.room_number, apartment.floor),
    branch: apartment.building?.branch_name || "",
  };
}

export function hideInvoicesCoveredByFinalSettlement(invoices: Invoice[]) {
  const settledContractIds = new Set(
    invoices
      .filter((invoice) => invoice.type === "FINAL_SETTLEMENT" && invoice.contract_id !== null)
      .map((invoice) => invoice.contract_id)
  );

  if (settledContractIds.size === 0) return invoices;

  return invoices.filter(
    (invoice) => invoice.type === "FINAL_SETTLEMENT"
      || invoice.contract_id === null
      || !settledContractIds.has(invoice.contract_id)
  );
}
