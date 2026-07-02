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
