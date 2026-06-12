import type { RentalContract } from "../types";

// Du lieu gia hop dong thue
export const mockContracts: RentalContract[] = [
  { id: 1, apartment_id: 1, tenant_id: 1, start_date: "2025-03-01", end_date: "2026-03-01", deposit_amount: 16000000, monthly_rent: 8000000, status: "ACTIVE", contractFile: null, signedAt: "2025-02-25", createdBy: 1, created_at: "2025-02-25T00:00:00Z" },
  { id: 2, apartment_id: 2, tenant_id: 2, start_date: "2025-04-01", end_date: "2026-04-01", deposit_amount: 24000000, monthly_rent: 12000000, status: "ACTIVE", contractFile: null, signedAt: "2025-03-28", createdBy: 1, created_at: "2025-03-28T00:00:00Z" },
  { id: 3, apartment_id: 4, tenant_id: 3, start_date: "2025-05-01", end_date: "2026-05-01", deposit_amount: 30000000, monthly_rent: 15000000, status: "ACTIVE", contractFile: null, signedAt: "2025-04-27", createdBy: 1, created_at: "2025-04-27T00:00:00Z" },
  { id: 4, apartment_id: 7, tenant_id: 4, start_date: "2025-06-01", end_date: "2025-12-01", deposit_amount: 11000000, monthly_rent: 5500000, status: "ENDED", contractFile: null, signedAt: "2025-05-28", createdBy: 1, created_at: "2025-05-28T00:00:00Z" },
  { id: 5, apartment_id: 9, tenant_id: 5, start_date: "2025-07-01", end_date: "2026-07-01", deposit_amount: 26000000, monthly_rent: 13000000, status: "ACTIVE", contractFile: null, signedAt: "2025-06-26", createdBy: 2, created_at: "2025-06-26T00:00:00Z" },
  { id: 6, apartment_id: 11, tenant_id: 6, start_date: "2025-08-01", end_date: "2026-08-01", deposit_amount: 8000000, monthly_rent: 4000000, status: "ACTIVE", contractFile: null, signedAt: "2025-07-28", createdBy: 3, created_at: "2025-07-28T00:00:00Z" },
  { id: 7, apartment_id: 12, tenant_id: 7, start_date: "2025-09-01", end_date: "2026-09-01", deposit_amount: 12000000, monthly_rent: 6000000, status: "ACTIVE", contractFile: null, signedAt: "2025-08-28", createdBy: 3, created_at: "2025-08-28T00:00:00Z" },
  { id: 8, apartment_id: 14, tenant_id: 8, start_date: "2025-10-01", end_date: "2026-04-01", deposit_amount: 32000000, monthly_rent: 16000000, status: "ACTIVE", contractFile: null, signedAt: "2025-09-26", createdBy: 3, created_at: "2025-09-26T00:00:00Z" },
  { id: 9, apartment_id: 15, tenant_id: 9, start_date: "2025-11-01", end_date: "2026-11-01", deposit_amount: 28000000, monthly_rent: 14000000, status: "ACTIVE", contractFile: null, signedAt: "2025-10-28", createdBy: 1, created_at: "2025-10-28T00:00:00Z" },
  { id: 10, apartment_id: 17, tenant_id: 10, start_date: "2026-03-01", end_date: "2026-09-01", deposit_amount: 36000000, monthly_rent: 18000000, status: "ACTIVE", contractFile: null, signedAt: "2026-02-25", createdBy: 1, created_at: "2026-02-25T00:00:00Z" },
  { id: 11, apartment_id: 18, tenant_id: 1, start_date: "2026-04-01", end_date: "2027-04-01", deposit_amount: 56000000, monthly_rent: 28000000, status: "ACTIVE", contractFile: null, signedAt: "2026-03-28", createdBy: 1, created_at: "2026-03-28T00:00:00Z" },
];
