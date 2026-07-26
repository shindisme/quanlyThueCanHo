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

export interface UtilityReadingData {
  id: number;
  apartment_id: number;
  month: number;
  year: number;
  electric_old: number;
  electric_new: number;
  electric_consumption?: number;
  water_old: number;
  water_new: number;
  water_consumption?: number;
  created_at: string;
  recorded_by: number;
  apartment?: {
    id: number;
    building_id: number;
    floor: number;
    room_number: string;
    status?: string;
    building?: {
      id: number;
      branch_name: string;
      address?: string;
    };
  };
  staff?: {
    id: number;
    full_name: string;
    phone: string;
    position: string;
    building_id?: number;
  };
}

export interface UtilityReadingQuery {
  apartment_id?: number;
  building_id?: number;
  month?: number;
  year?: number;
  recorded_by?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUtilityReadingPayload {
  apartment_id: number;
  month: number;
  year: number;
  electric_old?: number;
  electric_new: number;
  water_old?: number;
  water_new: number;
  recorded_by?: number;
}

