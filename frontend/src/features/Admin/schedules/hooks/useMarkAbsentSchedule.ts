import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { scheduleService } from "../../../../services";

export function useMarkAbsentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.markAbsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULES });
    },
  });
}
