import type { Invoice } from "../types";
import { formatApartmentDisplay } from "./string";

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