import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as contractTerminationService from "../../../../services/contractTerminationService";
import { queryKeys } from "../../../../constants/queryKeys";
import { getApiErrorMessage } from "../../../../utils/apiError";

export function useCreateContractTermination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contractTerminationService.createTenantRequest,
    onSuccess: () => {
      toast.success("Gửi yêu cầu trả phòng thành công! Ban quản lý sẽ xử lý yêu cầu của bạn.");
      queryClient.invalidateQueries({ queryKey: queryKeys.terminations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi yêu cầu trả phòng."));
    },
  });
}

export function useCancelContractTermination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contractTerminationService.cancel,
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu trả phòng.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.terminations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể hủy yêu cầu trả phòng."));
    },
  });
}
