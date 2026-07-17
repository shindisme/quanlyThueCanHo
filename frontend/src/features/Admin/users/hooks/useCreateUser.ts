import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../../../../services/authService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
}
