import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBuilding } from "../../../../services/buildingService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUILDINGS });
    },
  });
}
