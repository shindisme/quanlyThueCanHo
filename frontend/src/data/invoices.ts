import type { Invoice, InvoiceItem } from "../types";

// Du lieu gia hoa don
export const mockInvoices: Invoice[] = [
  { id: 1, invoice_code: "INV-202506-001", contract_id: 1, tenant_id: 1, due_date: "2026-06-15", total_amount: 9200000, status: "UNPAID", paid_at: null, created_at: "2026-06-01T00:00:00Z" },
  { id: 2, invoice_code: "INV-202506-002", contract_id: 2, tenant_id: 2, due_date: "2026-06-15", total_amount: 13800000, status: "PAID", paid_at: "2026-06-10T00:00:00Z", created_at: "2026-06-01T00:00:00Z" },
  { id: 3, invoice_code: "INV-202506-003", contract_id: 3, tenant_id: 3, due_date: "2026-06-15", total_amount: 17200000, status: "UNPAID", paid_at: null, created_at: "2026-06-01T00:00:00Z" },
  { id: 4, invoice_code: "INV-202505-001", contract_id: 1, tenant_id: 1, due_date: "2026-05-15", total_amount: 9000000, status: "PAID", paid_at: "2026-05-12T00:00:00Z", created_at: "2026-05-01T00:00:00Z" },
  { id: 5, invoice_code: "INV-202505-002", contract_id: 5, tenant_id: 5, due_date: "2026-05-15", total_amount: 14500000, status: "PAID", paid_at: "2026-05-14T00:00:00Z", created_at: "2026-05-01T00:00:00Z" },
  { id: 6, invoice_code: "INV-202506-004", contract_id: 6, tenant_id: 6, due_date: "2026-06-15", total_amount: 4800000, status: "OVERDUE", paid_at: null, created_at: "2026-06-01T00:00:00Z" },
  { id: 7, invoice_code: "INV-202506-005", contract_id: 7, tenant_id: 7, due_date: "2026-06-15", total_amount: 7100000, status: "UNPAID", paid_at: null, created_at: "2026-06-01T00:00:00Z" },
  { id: 8, invoice_code: "INV-202506-006", contract_id: 9, tenant_id: 9, due_date: "2026-06-15", total_amount: 15600000, status: "PAID", paid_at: "2026-06-08T00:00:00Z", created_at: "2026-06-01T00:00:00Z" },
  { id: 9, invoice_code: "INV-202506-007", contract_id: 10, tenant_id: 10, due_date: "2026-06-15", total_amount: 19800000, status: "UNPAID", paid_at: null, created_at: "2026-06-01T00:00:00Z" },
  { id: 10, invoice_code: "INV-202504-001", contract_id: 8, tenant_id: 8, due_date: "2026-04-15", total_amount: 17500000, status: "PAID", paid_at: "2026-04-13T00:00:00Z", created_at: "2026-04-01T00:00:00Z" },
];

// Chi tiet hoa don
export const mockInvoiceItems: InvoiceItem[] = [
  // Hoa don 1 (INV-202506-001, tenant 1)
  { id: 1, invoice_id: 1, item_name: "Tien thue thang 6/2026", quantity: 1, unit_price: 8000000, amount: 8000000, description: null },
  { id: 2, invoice_id: 1, item_name: "Tien dien", quantity: 150, unit_price: 3500, amount: 525000, description: "150 kWh x 3,500d" },
  { id: 3, invoice_id: 1, item_name: "Tien nuoc", quantity: 12, unit_price: 15000, amount: 180000, description: "12 m3 x 15,000d" },
  { id: 4, invoice_id: 1, item_name: "Phi dich vu", quantity: 1, unit_price: 300000, amount: 300000, description: "Phi quan ly, bao ve, ve sinh" },
  { id: 5, invoice_id: 1, item_name: "Internet", quantity: 1, unit_price: 195000, amount: 195000, description: null },

  // Hoa don 2 (INV-202506-002, tenant 2)
  { id: 6, invoice_id: 2, item_name: "Tien thue thang 6/2026", quantity: 1, unit_price: 12000000, amount: 12000000, description: null },
  { id: 7, invoice_id: 2, item_name: "Tien dien", quantity: 200, unit_price: 3500, amount: 700000, description: "200 kWh x 3,500d" },
  { id: 8, invoice_id: 2, item_name: "Tien nuoc", quantity: 18, unit_price: 15000, amount: 270000, description: "18 m3 x 15,000d" },
  { id: 9, invoice_id: 2, item_name: "Phi dich vu", quantity: 1, unit_price: 500000, amount: 500000, description: null },
  { id: 10, invoice_id: 2, item_name: "Phi gui xe", quantity: 1, unit_price: 330000, amount: 330000, description: "1 oto + 1 xe may" },
];
