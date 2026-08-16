import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../../../../constants/queryKeys";

interface MaintenanceMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage: string;
  errorMessage: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  additionalInvalidateKeys?: readonly string[][];
}

export function useMaintenanceMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  successMessage,
  errorMessage,
  onSuccess,
  additionalInvalidateKeys = [],
}: MaintenanceMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      for (const key of additionalInvalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      if (onSuccess) onSuccess(data, variables);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || errorMessage);
    },
  });
}
