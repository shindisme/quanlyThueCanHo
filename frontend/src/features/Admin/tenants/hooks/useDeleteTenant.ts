import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { tenantService } from "../../../../services/tenantService";

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tenantService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
    },
  });
}
