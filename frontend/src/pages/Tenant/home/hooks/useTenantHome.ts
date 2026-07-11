import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as buildingService from "../../../../services/buildingService";
import * as tenantService from "../../../../services/tenantService";
import { createReview } from "../../../../services/reviewService";
import { toast } from "sonner";
import type { TenantOccupant } from "../../../../types";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function toOccupant(occupant: TenantOccupant) {
  return {
    id: occupant.id,
    name: occupant.full_name,
    cccd: occupant.citizen_id,
    dob: occupant.date_of_birth?.slice(0, 10) || "",
    phone: occupant.phone || "",
  };
}

export function useTenantHome() {
  const { email, token } = useAuthStore();
  const queryClient = useQueryClient();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  const { data: occupantData = [], isLoading: loadingOccupants } = useQuery({
    queryKey: ["tenant-occupants"],
    queryFn: tenantService.getMyOccupants,
    enabled: !!token,
  });
  const occupants = useMemo(
    () => occupantData.map(toOccupant),
    [occupantData]
  );

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
    enabled: !!userId,
  });

  const currentTenant = contracts && contracts.length > 0
    ? contracts[0].tenant
    : null;

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartmentPages(),
    enabled: !!userId,
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingPages(),
    enabled: !!userId,
  });

  const activeContract = contracts
    ? contracts.find((c) => c.status === "ACTIVE")
    : null;

  const endedContract = contracts
    ? contracts
      .filter((c) => c.status === "ENDED")
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
    : null;

  const apartment = activeContract
    ? apartments.find((a) => a.id === activeContract.apartment_id)
    : null;

  const endedApartment = endedContract
    ? apartments.find((a) => a.id === endedContract.apartment_id)
    : null;

  const building = apartment
    ? buildings.find((b) => b.id === apartment.building_id)
    : null;

  const endedBuilding = endedApartment
    ? buildings.find((b) => b.id === endedApartment.building_id)
    : null;

  const displayName = currentTenant?.full_name || email?.split("@")[0] || "Người thuê";

  const isLoading = loadingOccupants || loadingContracts || loadingApartments || loadingBuildings;

  // Review states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (endedContract) {
      const alreadyDealtWith = localStorage.getItem("has_ignored_review_contract_" + endedContract.id);
      if (!alreadyDealtWith) {
        setReviewModalOpen(true);
      }
    }
  }, [endedContract]);

  const reviewMutation = useMutation({
    mutationFn: (data: { apartment_id: number; rating: number; comment: string }) => createReview(data),
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã gửi đánh giá cho căn hộ!");
      if (endedContract) {
        localStorage.setItem("has_ignored_review_contract_" + endedContract.id, "true");
      }
      setReviewModalOpen(false);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Không thể gửi đánh giá.");
    }
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
    email,
    displayName,
    occupants,
    activeContract,
    apartment,
    building,
    endedContract,
    endedApartment,
    endedBuilding,
    isLoading,
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