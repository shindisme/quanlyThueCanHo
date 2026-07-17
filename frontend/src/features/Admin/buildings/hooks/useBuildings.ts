import { useQuery } from "@tanstack/react-query";
import { getAllBuildingsPage } from "../../../../services/buildingService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useBuildings() {
  return useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => getAllBuildingsPage(),
  });
}
