import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as contractService from "../../../../services/contractService";
import { queryKeys } from "../../../../constants/queryKeys";

export function useExtendContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newEndDate }: { id: number; newEndDate: string }) =>
      contractService.extend(id, newEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
  });
}
