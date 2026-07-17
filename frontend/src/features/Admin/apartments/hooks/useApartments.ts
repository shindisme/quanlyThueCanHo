import { useQuery } from "@tanstack/react-query";
import { getAllApartmentsPage } from "../../../../services/apartmentService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useApartments() {
  return useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => getAllApartmentsPage(),
  });
}
