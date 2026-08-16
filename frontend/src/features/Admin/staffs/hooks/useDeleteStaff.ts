import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { staffService } from "../../../../services";

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
