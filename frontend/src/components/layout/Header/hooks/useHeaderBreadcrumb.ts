import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { formatApartmentDisplay } from "../../../../utils/string";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  buildings: "Tòa nhà",
  apartments: "Căn hộ",
  tenants: "Người thuê",
  staff: "Nhân viên",
  contracts: "Hợp đồng",
  invoices: "Hóa đơn",
  payments: "Thanh toán",
  maintenance: "Sửa chữa",
  schedules: "Lịch xem phòng",
  utilities: "Điện nước",
  notifications: "Thông báo",
  users: "Tài khoản",
  reports: "Báo cáo",
  settings: "Cài đặt",
  profile: "Hồ sơ",
  home: "Trang chủ",
};

export function useHeaderBreadcrumb(): string[] | null {
  const location = useLocation();
  const { role } = useAuthStore();
  const parts = location.pathname.split("/").filter(Boolean);

  const isBuildingDetail = location.pathname.includes("/buildings/") && parts.length > 2;
  const isApartmentDetail = location.pathname.includes("/apartments/") && parts.length > 2;

  const targetBuildingId = isBuildingDetail ? Number(parts[parts.length - 1]) : null;
  const targetApartmentId = isApartmentDetail ? Number(parts[parts.length - 1]) : null;

  const { data: dynamicBuildingName } = useQuery({
    queryKey: ["breadcrumb-building", targetBuildingId],
    queryFn: async () => {
      if (!targetBuildingId || isNaN(targetBuildingId)) return null;
      const b = await buildingService.getById(targetBuildingId);
      return b ? b.branch_name : null;
    },
    enabled: !!targetBuildingId && !isNaN(targetBuildingId),
    staleTime: 600000,
  });

  const { data: dynamicApartmentName } = useQuery({
    queryKey: ["breadcrumb-apartment", targetApartmentId, role],
    queryFn: async () => {
      if (!targetApartmentId || isNaN(targetApartmentId)) return null;
      const apt = await apartmentService.getById(targetApartmentId);
      if (!apt) return null;
      return formatApartmentDisplay(
        apt.room_number,
        apt.floor,
        role || undefined,
        apt.building?.branch_name
      );
    },
    enabled: !!targetApartmentId && !isNaN(targetApartmentId),
    staleTime: 600000,
  });

  if (parts.length <= 1) return null;

  return parts.slice(1).map((p) => {
    if (location.pathname.includes("/buildings/") && !isNaN(Number(p))) {
      return dynamicBuildingName || p;
    }
    if (location.pathname.includes("/apartments/") && !isNaN(Number(p))) {
      return dynamicApartmentName || p;
    }
    return BREADCRUMB_LABELS[p] || p;
  });
}
