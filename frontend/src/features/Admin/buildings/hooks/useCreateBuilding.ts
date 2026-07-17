import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBuilding } from "../../../../services/buildingService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => createBuilding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUILDINGS });
    },
  });
}
