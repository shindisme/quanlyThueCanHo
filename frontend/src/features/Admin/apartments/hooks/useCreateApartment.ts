import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useCreateApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => apartmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
    },
  });
}
