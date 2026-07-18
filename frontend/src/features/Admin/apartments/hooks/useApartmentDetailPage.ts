import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as contractService from "../../../../services/contractService";
import * as tenantService from "../../../../services/tenantService";
import * as authService from "../../../../services/authService";
import { getApartmentReviews } from "../../../../services/reviewService";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";
import type { ApartmentImage, TenantOccupant } from "../../../../types";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getApartmentById, updateApartment } from "../../../../services/apartmentService";

export function useApartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (formDataToSend: FormData) => updateApartment(Number(id), formDataToSend),
    onSuccess: () => {
      toast.success("Tải ảnh lên thành công");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APARTMENTS[0], id] });
    },
    onError: () => {
      toast.error("Không thể tải ảnh lên");
    },
  });

  const uploading = uploadMutation.isPending;
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"tenant" | "tenantHistory" | "reviews">("tenant");
  const [images, setImages] = useState<ApartmentImage[]>([]);

  const { data: buildings = [] } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data as unknown as Building[],
  });

  const { data: apartment, isLoading: loadingApartment, refetch: fetchApartment } = useQuery({
    queryKey: [QUERY_KEYS.APARTMENTS[0], id],
    queryFn: () => getApartmentById(Number(id)),
    enabled: !!id,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: [QUERY_KEYS.CONTRACTS[0], "apartment", id],
    queryFn: () =>
      contractService.getAllContractsPage({ apartmentId: Number(id) }).catch(() => ({ data: [] })),
    select: (res) => res.data,
  });

  const { data: tenantsRes, isLoading: loadingTenants } = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllTenantsPage().catch(() => ({ data: [] })),
    select: (res) => res.data,
  });
  const tenants = tenantsRes || [];

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => authService.getAllUsersPage().catch(() => ({ data: [] })),
    select: (res) => res.data,
  });

  const { data: reviewsRes, isLoading: loadingReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () =>
      getApartmentReviews(Number(id)).catch(() => ({
        data: [],
        meta: { averageRating: 0, totalReviews: 0, currentPage: 1, totalPages: 1 },
      })),
    enabled: !!id,
  });
  const reviews = reviewsRes?.data || [];
  const reviewMeta = reviewsRes?.meta || {
    averageRating: 0,
    totalReviews: 0,
    currentPage: 1,
    totalPages: 1,
  };

  useEffect(() => {
    if (apartment?.images) {
      setImages(apartment.images);
    }
  }, [apartment]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apartmentContracts = (apartment as unknown as { contracts: any[] })?.contracts || [];
  const activeContract =
    apartmentContracts.find((contract) => contract.status === "ACTIVE") ||
    contracts.find((contract) => contract.apartment_id === Number(id) && contract.status === "ACTIVE");
  const activeTenant = activeContract
    ? activeContract.tenant ?? tenants.find((tenant) => tenant.id === activeContract.tenant_id)
    : null;
  const activeTenantUser = activeTenant
    ? activeTenant.user ?? users.find((user) => user.id === activeTenant.user_id)
    : null;

  const { data: activeTenantDetail, isLoading: loadingOccupants } = useQuery({
    queryKey: ["tenant", activeTenant?.id, "occupants"],
    queryFn: () => tenantService.getTenantById(activeTenant!.id),
    enabled: !!activeTenant?.id,
  });

  const occupants = useMemo(() => {
    const tenantOccupants = activeTenant?.occupants || activeTenantDetail?.occupants || [];

    return tenantOccupants.map((apiOccupant: TenantOccupant) => ({
      id: String(apiOccupant.id),
      name: apiOccupant.full_name,
      cccd: apiOccupant.citizen_id,
      dob: apiOccupant.date_of_birth
        ? new Date(apiOccupant.date_of_birth).toISOString().split("T")[0]
        : "",
      phone: apiOccupant.phone || "",
    }));
  }, [activeTenant, activeTenantDetail]);

  const loading =
    loadingApartment ||
    loadingContracts ||
    loadingTenants ||
    loadingUsers ||
    loadingReviews ||
    loadingOccupants;

  const historyContracts = contracts.length > 0 ? contracts : apartmentContracts;
  const tenantContracts = activeTenant
    ? historyContracts.filter((contract) => contract.tenant_id === activeTenant.id)
    : [];

  const fetchData = async () => {
    await fetchApartment();
  };

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataToSend = new FormData();
    formDataToSend.append("images", file);
    uploadMutation.mutate(formDataToSend);
  }

  function handleSetThumbnail(imgId: number) {
    const updated = images.map((img) => ({
      ...img,
      is_thumbnail: img.id === imgId,
    }));
    setImages(updated);
    toast.success("Đã đặt làm ảnh đại diện");
  }

  function handleDeleteImage(imgId: number) {
    const updated = images.filter((img) => img.id !== imgId);
    if (images.find((img) => img.id === imgId)?.is_thumbnail && updated.length > 0) {
      updated[0].is_thumbnail = true;
    }
    setImages(updated);
    toast.success("Đã xóa hình ảnh");
  }

  return {
    id,
    apartment: apartment as unknown as Apartment,
    loading,
    images,
    uploading,
    buildings,
    showModifyModal,
    setShowModifyModal,
    contracts,
    tenants,
    users,
    occupants,
    reviews,
    reviewMeta,
    activeTab,
    setActiveTab,
    activeContract,
    activeTenant,
    activeTenantUser,
    tenantContracts,
    fetchData,
    handleImageUpload,
    handleSetThumbnail,
    handleDeleteImage,
  };
}
