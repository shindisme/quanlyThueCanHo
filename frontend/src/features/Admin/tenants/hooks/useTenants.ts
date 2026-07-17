import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getAllTenantsPage } from "../../../../services/tenantService";

export function useTenants() {
  return useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => getAllTenantsPage(),
  });
}
