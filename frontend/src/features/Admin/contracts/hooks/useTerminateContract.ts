import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as contractService from "../../../../services/contractService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useTerminateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, endDate }: { id: number; endDate?: string }) =>
      contractService.terminateContract(id, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
    },
  });
}
