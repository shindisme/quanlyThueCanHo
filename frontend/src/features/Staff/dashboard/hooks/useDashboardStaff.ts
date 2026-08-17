import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as apartmentService from "../../../../services/apartmentService";
import * as contractService from "../../../../services/contractService";
import * as scheduleService from "../../../../services/scheduleService";
import * as maintenanceService from "../../../../services/maintenanceService";
import * as staffService from "../../../../services/staffService";
import { parseJwt } from "../../../../utils/jwt";
import { queryKeys } from "../../../../constants/queryKeys";

export function useDashboardStaff() {
  const { email, token, role, managedBuildingId } = useAuthStore();

  const decoded = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  // Lấy thông tin staff theo userId để xác định building_id
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: queryKeys.staff.list({ scope: "staff-dashboard", userId }),
    queryFn: () => staffService.getAllPage(),
    select: (response) => response.data,
    enabled: !!userId,
  });

  const currentStaff = useMemo(() => {
    return userId && staffRes ? staffRes.find((s) => s.user_id === userId) : null;
  }, [userId, staffRes]);

  const displayName = currentStaff?.full_name || email?.split("@")[0] || "Nhân viên";

  // Xác định buildingId đang phụ trách
  const activeBuildingId = managedBuildingId || currentStaff?.building_id || undefined;

  // Query danh sách yêu cầu bảo trì theo building
  const { data: maintenanceData, isLoading: loadingMaintenance, isError: errorMaintenance } = useQuery({
    queryKey: queryKeys.maintenance.list({
      scope: "staff-dashboard",
      buildingId: activeBuildingId,
    }),
    queryFn: () =>
      maintenanceService.getAllPage({
        building_id: activeBuildingId!,
      }),
    select: (response) => response.data,
    enabled: !!activeBuildingId,
  });
  const maintenanceRequests = maintenanceData || [];

  // Query thêm dữ liệu vận hành nếu nhân viên có role khác kỹ thuật thuần
  const canLoadOperations = !!activeBuildingId && role !== "STAFF";

  const { data: apartments = [], isLoading: loadingApartments, isError: errorApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ buildingId: activeBuildingId }),
    queryFn: () => apartmentService.getAllPage({ building_id: activeBuildingId! }),
    select: (res) => res.data,
    enabled: canLoadOperations,
  });

  const { data: contracts = [], isLoading: loadingContracts, isError: errorContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ buildingId: activeBuildingId }),
    queryFn: () => contractService.getAllPage({ buildingId: activeBuildingId! }),
    select: (res) => res.data,
    enabled: canLoadOperations,
  });

  const { data: schedules = [], isLoading: loadingSchedules, isError: errorSchedules } = useQuery({
    queryKey: queryKeys.schedules.list({ buildingId: activeBuildingId }),
    queryFn: () => scheduleService.getAllPage({ building_id: activeBuildingId! }),
    select: (res) => res.data,
    enabled: canLoadOperations,
  });

  const isLoading =
    loadingStaff ||
    (!!activeBuildingId &&
      (loadingMaintenance ||
        (canLoadOperations && (loadingApartments || loadingContracts || loadingSchedules))));

  const isError =
    errorMaintenance || (canLoadOperations && (errorApartments || errorContracts || errorSchedules));

  return {
    email,
    displayName,
    managedBuildingId: activeBuildingId,
    apartments,
    contracts,
    schedules,
    maintenanceRequests,
    isLoading,
    isError,
    currentStaff,
    role,
  };
}
