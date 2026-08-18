import type { ApartmentStatus } from "../constants/enums";
import type { Building } from "./building";
import type { RentalContract } from "./contract";

export interface Apartment {
  id: number;
  building_id: number;
  room_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rental_price: number;
  description: string | null;
  status: ApartmentStatus;
  available_from?: string | null;
  created_at: string;
  building?: Building;
  images?: ApartmentImage[];
  contracts?: RentalContract[];
}

export interface ApartmentImage {
  id: number;
  apartment_id: number;
  image_url: string;
  is_thumbnail: boolean;
  created_at?: string;
}

export type ApartmentData = Apartment;

export interface ApartmentQuery {
  building_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  status?: ApartmentStatus | string;
}

export interface CreateApartmentRequest {
  building_id: number;
  room_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rental_price: number;
  description?: string | null;
  status: ApartmentStatus | string;
}

export type UpdateApartmentRequest = Partial<CreateApartmentRequest>;

