import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import type { Tenant } from "../../../../types";
import { tenantService } from "../../../../services";

interface UpdateTenantParams {
  id: number;
  data: Partial<Tenant>;
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateTenantParams) => tenantService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}
