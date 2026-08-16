import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewService } from "../../../../services";
import type { Apartment, RentalContract } from "../../../../types";

import { queryKeys } from "../../../../constants/queryKeys";

interface UseTenantReviewProps {
  activeContract: RentalContract | null;
  endedContract: RentalContract | null;
  endedApartment: Apartment | null;
}

export function useTenantReview({
  activeContract,
  endedContract,
  endedApartment,
}: UseTenantReviewProps) {
  const queryClient = useQueryClient();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const endedContractId = endedContract?.id;
  const hasActiveContract = Boolean(activeContract);

  useEffect(() => {
    if (endedContractId && !hasActiveContract) {
      const alreadyDealtWith = localStorage.getItem("has_ignored_review_contract_" + endedContractId);
      if (!alreadyDealtWith) {
        setReviewModalOpen(true);
      }
    }
  }, [endedContractId, hasActiveContract]);

  const reviewMutation = useMutation({
    mutationFn: (data: { apartment_id: number; rating: number; comment: string }) => reviewService.create(data),
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã gửi đánh giá cho căn hộ!");
      if (endedContract) {
        localStorage.setItem("has_ignored_review_contract_" + endedContract.id, "true");
      }
      setReviewModalOpen(false);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Không thể gửi đánh giá.");
    },
  });

  const handleReviewSubmit = () => {
    if (!endedApartment) return;
    reviewMutation.mutate({
      apartment_id: endedApartment.id,
      rating,
      comment: comment.trim(),
    });
  };

  return {
    reviewModalOpen,
    setReviewModalOpen,
    rating,
    setRating,
    comment,
    setComment,
    submittingReview: reviewMutation.isPending,
    handleReviewSubmit,
  };
}
