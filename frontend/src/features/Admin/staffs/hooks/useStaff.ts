import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getAllStaffsPage } from "../../../../services/staffService";

export function useStaff() {
  return useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => getAllStaffsPage(),
  });
}
