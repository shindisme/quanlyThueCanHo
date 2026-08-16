import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";


interface UpdateApartmentParams {
  id: number;
  data: FormData;
}

export function useUpdateApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateApartmentParams) => apartmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
    },
  });
}
