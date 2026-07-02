import type { Apartment } from "./apartment";

export interface Building {
  id: number;
  name: string;
  address_old: string;
  address_new: string;
  description: string | null;
  status: string;
  total_floors: number;
  total_apartments: number;
  branch_name: string;
  thumbnail_url: string | null;
  created_at: string;
  apartments?: Apartment[];
  _count?: { apartments: number };
}
