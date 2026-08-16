import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
