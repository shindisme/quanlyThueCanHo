import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useApartments() {
  return useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data,
  });
}
