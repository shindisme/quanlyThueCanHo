import type { Building } from "../types";

// Du lieu gia toa nha - 5 toa tai TP.HCM
export const mockBuildings: Building[] = [
  {
    id: 1,
    name: "DuKi Tower A",
    address: "123 Nguyen Hue, Quan 1, TP.HCM",
    description: "Toa nha cao cap voi day du tien nghi hien dai, vi tri trung tam thanh pho.",
    status: 1,
    totalFloors: 20,
    branchName: "Chi nhanh Quan 1",
    totalApartments: 60,
    thumbnailUrl: null,
    createdAt: "2025-01-15T00:00:00Z",
  },
  {
    id: 2,
    name: "DuKi Tower B",
    address: "456 Le Loi, Quan 1, TP.HCM",
    description: "Toa nha phong cach hien dai, gan trung tam thuong mai.",
    status: 1,
    totalFloors: 15,
    branchName: "Chi nhanh Quan 1",
    totalApartments: 45,
    thumbnailUrl: null,
    createdAt: "2025-03-20T00:00:00Z",
  },
  {
    id: 3,
    name: "DuKi Residence",
    address: "789 Pham Van Dong, Thu Duc, TP.HCM",
    description: "Khu can ho xanh, yeu tinh, gan cac truong dai hoc.",
    status: 1,
    totalFloors: 25,
    branchName: "Chi nhanh Thu Duc",
    totalApartments: 80,
    thumbnailUrl: null,
    createdAt: "2025-06-10T00:00:00Z",
  },
  {
    id: 4,
    name: "DuKi Garden",
    address: "321 Vo Van Ngan, Thu Duc, TP.HCM",
    description: "Can ho san vuon, khong gian song xanh mat.",
    status: 1,
    totalFloors: 12,
    branchName: "Chi nhanh Thu Duc",
    totalApartments: 36,
    thumbnailUrl: null,
    createdAt: "2025-09-01T00:00:00Z",
  },
  {
    id: 5,
    name: "DuKi Plaza",
    address: "555 Nguyen Van Linh, Quan 7, TP.HCM",
    description: "Toa nha thuong mai - cu tru, co trung tam mua sam ben duoi.",
    status: 1,
    totalFloors: 30,
    branchName: "Chi nhanh Quan 7",
    totalApartments: 90,
    thumbnailUrl: null,
    createdAt: "2026-01-05T00:00:00Z",
  },
];

// Lay danh sach chi nhanh (khong trung lap)
export function getBranchNames(): string[] {
  const branches = mockBuildings.map((b) => b.branchName);
  return [...new Set(branches)];
}
