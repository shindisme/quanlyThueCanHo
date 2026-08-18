import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewService } from "../../../../services";
import { queryKeys } from "../../../../constants/queryKeys";
import { useAuthStore } from "../../../../stores/auth.store";
import { getApiErrorMessage } from "../../../../utils/apiError";
import type { MyReviewData } from "../../../../types";

export function useMyReviews() {
  const { token, role } = useAuthStore();
  return useQuery<MyReviewData[]>({
    queryKey: queryKeys.reviews.myReviews(),
    queryFn: () => reviewService.getMyReviews(),
    enabled: !!token && role === "TENANT",
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ apartmentId, rating, comment }: { apartmentId: number; rating: number; comment: string }) =>
      reviewService.create({ apartment_id: apartmentId, rating, comment }),
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã gửi đánh giá cho căn hộ!");
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Đánh giá thất bại. Vui lòng thử lại sau."));
    },
  });
}
