import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { buildingService } from "../../../../services";

export function useBuildings() {
  return useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });
}
