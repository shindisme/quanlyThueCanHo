export interface DashboardKPI {
  totalBuildings: number;
  totalApartments: number;
  rentedApartments: number;
  availableApartments: number;
  totalTenants: number;
  monthlyRevenue: number;
  expiringContracts: number;
  pendingMaintenance: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}
