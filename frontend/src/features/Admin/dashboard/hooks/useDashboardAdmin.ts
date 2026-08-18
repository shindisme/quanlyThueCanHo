import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import * as contractService from "../../../../services/contractService";
import * as invoiceService from "../../../../services/invoiceService";
import { queryKeys } from "../../../../constants/queryKeys";
import { getInvoiceType } from "../../../../utils/invoiceDisplay";

export function useDashboardAdmin() {
  const { email } = useAuthStore();
  const storedName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;
  const displayName = storedName || "Quản trị viên";

  const [selectedBranch, setSelectedBranch] = useState("");
  const [timeFrame, setTimeFrame] = useState<"month" | "year">("month");

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: queryKeys.apartments.all,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: queryKeys.contracts.all,
    queryFn: () => contractService.getAllPage(),
    select: (res) => res.data || [],
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: () => invoiceService.getAllPage(),
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

  // Tổng số lượng tòa nhà và căn hộ
  const totalBuildingsCount = filteredBuildings.length;
  const totalApartmentsCount = filteredApartments.length > 0
    ? filteredApartments.length
    : filteredBuildings.reduce((sum: number, b) => sum + (b.total_apartments || b._count?.apartments || 0), 0);

  const activeContractsForExpiration = contracts.filter((c) => {
    return !branchId || filteredApartments.some((a) => a.id === c.apartment_id);
  });

  const activeContracts = activeContractsForExpiration.filter((c) => c.status === "ACTIVE");

  const buildingTenantIds = new Set(activeContracts.map((c) => c.tenant_id));
  const activeTenantsCount = buildingTenantIds.size;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Doanh thu thực nhận tháng hiện tại
  const currentMonthPaidInvoices = filteredInvoices.filter((inv) => {
    if (inv.status !== "PAID") return false;
    const date = new Date(inv.paid_at || inv.created_at);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyRevenue = currentMonthPaidInvoices.reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

  // Tiền chưa thu vs số hóa đơn chưa thanh toán
  const settledContractIds = new Set(
    filteredInvoices
      .filter((inv) => getInvoiceType(inv) === "FINAL_SETTLEMENT" && inv.contract_id !== null)
      .map((inv) => inv.contract_id)
  );
  const unpaidInvoices = filteredInvoices.filter((inv) => {
    const invoiceType = getInvoiceType(inv);
    const isCoveredBySettlement = inv.contract_id !== null
      && invoiceType !== "FINAL_SETTLEMENT"
      && invoiceType !== "REFUND"
      && settledContractIds.has(inv.contract_id);

    return inv.status === "UNPAID"
      && invoiceType !== "REFUND"
      && !isCoveredBySettlement;
  });
  const unpaidRevenue = unpaidInvoices.reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);
  const unpaidInvoicesCount = unpaidInvoices.length;

  // Tỷ lệ lấp đầy
  const rentedCount = filteredApartments.filter((a) => a.status === "RENTED").length;
  const availableCount = filteredApartments.filter((a) => a.status === "AVAILABLE").length;
  const maintenanceCount = filteredApartments.filter((a) => a.status === "MAINTENANCE").length;

  const occupancyRate = totalApartmentsCount > 0
    ? Number(((rentedCount / totalApartmentsCount) * 100).toFixed(1))
    : 0;

  // Thống kê xu hướng tăng giảm doanh thu so với tháng trước
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const previousMonthPaidInvoices = filteredInvoices.filter((inv) => {
    if (inv.status !== "PAID") return false;
    const date = new Date(inv.paid_at || inv.created_at);
    return date.getMonth() + 1 === lastMonth && date.getFullYear() === lastMonthYear;
  });

  const previousMonthRevenue = previousMonthPaidInvoices.reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

  let revenueTrend: "up" | "down" | undefined = undefined;
  let revenueTrendValue: string | undefined = undefined;

  if (previousMonthRevenue > 0) {
    const diff = monthlyRevenue - previousMonthRevenue;
    const pct = Math.abs(Number(((diff / previousMonthRevenue) * 100).toFixed(1)));
    revenueTrend = diff >= 0 ? "up" : "down";
    revenueTrendValue = `${diff >= 0 ? "+" : "-"}${pct}% so với tháng trước`;
  } else if (monthlyRevenue > 0) {
    revenueTrend = "up";
    revenueTrendValue = "+100% so với tháng trước";
  }

  // Dữ liệu biểu đồ doanh thu 12 tháng
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const monthlyRevenueData = months.map((m, index) => {
    const monthVal = index + 1;
    const monthPaidInvoices = filteredInvoices.filter((inv) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear;
    });

    const revenue = monthPaidInvoices.reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

    const lastYearRevenue = filteredInvoices.filter((inv) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear - 1;
    }).reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

    return {
      name: m,
      "Doanh thu": revenue,
      "Năm trước": lastYearRevenue,
      invoiceCount: monthPaidInvoices.length,
    };
  });

  const yearlyRevenueData = [currentYear - 2, currentYear - 1, currentYear].map((yr) => {
    const yrPaidInvoices = filteredInvoices.filter((inv) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getFullYear() === yr;
    });

    const revenue = yrPaidInvoices.reduce((sum: number, inv) => sum + Number(inv.total_amount), 0);

    return {
      name: String(yr),
      "Doanh thu": revenue,
      invoiceCount: yrPaidInvoices.length,
    };
  });

  const chartData = timeFrame === "month" ? monthlyRevenueData : yearlyRevenueData;

  // Dữ liệu trạng thái căn hộ
  const roomStatusData = [
    {
      name: "Đang thuê",
      value: rentedCount,
      percentage: totalApartmentsCount > 0 ? Math.round((rentedCount / totalApartmentsCount) * 100) : 0,
      color: "#10B981",
    },
    {
      name: "Trống",
      value: availableCount,
      percentage: totalApartmentsCount > 0 ? Math.round((availableCount / totalApartmentsCount) * 100) : 0,
      color: "#3B82F6",
    },
    {
      name: "Bảo trì",
      value: maintenanceCount,
      percentage: totalApartmentsCount > 0 ? Math.round((maintenanceCount / totalApartmentsCount) * 100) : 0,
      color: "#F59E0B",
    },
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
      label: b.branch_name,
    })),
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
    unpaidRevenue,
    unpaidInvoicesCount,
    occupancyRate,
    revenueTrend,
    revenueTrendValue,
    rentedCount,
    availableCount,
    maintenanceCount,
    chartData,
    roomStatusData,
    expiredContractsCount,
    expiring30DaysCount,
    expiring60DaysCount,
    expiring90DaysCount,
    branchOptions,
    currentYear,
  };
}
