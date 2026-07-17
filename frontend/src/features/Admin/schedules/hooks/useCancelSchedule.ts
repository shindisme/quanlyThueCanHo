import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { cancelSchedule } from "../../../../services/scheduleService";

export function useCancelSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULES });
    },
  });
}
