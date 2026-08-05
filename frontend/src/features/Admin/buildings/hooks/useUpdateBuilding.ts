import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBuilding } from "../../../../services/buildingService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import type { BuildingModifyFormValues } from "../../../../schemas/building.schema";

interface UpdateBuildingParams {
  id: number;
  data: BuildingModifyFormValues;
  image?: File | null;
  removeImage?: boolean;
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, image, removeImage }: UpdateBuildingParams) => {
      const payload = {
        ...data,
        ...(removeImage ? { remove_thumbnail: true } : {}),
      };

      if (image) {
        const fd = new FormData();
        if (payload.branch_name) fd.append("branch_name", payload.branch_name);
        if (payload.address) fd.append("address", payload.address);
        if (payload.total_floors) fd.append("total_floors", String(payload.total_floors));
        if (payload.status) fd.append("status", payload.status);
        if (payload.description !== undefined && payload.description !== null) {
          fd.append("description", payload.description);
        }
        if (payload.staff_id) {
          fd.append("staff_id", String(payload.staff_id));
        }
        if (removeImage) {
          fd.append("remove_thumbnail", "true");
        }
        fd.append("image", image);
        await updateBuilding(id, fd);
      } else {
        await updateBuilding(id, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUILDINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
    },
  });
}
