import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { buildingService } from "../../../../services";

export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buildingService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
  });
}
