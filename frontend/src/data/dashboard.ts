import type { DashboardKPI, MonthlyRevenue } from "../types";
import { mockBuildings } from "./buildings";
import { mockApartments } from "./apartments";
import { mockTenants } from "./tenants";
import { mockContracts } from "./contracts";
import { mockMaintenanceRequests } from "./maintenance";

// Tinh KPI tu mock data
export function getDashboardKPI(buildingId?: number): DashboardKPI {
  const apartments = buildingId
    ? mockApartments.filter((a) => a.building_id === buildingId)
    : mockApartments;

  const buildings = buildingId
    ? mockBuildings.filter((b) => b.id === buildingId)
    : mockBuildings;

  const rentedApartments = apartments.filter((a) => a.status === "RENTED");
  const availableApartments = apartments.filter((a) => a.status === "AVAILABLE");

  // Tinh doanh thu thang = tong tien thue cac can ho dang thue
  const monthlyRevenue = rentedApartments.reduce(
    (sum, a) => sum + a.rental_price,
    0
  );

  // Hop dong sap het han (trong 30 ngay toi)
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringContracts = mockContracts.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    if (buildingId) {
      const apt = mockApartments.find((a) => a.id === c.apartment_id);
      if (!apt || apt.building_id !== buildingId) return false;
    }
    const endDate = new Date(c.end_date);
    return endDate <= thirtyDaysLater && endDate >= now;
  });

  // Yeu cau sua chua dang cho xu ly
  const pendingMaintenance = mockMaintenanceRequests.filter((r) => {
    if (buildingId) {
      const apt = mockApartments.find((a) => a.id === r.apartment_id);
      if (!apt || apt.building_id !== buildingId) return false;
    }
    return r.status === "PENDING" || r.status === "PROCESSING";
  });

  // Tong nguoi thue dang co hop dong hieu luc
  const activeTenantIds = new Set(
    mockContracts
      .filter((c) => {
        if (c.status !== "ACTIVE") return false;
        if (buildingId) {
          const apt = mockApartments.find((a) => a.id === c.apartment_id);
          if (!apt || apt.building_id !== buildingId) return false;
        }
        return true;
      })
      .map((c) => c.tenant_id)
  );

  return {
    totalBuildings: buildings.length,
    totalApartments: apartments.length,
    rentedApartments: rentedApartments.length,
    availableApartments: availableApartments.length,
    totalTenants: activeTenantIds.size,
    monthlyRevenue,
    expiringContracts: expiringContracts.length,
    pendingMaintenance: pendingMaintenance.length,
  };
}

// Du lieu doanh thu 6 thang gan nhat (cho bieu do)
export function getMonthlyRevenueData(): MonthlyRevenue[] {
  return [
    { month: "01/2026", revenue: 180000000 },
    { month: "02/2026", revenue: 195000000 },
    { month: "03/2026", revenue: 210000000 },
    { month: "04/2026", revenue: 205000000 },
    { month: "05/2026", revenue: 225000000 },
    { month: "06/2026", revenue: 240000000 },
  ];
}

// Ty le lap day theo toa nha (cho bieu do)
export function getOccupancyData() {
  return mockBuildings.map((b) => {
    const apts = mockApartments.filter((a) => a.building_id === b.id);
    const rented = apts.filter((a) => a.status === "RENTED").length;
    const total = apts.length;
    return {
      name: b.name,
      occupied: rented,
      vacant: total - rented,
      rate: total > 0 ? Math.round((rented / total) * 100) : 0,
    };
  });
}

// Thong ke trang thai hoa don (cho bieu do)
export function getInvoiceStatusData() {
  return [
    { name: "Da thanh toan", value: 4, color: "#10B981" },
    { name: "Chua thanh toan", value: 4, color: "#F59E0B" },
    { name: "Qua han", value: 1, color: "#EF4444" },
  ];
}

// Thong ke trang thai hop dong (cho bieu do)
export function getContractStatusData() {
  const active = mockContracts.filter((c) => c.status === "ACTIVE").length;
  const ended = mockContracts.filter((c) => c.status === "ENDED").length;
  const liquidated = mockContracts.filter((c) => c.status === "LIQUIDATED").length;
  return [
    { name: "Hieu luc", value: active, color: "#10B981" },
    { name: "Ket thuc", value: ended, color: "#6B7280" },
    { name: "Thanh ly", value: liquidated, color: "#EF4444" },
  ];
}
