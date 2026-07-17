import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApartment } from "../../../../services/apartmentService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useCreateApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => createApartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
    },
  });
}
