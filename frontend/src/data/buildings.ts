import type { Building } from "../types";

// Du lieu gia toa nha - khớp DB schema (address_old, address_new, branch_name, etc.)
export const mockBuildings: Building[] = [
  {
    id: 1,
    name: "YuKi Tower A",
    address_old: "123 Nguyen Hue, Quan 1, TP.HCM",
    address_new: "123 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP.HCM",
    description: "Toa nha cao cap voi day du tien nghi hien dai, vi tri trung tam thanh pho.",
    status: "ACTIVE",
    total_floors: 20,
    branch_name: "Chi nhanh Quan 1",
    total_apartments: 60,
    thumbnail_url: null,
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: 2,
    name: "YuKi Tower B",
    address_old: "456 Le Loi, Quan 1, TP.HCM",
    address_new: "456 Le Loi, Phuong Ben Thanh, Quan 1, TP.HCM",
    description: "Toa nha phong cach hien dai, gan trung tam thuong mai.",
    status: "ACTIVE",
    total_floors: 15,
    branch_name: "Chi nhanh Quan 1",
    total_apartments: 45,
    thumbnail_url: null,
    created_at: "2025-03-20T00:00:00Z",
  },
  {
    id: 3,
    name: "YuKi Residence",
    address_old: "789 Pham Van Dong, Thu Duc, TP.HCM",
    address_new: "789 Pham Van Dong, Phuong Linh Dong, TP. Thu Duc, TP.HCM",
    description: "Khu can ho xanh, yeu tinh, gan cac truong dai hoc.",
    status: "ACTIVE",
    total_floors: 25,
    branch_name: "Chi nhanh Thu Duc",
    total_apartments: 80,
    thumbnail_url: null,
    created_at: "2025-06-10T00:00:00Z",
  },
  {
    id: 4,
    name: "YuKi Garden",
    address_old: "321 Vo Van Ngan, Thu Duc, TP.HCM",
    address_new: "321 Vo Van Ngan, Phuong Linh Chieu, TP. Thu Duc, TP.HCM",
    description: "Can ho san vuon, khong gian song xanh mat.",
    status: "ACTIVE",
    total_floors: 12,
    branch_name: "Chi nhanh Thu Duc",
    total_apartments: 36,
    thumbnail_url: null,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: 5,
    name: "YuKi Plaza",
    address_old: "555 Nguyen Van Linh, Quan 7, TP.HCM",
    address_new: "555 Nguyen Van Linh, Phuong Tan Phong, Quan 7, TP.HCM",
    description: "Toa nha thuong mai - cu tru, co trung tam mua sam ben duoi.",
    status: "ACTIVE",
    total_floors: 30,
    branch_name: "Chi nhanh Quan 7",
    total_apartments: 90,
    thumbnail_url: null,
    created_at: "2026-01-05T00:00:00Z",
  },
];

// Lay danh sach chi nhanh (khong trung lap)
export function getBranchNames(): string[] {
  const branches = mockBuildings.map((b) => b.branch_name);
  return [...new Set(branches)];
}
