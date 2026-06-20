import type { DashboardKPI, MonthlyRevenue } from "../types";
export function getDashboardKPI(buildingId?: number): DashboardKPI {
  return {
    totalBuildings: 0,
    totalApartments: 0,
    rentedApartments: 0,
    availableApartments: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    expiringContracts: 0,
    pendingMaintenance: 0,
  };
}
export function getMonthlyRevenueData(): MonthlyRevenue[] {
  return [];
}
export function getOccupancyData() {
  return [];
}
export function getInvoiceStatusData() {
  return [];
}
export function getContractStatusData() {
  return [];
}