import type { UtilityReading } from "../types";

// Du lieu gia chi so dien nuoc (khớp DB schema - không có invoice_id, image_url)
export const mockUtilityReadings: UtilityReading[] = [
  // Thang 6/2026
  { id: 1, apartment_id: 1, month: 6, year: 2026, electric_old: 1200, electric_new: 1350, water_old: 80, water_new: 92, recorded_by: 2, created_at: "2026-06-01T00:00:00Z" },
  { id: 2, apartment_id: 2, month: 6, year: 2026, electric_old: 2500, electric_new: 2700, water_old: 150, water_new: 168, recorded_by: 2, created_at: "2026-06-01T00:00:00Z" },
  { id: 3, apartment_id: 4, month: 6, year: 2026, electric_old: 3100, electric_new: 3350, water_old: 200, water_new: 220, recorded_by: 2, created_at: "2026-06-01T00:00:00Z" },

  // Thang 5/2026
  { id: 4, apartment_id: 1, month: 5, year: 2026, electric_old: 1050, electric_new: 1200, water_old: 68, water_new: 80, recorded_by: 2, created_at: "2026-05-01T00:00:00Z" },
  { id: 5, apartment_id: 9, month: 5, year: 2026, electric_old: 1800, electric_new: 1980, water_old: 100, water_new: 114, recorded_by: 2, created_at: "2026-05-01T00:00:00Z" },

  // Thang 4/2026
  { id: 6, apartment_id: 1, month: 4, year: 2026, electric_old: 900, electric_new: 1050, water_old: 55, water_new: 68, recorded_by: 2, created_at: "2026-04-01T00:00:00Z" },
  { id: 7, apartment_id: 14, month: 4, year: 2026, electric_old: 2200, electric_new: 2400, water_old: 130, water_new: 148, recorded_by: 3, created_at: "2026-04-01T00:00:00Z" },
];
