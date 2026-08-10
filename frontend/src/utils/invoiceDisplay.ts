import type { Invoice } from "../types";
import type { InvoiceType } from "../constants/enums";
import { formatApartmentDisplay } from "./string";

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
  return (invoice.type as InvoiceType) || "MONTHLY";
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