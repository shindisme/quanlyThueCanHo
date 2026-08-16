import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
