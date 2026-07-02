import type { Apartment } from "./apartment";

export interface UtilityReading {
  id: number;
  apartment_id: number;
  month: number;
  year: number;
  electric_old: number;
  electric_new: number;
  water_old: number;
  water_new: number;
  recorded_by: number;
  created_at: string;
  apartment?: Apartment;
}
