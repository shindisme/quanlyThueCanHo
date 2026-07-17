import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../../../services/authService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { username?: string; role?: string; status?: string } }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
}
