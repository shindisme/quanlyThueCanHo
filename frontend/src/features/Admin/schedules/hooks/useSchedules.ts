import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getAllSchedulesPage } from "../../../../services/scheduleService";

export function useSchedules() {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULES,
    queryFn: () => getAllSchedulesPage(),
  });
}
