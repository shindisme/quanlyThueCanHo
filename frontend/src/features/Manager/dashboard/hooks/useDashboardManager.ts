import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as apartmentService from "../../../../services/apartmentService";
import * as contractService from "../../../../services/contractService";
import * as scheduleService from "../../../../services/scheduleService";
import * as invoiceService from "../../../../services/invoiceService";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import * as maintenanceService from "../../../../services/maintenanceService";
import { parseJwt } from "../../../../utils/jwt";
import { queryKeys } from "../../../../constants/queryKeys";
import {
  calculateRevenueStats,
  calculateContractExpirations,
  calculateRoomStatusData,
} from "../utils/dashboardHelpers";
import type { Priority } from "../../../../constants";

export function useDashboardManager() {
  const { email, token, role, managedBuildingId, managedBuildingName, setAuth } = useAuthStore();
  const [timeFrame, setTimeFrame] = useState<"month" | "year">("month");

  const decoded = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  // Lấy thông tin staff hiện tại
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: queryKeys.staff.list({ scope: "manager-dashboard", userId }),
    queryFn: () => staffService.getAllPage(),
    select: (response) => response.data,
    enabled: !!userId,
  });

  const currentStaff = useMemo(() => {
    return userId && staffRes ? staffRes.find((s) => s.user_id === userId) : null;
  }, [userId, staffRes]);

  const displayName = currentStaff?.full_name || email?.split("@")[0] || "Quản lý";

  // Query buildings
  const { data: buildings = [] } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    enabled: !!currentStaff?.building_id && (!managedBuildingId || !managedBuildingName),
    select: (res) => res.data,
  });

  useEffect(() => {
    if (currentStaff?.building_id && (!managedBuildingId || !managedBuildingName)) {
      const currentBld = buildings.find((b) => b.id === currentStaff.building_id);
      if (currentBld && role && email) {
        setAuth(token, role, email, currentStaff.building_id, currentBld.branch_name);
      }
    }
  }, [currentStaff, buildings, managedBuildingId, managedBuildingName, role, email, token, setAuth]);

  const activeBuildingId = managedBuildingId || currentStaff?.building_id || undefined;

  // Query dữ liệu căn hộ
  const { data: apartments = [], isLoading: loadingApartments, isError: errorApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ buildingId: activeBuildingId }),
    queryFn: () => apartmentService.getAllPage({ building_id: activeBuildingId! }),
    select: (res) => res.data,
    enabled: !!activeBuildingId,
  });

  // Query dữ liệu hợp đồng
  const { data: contracts = [], isLoading: loadingContracts, isError: errorContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ buildingId: activeBuildingId }),
    queryFn: () => contractService.getAllPage({ buildingId: activeBuildingId! }),
    select: (res) => res.data,
    enabled: !!activeBuildingId,
  });

  // Query dữ liệu lịch xem phòng
  const { data: schedules = [], isLoading: loadingSchedules, isError: errorSchedules } = useQuery({
    queryKey: queryKeys.schedules.list({ buildingId: activeBuildingId }),
    queryFn: () => scheduleService.getAllPage({ building_id: activeBuildingId! }),
    select: (res) => res.data,
    enabled: !!activeBuildingId,
  });

  // Query dữ liệu hóa đơn
  const { data: invoices = [], isLoading: loadingInvoices, isError: errorInvoices } = useQuery({
    queryKey: queryKeys.invoices.list({ buildingId: activeBuildingId }),
    queryFn: () => invoiceService.getAllPage({ building_id: activeBuildingId! }),
    select: (res) => res.data,
    enabled: !!activeBuildingId,
  });

  // Query dữ liệu yêu cầu bảo trì
  const { data: maintenanceData, isLoading: loadingMaintenance, isError: errorMaintenance } = useQuery({
    queryKey: queryKeys.maintenance.list({ buildingId: activeBuildingId }),
    queryFn: () => maintenanceService.getAllPage({ building_id: activeBuildingId! }),
    select: (response) => response.data,
    enabled: !!activeBuildingId,
  });
  const maintenanceRequests = useMemo(() => maintenanceData ?? [], [maintenanceData]);

  const isLoading =
    loadingStaff ||
    (!!activeBuildingId &&
      (loadingApartments || loadingContracts || loadingSchedules || loadingInvoices || loadingMaintenance));

  const isError =
    errorApartments || errorContracts || errorSchedules || errorInvoices || errorMaintenance;

  // Thời gian hiện tại
  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth(); // 0..11
  const currentYear = now.getFullYear();

  const today = useMemo(() => {
    return now.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  // Thống kê trạng thái phòng
  const totalApartmentsCount = apartments.length;
  const rentedCount = useMemo(() => apartments.filter((a) => a.status === "RENTED").length, [apartments]);
  const availableCount = useMemo(() => apartments.filter((a) => a.status === "AVAILABLE").length, [apartments]);
  const maintenanceCount = useMemo(() => apartments.filter((a) => a.status === "MAINTENANCE").length, [apartments]);

  const { roomStatusData, occupancyRate } = useMemo(() => {
    return calculateRoomStatusData(rentedCount, availableCount, maintenanceCount, totalApartmentsCount);
  }, [rentedCount, availableCount, maintenanceCount, totalApartmentsCount]);

  // Hợp đồng còn hiệu lực trong building
  const apartmentIds = useMemo(() => new Set(apartments.map((a) => a.id)), [apartments]);
  const buildingContracts = useMemo(() => {
    return contracts.filter((c) => c.status === "ACTIVE" && apartmentIds.has(c.apartment_id));
  }, [contracts, apartmentIds]);

  const activeTenantsCount = useMemo(() => {
    return new Set(buildingContracts.map((c) => c.tenant_id)).size;
  }, [buildingContracts]);

  // Thống kê thời hạn hợp đồng (30, 60, 90 ngày)
  const contractExpirations = useMemo(() => {
    return calculateContractExpirations(buildingContracts, now);
  }, [buildingContracts, now]);

  const revenueStats = useMemo(() => {
    return calculateRevenueStats(invoices, currentYear, currentMonth);
  }, [invoices, currentYear, currentMonth]);

  const chartData = timeFrame === "month" ? revenueStats.monthly : revenueStats.yearly;

  // Thống kê lịch xem phòng
  const pendingSchedulesCount = useMemo(() => schedules.filter((s) => s.status === "PENDING").length, [schedules]);
  const recentPendingSchedules = useMemo(() => {
    return [...schedules]
      .sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (b.status === "PENDING" && a.status !== "PENDING") return 1;
        return new Date(b.created_at || b.schedule_time).getTime() - new Date(a.created_at || a.schedule_time).getTime();
      })
      .slice(0, 5);
  }, [schedules]);

  // Thống kê sự cố bảo trì cần xử lý
  const pendingMaintenanceRequests = useMemo(() => {
    return maintenanceRequests.filter(
      (r) => r.status === "PENDING" || r.status === "PROCESSING" || r.status === "NEEDS_RESCHEDULE"
    ).length;
  }, [maintenanceRequests]);

  const unresolvedMaintenance = useMemo(() => {
    const priorityRank: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return maintenanceRequests
      .filter((r) => r.status === "PENDING" || r.status === "PROCESSING" || r.status === "NEEDS_RESCHEDULE")
      .sort((a, b) => {
        const pDiff = (priorityRank[b.priority as Priority] || 0) - (priorityRank[a.priority as Priority] || 0);
        if (pDiff !== 0) return pDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5);
  }, [maintenanceRequests]);

  // Danh sách nhiệm vụ vận hành chi nhánh
  const upcomingTasks = useMemo(() => [
    {
      id: "expiring",
      text: `Kiểm tra căn hộ sắp hết hạn (${contractExpirations.expiring30Count} HĐ)`,
      time: "Tuần này",
      urgent: contractExpirations.expiring30Count > 0,
    },
    {
      id: "schedules",
      text: `Xử lý lịch hẹn xem phòng (${pendingSchedulesCount} lịch chờ duyệt)`,
      time: "Hôm nay",
      urgent: pendingSchedulesCount > 0,
    },
    {
      id: "maintenance",
      text: `Yêu cầu sửa chữa cần xử lý (${pendingMaintenanceRequests} sự cố)`,
      time: "Hôm nay",
      urgent: pendingMaintenanceRequests > 0,
    },
    {
      id: "readings",
      text: "Ghi nhận chỉ số điện nước định kỳ cuối tháng",
      time: "Hàng tháng",
      urgent: false,
    },
  ], [contractExpirations.expiring30Count, pendingSchedulesCount, pendingMaintenanceRequests]);

  const hasAlerts =
    contractExpirations.expiring30Count > 0 ||
    revenueStats.unpaidInvoicesCount > 0 ||
    maintenanceCount > 0 ||
    pendingSchedulesCount > 0 ||
    pendingMaintenanceRequests > 0;

  return {
    email,
    displayName,
    managedBuildingName,
    managedBuildingId: activeBuildingId,
    apartments,
    contracts,
    schedules,
    invoices,
    maintenanceRequests,
    isLoading,
    isError,
    today,
    timeFrame,
    setTimeFrame,
    currentYear,
    totalApartmentsCount,
    rentedCount,
    availableCount,
    maintenanceCount,
    occupancyRate,
    roomStatusData,
    activeTenantsCount,
    contractExpirations,
    revenueStats,
    chartData,
    pendingSchedulesCount,
    recentPendingSchedules,
    pendingMaintenanceRequests,
    unresolvedMaintenance,
    upcomingTasks,
    hasAlerts,
  };
}
