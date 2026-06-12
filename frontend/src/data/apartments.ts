import type { Apartment, ApartmentImage } from "../types";

// Du lieu gia can ho - moi toa nha co nhieu can ho
export const mockApartments: Apartment[] = [
  // Toa DuKi Tower A (building_id: 1)
  { id: 1, building_id: 1, apartment_code: "A-101", title: "Can ho 1 phong ngu", description: "Can ho 1PN, view thanh pho, day du noi that.", area: 45, rental_price: 8000000, status: "RENTED", created_at: "2025-02-01T00:00:00Z" },
  { id: 2, building_id: 1, apartment_code: "A-102", title: "Can ho 2 phong ngu", description: "Can ho 2PN rong rai, ban cong thoang mat.", area: 65, rental_price: 12000000, status: "RENTED", created_at: "2025-02-01T00:00:00Z" },
  { id: 3, building_id: 1, apartment_code: "A-201", title: "Studio cao cap", description: "Studio thiet ke mo, phong cach hien dai.", area: 35, rental_price: 6500000, status: "AVAILABLE", created_at: "2025-02-01T00:00:00Z" },
  { id: 4, building_id: 1, apartment_code: "A-202", title: "Can ho 2 phong ngu", description: "Can ho 2PN tang cao, view song Sai Gon.", area: 70, rental_price: 15000000, status: "RENTED", created_at: "2025-02-01T00:00:00Z" },
  { id: 5, building_id: 1, apartment_code: "A-301", title: "Can ho 3 phong ngu", description: "Can ho 3PN cho gia dinh, day du tien nghi.", area: 90, rental_price: 20000000, status: "AVAILABLE", created_at: "2025-02-01T00:00:00Z" },
  { id: 6, building_id: 1, apartment_code: "A-302", title: "Penthouse", description: "Penthouse sang trong tang thuong.", area: 120, rental_price: 35000000, status: "MAINTENANCE", created_at: "2025-02-01T00:00:00Z" },

  // Toa DuKi Tower B (building_id: 2)
  { id: 7, building_id: 2, apartment_code: "B-101", title: "Studio tieu chuan", description: "Studio nho gon, phu hop nguoi doc than.", area: 30, rental_price: 5500000, status: "RENTED", created_at: "2025-04-01T00:00:00Z" },
  { id: 8, building_id: 2, apartment_code: "B-102", title: "Can ho 1 phong ngu", description: "1PN thoang mat, gan trung tam.", area: 50, rental_price: 9000000, status: "AVAILABLE", created_at: "2025-04-01T00:00:00Z" },
  { id: 9, building_id: 2, apartment_code: "B-201", title: "Can ho 2 phong ngu", description: "2PN rong rai, thich hop gia dinh nho.", area: 68, rental_price: 13000000, status: "RENTED", created_at: "2025-04-01T00:00:00Z" },
  { id: 10, building_id: 2, apartment_code: "B-202", title: "Can ho 1 phong ngu", description: "1PN view cong vien.", area: 48, rental_price: 8500000, status: "AVAILABLE", created_at: "2025-04-01T00:00:00Z" },

  // Toa DuKi Residence (building_id: 3)
  { id: 11, building_id: 3, apartment_code: "R-101", title: "Studio sinh vien", description: "Studio gia tot, gan truong dai hoc.", area: 28, rental_price: 4000000, status: "RENTED", created_at: "2025-07-01T00:00:00Z" },
  { id: 12, building_id: 3, apartment_code: "R-102", title: "Can ho 1 phong ngu", description: "1PN moi xay, noi that co ban.", area: 42, rental_price: 6000000, status: "RENTED", created_at: "2025-07-01T00:00:00Z" },
  { id: 13, building_id: 3, apartment_code: "R-201", title: "Can ho 2 phong ngu", description: "2PN day du noi that cao cap.", area: 60, rental_price: 10000000, status: "AVAILABLE", created_at: "2025-07-01T00:00:00Z" },
  { id: 14, building_id: 3, apartment_code: "R-301", title: "Can ho 3 phong ngu", description: "3PN goc, 2 mat thoang.", area: 85, rental_price: 16000000, status: "RENTED", created_at: "2025-07-01T00:00:00Z" },

  // Toa DuKi Garden (building_id: 4)
  { id: 15, building_id: 4, apartment_code: "G-101", title: "Can ho san vuon", description: "Tang tret co san vuon rieng.", area: 75, rental_price: 14000000, status: "RENTED", created_at: "2025-10-01T00:00:00Z" },
  { id: 16, building_id: 4, apartment_code: "G-201", title: "Can ho 2 phong ngu", description: "2PN view khu vuon.", area: 62, rental_price: 11000000, status: "AVAILABLE", created_at: "2025-10-01T00:00:00Z" },

  // Toa DuKi Plaza (building_id: 5)
  { id: 17, building_id: 5, apartment_code: "P-101", title: "Can ho cao cap", description: "Can ho cao cap phong cach chau Au.", area: 80, rental_price: 18000000, status: "RENTED", created_at: "2026-02-01T00:00:00Z" },
  { id: 18, building_id: 5, apartment_code: "P-201", title: "Can ho Duplex", description: "Duplex 2 tang, thiet ke doc dao.", area: 110, rental_price: 28000000, status: "RENTED", created_at: "2026-02-01T00:00:00Z" },
  { id: 19, building_id: 5, apartment_code: "P-301", title: "Studio deluxe", description: "Studio rong, full noi that.", area: 40, rental_price: 7500000, status: "AVAILABLE", created_at: "2026-02-01T00:00:00Z" },
  { id: 20, building_id: 5, apartment_code: "P-302", title: "Can ho 1 phong ngu", description: "1PN tang cao, view song.", area: 52, rental_price: 10000000, status: "MAINTENANCE", created_at: "2026-02-01T00:00:00Z" },
];

// Anh gia cho cac can ho
export const mockApartmentImages: ApartmentImage[] = [
  { id: 1, apartment_id: 1, image_url: "/images/apartments/apt-1-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
  { id: 2, apartment_id: 1, image_url: "/images/apartments/apt-1-2.jpg", is_thumbnail: false, created_at: "2025-02-01T00:00:00Z" },
  { id: 3, apartment_id: 2, image_url: "/images/apartments/apt-2-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
  { id: 4, apartment_id: 3, image_url: "/images/apartments/apt-3-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
  { id: 5, apartment_id: 5, image_url: "/images/apartments/apt-5-1.jpg", is_thumbnail: true, created_at: "2025-02-01T00:00:00Z" },
];
