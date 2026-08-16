import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { scheduleService } from "../../../../services";

export function useConfirmSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}
