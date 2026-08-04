import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { staffService } from "../../../../services";

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STAFF });
    },
  });
}
