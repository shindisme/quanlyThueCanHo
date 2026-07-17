import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as contractService from "../../../../services/contractService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useExtendContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newEndDate }: { id: number; newEndDate: string }) =>
      contractService.extendContract(id, newEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
    },
  });
}
