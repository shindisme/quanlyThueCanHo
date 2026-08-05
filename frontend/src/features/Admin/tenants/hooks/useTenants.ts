import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { tenantService } from "../../../../services";

export function useTenants() {
  return useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllPage(),
  });
}
