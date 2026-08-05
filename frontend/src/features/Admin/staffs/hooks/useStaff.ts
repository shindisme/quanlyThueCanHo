import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { staffService } from "../../../../services";

export function useStaff() {
  return useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllPage(),
  });
}
