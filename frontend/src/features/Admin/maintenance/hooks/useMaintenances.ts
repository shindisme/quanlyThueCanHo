import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import * as maintenanceService from "../../../../services/maintenanceService";
import { useAuthStore } from "../../../../stores/auth.store";

interface UseMaintenancesParams {
  statusFilter?: string;
  priorityFilter?: string;
  buildingFilter?: string;
}

export function useMaintenances(filters: UseMaintenancesParams = {}) {
  const { token, role, managedBuildingId } = useAuthStore();
  const { statusFilter, priorityFilter, buildingFilter } = filters;

  return useQuery({
    queryKey: [QUERY_KEYS.MAINTENANCE[0], statusFilter, priorityFilter, buildingFilter, role, managedBuildingId],
    queryFn: () => {
      const params: Parameters<typeof maintenanceService.getAll>[0] = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      if (role === "MANAGER" && managedBuildingId) {
        params.building_id = managedBuildingId;
      } else if (buildingFilter) {
        params.building_id = Number(buildingFilter);
      }
      return maintenanceService.getAll(params);
    },
    enabled: !!token,
    select: (res) => res.data || [],
  });
}
