import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { apartmentService } from "../../../../services";

export function useApartments() {
  return useQuery({
    queryKey: queryKeys.apartments.all,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data,
  });
}
