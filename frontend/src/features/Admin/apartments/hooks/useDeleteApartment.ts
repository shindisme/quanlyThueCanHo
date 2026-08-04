import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useDeleteApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apartmentService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
    },
  });
}
