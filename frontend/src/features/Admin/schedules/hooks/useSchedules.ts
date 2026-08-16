import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { scheduleService } from "../../../../services";

export function useSchedules() {
  return useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: () => scheduleService.getAllPage(),
  });
}
