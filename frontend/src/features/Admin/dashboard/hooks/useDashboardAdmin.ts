import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import * as contractService from "../../../../services/contractService";
import * as invoiceService from "../../../../services/invoiceService";

export function useDashboardAdmin() {
  const { email } = useAuthStore();
  const storedName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;
  const displayName = storedName || "Quản trị viên";

  const [selectedBranch, setSelectedBranch] = useState("");
  const [timeFrame, setTimeFrame] = useState<"month" | "year">("month");

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartmentsPage(),
    select: (res) => res.data,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContractsPage(),
    select: (res) => res.data,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoicesPage(),
    select: (res) => res.data,
  });

  const isLoading = loadingBuildings || loadingApartments || loadingContracts || loadingInvoices;

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const branchId = selectedBranch ? Number(selectedBranch) : null;

  const filteredBuildings = branchId ? buildings.filter((b) => b.id === branchId) : buildings;
  const filteredApartments = branchId ? apartments.filter((a) => a.building_id === branchId) : apartments;
  const filteredInvoices = branchId
    ? invoices.filter((inv) => inv.contract?.apartment?.building_id === branchId)
    : invoices;

  const totalBuildingsCount = filteredBuildings.length;

  const totalApartmentsCount = filteredBuildings.reduce((sum: number, b) => sum + (b.total_apartments || b._count?.apartments || 0), 0);

  const activeContractsForExpiration = contracts.filter((c) => {
    return !branchId || filteredApartments.some((a) => a.id === c.apartment_id);
  });

  const activeContracts = activeContractsForExpiration.filter((c) => c.status === "ACTIVE");

  const buildingTenantIds = new Set(activeContracts.map((c) => c.tenant_id));
  const activeTenantsCount = buildingTenantIds.size;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentMonthPaidInvoices = filteredInvoices.filter((inv) => {
    if (inv.status !== "PAID") return false;
    const date = new Date(inv.paid_at || inv.created_at);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyRevenue = currentMonthPaidInvoices.reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const monthlyRevenueData = months.map((m, index) => {
    const monthVal = index + 1;
    const revenue = filteredInvoices.filter((inv) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear;
    }).reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

    const lastYear = filteredInvoices.filter((inv) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear - 1;
    }).reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

    return {
      name: m,
      "Doanh thu": revenue,
      "Năm trước": lastYear,
    };
  });

  const yearlyRevenueData = [currentYear - 2, currentYear - 1, currentYear].map(yr => {
    const revenue = filteredInvoices.filter((inv) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getFullYear() === yr;
    }).reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

    return {
      name: String(yr),
      "Doanh thu": revenue,
    };
  });

  const chartData = timeFrame === "month" ? monthlyRevenueData : yearlyRevenueData;

  const rentedCount = filteredApartments.filter((a) => a.status === "RENTED").length;
  const availableCount = filteredApartments.filter((a) => a.status === "AVAILABLE").length;
  const maintenanceCount = filteredApartments.filter((a) => a.status === "MAINTENANCE").length;

  const roomStatusData = [
    { name: "Đang thuê", value: rentedCount, color: "#10B981" },
    { name: "Trống", value: availableCount, color: "#3B82F6" },
    { name: "Bảo trì", value: maintenanceCount, color: "#F59E0B" },
  ];

  const now = new Date();
  const getBoundaryDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };
  const time30Days = getBoundaryDate(30);
  const time60Days = getBoundaryDate(60);
  const time90Days = getBoundaryDate(90);

  const expiredContractsCount = activeContractsForExpiration.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    return new Date(c.end_date) < now;
  }).length;

  const expiring30DaysCount = activeContractsForExpiration.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= time30Days;
  }).length;

  const expiring60DaysCount = activeContractsForExpiration.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    const endDate = new Date(c.end_date);
    return endDate > time30Days && endDate <= time60Days;
  }).length;

  const expiring90DaysCount = activeContractsForExpiration.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    const endDate = new Date(c.end_date);
    return endDate > time60Days && endDate <= time90Days;
  }).length;

  const branchOptions = [
    { value: "", label: "Tất cả chi nhánh" },
    ...buildings.map((b) => ({
      value: String(b.id),
      label: b.branch_name
    }))
  ];

  return {
    email,
    displayName,
    buildings,
    isLoading,
    selectedBranch,
    setSelectedBranch,
    timeFrame,
    setTimeFrame,
    today,
    totalBuildingsCount,
    totalApartmentsCount,
    activeTenantsCount,
    monthlyRevenue,
    chartData,
    roomStatusData,
    expiredContractsCount,
    expiring30DaysCount,
    expiring60DaysCount,
    expiring90DaysCount,
    branchOptions,
    currentYear
  };
}
