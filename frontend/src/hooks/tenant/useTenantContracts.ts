import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import * as contractService from "../../services/contractService";
import { createReview } from "../../services/reviewService";
import { toast } from "sonner";
import type { RentalContract } from "../../types";

export function useTenantContracts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [viewContractDoc, setViewContractDoc] = useState<RentalContract | null>(null);

  // Review states
  const [reviewContractItem, setReviewContractItem] = useState<RentalContract | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const { data: buildingsData, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });
  const buildings = buildingsData?.data || [];

  const { data: apartmentsData, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartments({ limit: 100 }),
  });
  const apartments = apartmentsData?.data || [];

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
  });
  const contracts = contractsData || [];

  const myContracts = contracts;

  const currentTenant = contracts && contracts.length > 0
    ? contracts[0].tenant
    : null;

  const reviewMutation = useMutation({
    mutationFn: ({ apartmentId, rating, comment }: { apartmentId: number; rating: number; comment: string }) =>
      createReview({ apartment_id: apartmentId, rating, comment }),
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã gửi đánh giá cho căn hộ!");
      setReviewContractItem(null);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Đánh giá thất bại. Vui lòng thử lại sau.");
    }
  });

  const isLoading = loadingBuildings || loadingApartments || loadingContracts;

  return {
    search,
    setSearch,
    viewContractDoc,
    setViewContractDoc,
    reviewContractItem,
    setReviewContractItem,
    rating,
    setRating,
    comment,
    setComment,
    buildings,
    apartments,
    myContracts,
    currentTenant,
    submittingReview: reviewMutation.isPending,
    submitReview: (apartmentId: number) => {
      reviewMutation.mutate({ apartmentId, rating, comment });
    },
    isLoading,
  };
}
