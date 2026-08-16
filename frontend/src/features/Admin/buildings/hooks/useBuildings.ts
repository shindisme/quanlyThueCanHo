import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { buildingService } from "../../../../services";

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });
}
