import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useCreateApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => apartmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
    },
  });
}
