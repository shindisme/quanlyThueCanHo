import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { scheduleService } from "../../../../services";

export function useConfirmSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULES });
    },
  });
}
