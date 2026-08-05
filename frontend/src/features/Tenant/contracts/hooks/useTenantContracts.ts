import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import * as contractService from "../../../../services/contractService";
import * as contractTerminationService from "../../../../services/contractTerminationService";
import { reviewService } from "../../../../services";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import type { ContractTermination, RentalContract } from "../../../../types";

export function useTenantContracts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [viewContractDoc, setViewContractDoc] = useState<RentalContract | null>(null);
  const [reviewContractItem, setReviewContractItem] = useState<RentalContract | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: QUERY_KEYS.CONTRACTS,
    queryFn: () => contractService.getAllContractsPage(),
    select: (res) => res.data,
  });

  const { data: terminations = [], isLoading: loadingTerminations } = useQuery({
    queryKey: QUERY_KEYS.TERMINATIONS,
    queryFn: () => contractTerminationService.getAllPage(),
    select: (res) => res.data as ContractTermination[],
  });

  const reviewMutation = useMutation({
    mutationFn: ({ apartmentId, rating, comment }: { apartmentId: number; rating: number; comment: string }) =>
      reviewService.create({ apartment_id: apartmentId, rating, comment }),
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã gửi đánh giá cho căn hộ!");
      setReviewContractItem(null);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Đánh giá thất bại. Vui lòng thử lại sau.");
    },
  });

  const terminationMutation = useMutation({
    mutationFn: contractTerminationService.createTenantRequest,
    onSuccess: () => {
      toast.success("Gửi yêu cầu trả phòng thành công! Ban quản lý sẽ xử lý yêu cầu của bạn.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TERMINATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Không thể gửi yêu cầu trả phòng.");
    },
  });

  const isLoading = loadingBuildings || loadingApartments || loadingContracts || loadingTerminations;

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
    myContracts: contracts,
    currentTenant: contracts.length > 0 ? contracts[0].tenant : null,
    terminations,
    submittingReview: reviewMutation.isPending,
    submitReview: (apartmentId: number) => {
      reviewMutation.mutate({ apartmentId, rating, comment });
    },
    submittingCheckoutRequest: terminationMutation.isPending,
    requestTermination: terminationMutation.mutateAsync,
    isLoading,
  };
}
