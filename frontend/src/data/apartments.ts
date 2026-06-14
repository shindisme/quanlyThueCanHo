import type { Apartment, ApartmentImage } from "../types";

// Du lieu gia can ho - khớp DB schema (room_number, floor, bedrooms, bathrooms)
export const mockApartments: Apartment[] = [
  // Toa YuKi Tower A (building_id: 1)
  { id: 1, building_id: 1, room_number: "01", floor: 1, area: 45, bedrooms: 1, bathrooms: 1, rental_price: 8000000, description: "Can ho 1PN, view thanh pho, day du noi that.", status: "RENTED", created_at: "2025-02-01T00:00:00Z" },
  { id: 2, building_id: 1, room_number: "02", floor: 1, area: 65, bedrooms: 2, bathrooms: 1, rental_price: 12000000, description: "Can ho 2PN rong rai, ban cong thoang mat.", status: "RENTED", created_at: "2025-02-01T00:00:00Z" },
  { id: 3, building_id: 1, room_number: "01", floor: 2, area: 35, bedrooms: 0, bathrooms: 1, rental_price: 6500000, description: "Studio thiet ke mo, phong cach hien dai.", status: "AVAILABLE", created_at: "2025-02-01T00:00:00Z" },
  { id: 4, building_id: 1, room_number: "02", floor: 2, area: 70, bedrooms: 2, bathrooms: 2, rental_price: 15000000, description: "Can ho 2PN tang cao, view song Sai Gon.", status: "RENTED", created_at: "2025-02-01T00:00:00Z" },
  { id: 5, building_id: 1, room_number: "01", floor: 3, area: 90, bedrooms: 3, bathrooms: 2, rental_price: 20000000, description: "Can ho 3PN cho gia dinh, day du tien nghi.", status: "AVAILABLE", created_at: "2025-02-01T00:00:00Z" },
  { id: 6, building_id: 1, room_number: "02", floor: 3, area: 120, bedrooms: 4, bathrooms: 3, rental_price: 35000000, description: "Penthouse sang trong tang thuong.", status: "MAINTENANCE", created_at: "2025-02-01T00:00:00Z" },

  // Toa YuKi Tower B (building_id: 2)
  { id: 7, building_id: 2, room_number: "01", floor: 1, area: 30, bedrooms: 0, bathrooms: 1, rental_price: 5500000, description: "Studio nho gon, phu hop nguoi doc than.", status: "RENTED", created_at: "2025-04-01T00:00:00Z" },
  { id: 8, building_id: 2, room_number: "02", floor: 1, area: 50, bedrooms: 1, bathrooms: 1, rental_price: 9000000, description: "1PN thoang mat, gan trung tam.", status: "AVAILABLE", created_at: "2025-04-01T00:00:00Z" },
  { id: 9, building_id: 2, room_number: "01", floor: 2, area: 68, bedrooms: 2, bathrooms: 1, rental_price: 13000000, description: "2PN rong rai, thich hop gia dinh nho.", status: "RENTED", created_at: "2025-04-01T00:00:00Z" },
  { id: 10, building_id: 2, room_number: "02", floor: 2, area: 48, bedrooms: 1, bathrooms: 1, rental_price: 8500000, description: "1PN view cong vien.", status: "AVAILABLE", created_at: "2025-04-01T00:00:00Z" },

  // Toa YuKi Residence (building_id: 3)
  { id: 11, building_id: 3, room_number: "01", floor: 1, area: 28, bedrooms: 0, bathrooms: 1, rental_price: 4000000, description: "Studio gia tot, gan truong dai hoc.", status: "RENTED", created_at: "2025-07-01T00:00:00Z" },
  { id: 12, building_id: 3, room_number: "02", floor: 1, area: 42, bedrooms: 1, bathrooms: 1, rental_price: 6000000, description: "1PN moi xay, noi that co ban.", status: "RENTED", created_at: "2025-07-01T00:00:00Z" },
  { id: 13, building_id: 3, room_number: "01", floor: 2, area: 60, bedrooms: 2, bathrooms: 1, rental_price: 10000000, description: "2PN day du noi that cao cap.", status: "AVAILABLE", created_at: "2025-07-01T00:00:00Z" },
  { id: 14, building_id: 3, room_number: "01", floor: 3, area: 85, bedrooms: 3, bathrooms: 2, rental_price: 16000000, description: "3PN goc, 2 mat thoang.", status: "RENTED", created_at: "2025-07-01T00:00:00Z" },

  // Toa YuKi Garden (building_id: 4)
  { id: 15, building_id: 4, room_number: "01", floor: 1, area: 75, bedrooms: 2, bathrooms: 2, rental_price: 14000000, description: "Tang tret co san vuon rieng.", status: "RENTED", created_at: "2025-10-01T00:00:00Z" },
  { id: 16, building_id: 4, room_number: "01", floor: 2, area: 62, bedrooms: 2, bathrooms: 1, rental_price: 11000000, description: "2PN view khu vuon.", status: "AVAILABLE", created_at: "2025-10-01T00:00:00Z" },

  // Toa YuKi Plaza (building_id: 5)
  { id: 17, building_id: 5, room_number: "01", floor: 1, area: 80, bedrooms: 2, bathrooms: 2, rental_price: 18000000, description: "Can ho cao cap phong cach chau Au.", status: "RENTED", created_at: "2026-02-01T00:00:00Z" },
  { id: 18, building_id: 5, room_number: "01", floor: 2, area: 110, bedrooms: 3, bathrooms: 2, rental_price: 28000000, description: "Duplex 2 tang, thiet ke doc dao.", status: "RENTED", created_at: "2026-02-01T00:00:00Z" },
  { id: 19, building_id: 5, room_number: "01", floor: 3, area: 40, bedrooms: 0, bathrooms: 1, rental_price: 7500000, description: "Studio rong, full noi that.", status: "AVAILABLE", created_at: "2026-02-01T00:00:00Z" },
  { id: 20, building_id: 5, room_number: "02", floor: 3, area: 52, bedrooms: 1, bathrooms: 1, rental_price: 10000000, description: "1PN tang cao, view song.", status: "MAINTENANCE", created_at: "2026-02-01T00:00:00Z" },
];

// Anh gia cho cac can ho
export const mockApartmentImages: ApartmentImage[] = [
  { id: 1, apartment_id: 1, image_url: "/images/apartments/apt-1-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
  { id: 2, apartment_id: 1, image_url: "/images/apartments/apt-1-2.jpg", is_thumbnail: false, created_at: "2025-02-01T00:00:00Z" },
  { id: 3, apartment_id: 2, image_url: "/images/apartments/apt-2-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
  { id: 4, apartment_id: 3, image_url: "/images/apartments/apt-3-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
  { id: 5, apartment_id: 5, image_url: "/images/apartments/apt-5-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
];
