import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { buildingService } from "../../../../services";
import { geocodeBuildingAddress } from "../../../../utils/locationSearch";

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const address = data.get("address");
      if (typeof address === "string") {
        const location = await geocodeBuildingAddress(
          address,
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
        );
        if (location?.isInServiceArea) {
          data.set("latitude", String(location.coordinates.latitude));
          data.set("longitude", String(location.coordinates.longitude));
        }
      }

      return buildingService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
  });
}
