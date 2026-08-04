import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
}
