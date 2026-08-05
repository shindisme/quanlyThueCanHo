import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { tenantService } from "../../../../services";

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tenantService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
    },
  });
}
