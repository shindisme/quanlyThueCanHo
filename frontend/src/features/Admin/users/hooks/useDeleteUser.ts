import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
}
