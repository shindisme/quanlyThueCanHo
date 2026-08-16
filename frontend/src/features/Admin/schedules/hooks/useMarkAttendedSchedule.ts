import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { scheduleService } from "../../../../services";

export function useMarkAttendedSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.markAttended,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}
