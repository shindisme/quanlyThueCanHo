import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { tenantService } from "../../../../services";

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants.all,
    queryFn: () => tenantService.getAllPage(),
  });
}
