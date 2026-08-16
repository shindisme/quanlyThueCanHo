import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { buildingService } from "../../../../services";

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => buildingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
  });
}
