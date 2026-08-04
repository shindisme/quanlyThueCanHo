import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { scheduleService } from "../../../../services";

export function useSchedules() {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULES,
    queryFn: () => scheduleService.getAllPage(),
  });
}
