import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { staffService } from "../../../../services";

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STAFF });
    },
  });
}
