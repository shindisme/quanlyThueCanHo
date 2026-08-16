import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as tenantService from "../../../../services/tenantService";
import type { TenantOccupant } from "../../../../types";
import { queryKeys } from "../../../../constants/queryKeys";

function toOccupant(occupant: TenantOccupant) {
  return {
    id: occupant.id,
    name: occupant.full_name,
    cccd: occupant.citizen_id,
    dob: occupant.date_of_birth?.slice(0, 10) || "",
    phone: occupant.phone || "",
  };
}

export function useTenantOccupants() {
  const { token } = useAuthStore();

  const { data: occupantData = [], isLoading: loadingOccupants } = useQuery({
    queryKey: queryKeys.occupants.tenantList(),
    queryFn: tenantService.getMyOccupants,
    enabled: !!token,
  });

  const occupants = useMemo(
    () => occupantData.map(toOccupant),
    [occupantData]
  );

  return {
    occupants,
    loadingOccupants,
  };
}
