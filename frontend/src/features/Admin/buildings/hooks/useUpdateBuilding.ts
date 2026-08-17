import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import type { BuildingModifyFormValues } from "../../../../schemas/building.schema";
import { buildingService } from "../../../../services";
import { geocodeBuildingAddress } from "../../../../utils/locationSearch";

interface UpdateBuildingParams {
  id: number;
  data: BuildingModifyFormValues;
  image?: File | null;
  removeImage?: boolean;
  originalAddress: string;
  originalLatitude: number | null;
  originalLongitude: number | null;
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      image,
      removeImage,
      originalAddress,
      originalLatitude,
      originalLongitude,
    }: UpdateBuildingParams) => {
      const addressChanged = data.address.trim() !== originalAddress.trim();
      const needsCoordinates = addressChanged
        || originalLatitude === null
        || originalLongitude === null;
      const location = needsCoordinates
        ? await geocodeBuildingAddress(
            data.address.trim(),
            import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
          )
        : null;
      const payload = {
        ...data,
        ...(needsCoordinates
          ? {
              latitude: location?.isInServiceArea ? location.coordinates.latitude : null,
              longitude: location?.isInServiceArea ? location.coordinates.longitude : null,
            }
          : {}),
        ...(removeImage ? { remove_thumbnail: true } : {}),
      };

      if (image) {
        const fd = new FormData();
        if (payload.branch_name) fd.append("branch_name", payload.branch_name);
        if (payload.address) fd.append("address", payload.address);
        if ("latitude" in payload) fd.append("latitude", String(payload.latitude));
        if ("longitude" in payload) fd.append("longitude", String(payload.longitude));
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
        return buildingService.update(id, fd);
      } else {
        return buildingService.update(id, payload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
    },
  });
}
