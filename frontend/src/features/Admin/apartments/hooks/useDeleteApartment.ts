import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useDeleteApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apartmentService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
    },
  });
}
