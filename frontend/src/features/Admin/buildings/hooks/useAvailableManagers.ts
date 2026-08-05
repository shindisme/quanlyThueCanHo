import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as staffService from "../../../../services/staffService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useAvailableManagers(enabled = true, currentBuildingId?: number) {
  const { data: staffList = [], isLoading: loadingStaff } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllPage(),
    enabled,
    select: (res) => res.data,
  });

  const availableManagers = useMemo(() => {
    return staffList.filter((m) => {
      const isManager = m.position === "Quản lý" || m.user?.role === "MANAGER";
      if (!isManager) return false;
      if (m.user?.role === "ADMIN") return false;
      if (!m.building_id) return true;
      if (currentBuildingId && m.building_id === currentBuildingId) return true;
      return false;
    });
  }, [staffList, currentBuildingId]);

  return {
    availableManagers,
    loadingStaff,
  };
}
