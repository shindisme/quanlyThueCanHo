import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { staffService } from "../../../../services";

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: () => staffService.getAllPage(),
  });
}
