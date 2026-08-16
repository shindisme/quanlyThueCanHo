import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { username?: string; role?: string; status?: string } }) =>
      authService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
