import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { staffService } from "../../../../services";

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
