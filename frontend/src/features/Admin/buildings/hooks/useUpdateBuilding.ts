import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBuilding } from "../../../../services/buildingService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

interface UpdateBuildingParams {
  id: number;
  data: Record<string, any>;
  image: File | null;
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, image }: UpdateBuildingParams) => {
      const payload = { ...data };
      delete payload.name;
      await updateBuilding(id, payload);
      if (image) {
        const fd = new FormData();
        fd.append("image", image);
        await updateBuilding(id, fd);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUILDINGS });
    },
  });
}
