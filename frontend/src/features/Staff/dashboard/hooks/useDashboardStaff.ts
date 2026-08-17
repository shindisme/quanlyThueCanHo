import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import * as maintenanceService from "../../../../services/maintenanceService";
import * as staffService from "../../../../services/staffService";
import { useAuthStore } from "../../../../stores/auth.store";
import { parseJwt } from "../../../../utils/jwt";

export function useDashboardStaff() {
  const { email, token, managedBuildingId } = useAuthStore();
  const decoded = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const userId = decoded?.userId ?? decoded?.sub;
  const numericUserId = userId === undefined ? null : Number(userId);

  const { data: staff = [], isLoading: loadingStaff, isError: errorStaff } = useQuery({
    queryKey: queryKeys.staff.list({ scope: "staff-dashboard", userId: numericUserId }),
    queryFn: () => staffService.getAllPage(),
    select: (response) => response.data,
    enabled: Number.isSafeInteger(numericUserId),
  });

  const currentStaff = useMemo(
    () => staff.find((item) => item.user_id === numericUserId) ?? null,
    [numericUserId, staff]
  );
  const buildingId = managedBuildingId ?? currentStaff?.building_id ?? undefined;

  const {
    data: maintenanceData,
    isLoading: loadingMaintenance,
    isError: errorMaintenance,
  } = useQuery({
    queryKey: queryKeys.maintenance.list({ scope: "staff-dashboard", buildingId }),
    queryFn: () => maintenanceService.getAllPage({ building_id: buildingId! }),
    select: (response) => response.data,
    enabled: Boolean(buildingId),
  });
  const maintenanceRequests = useMemo(() => maintenanceData ?? [], [maintenanceData]);

  return {
    displayName: currentStaff?.full_name || email?.split("@")[0] || "Nhân viên",
    currentStaff,
    maintenanceRequests,
    isLoading: loadingStaff || (Boolean(buildingId) && loadingMaintenance),
    isError: errorStaff || errorMaintenance,
  };
}
