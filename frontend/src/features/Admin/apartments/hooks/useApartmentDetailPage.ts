import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as contractService from "../../../../services/contractService";
import * as tenantService from "../../../../services/tenantService";
import * as authService from "../../../../services/authService";
import * as reservationService from "../../../../services/reservationService";
import { getApartmentReviews } from "../../../../services/reviewService";
import type { ApartmentImage, TenantOccupant } from "../../../../types";
import { queryKeys } from "../../../../constants/queryKeys";
import { useUserRole } from "../../../../hooks/useUserRole";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { apartmentService } from "../../../../services";

// Hook quản lý dữ liệu chi tiết căn hộ, hợp đồng, cư dân và đánh giá
export function useApartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { role } = useUserRole();

  // upload ảnh mới cho căn hộ
  const uploadMutation = useMutation({
    mutationFn: (formDataToSend: FormData) => apartmentService.update(Number(id), formDataToSend),
    onSuccess: () => {
      toast.success("Tải ảnh lên thành công");
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.detail(id ?? "invalid") });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể tải ảnh lên"));
    },
  });

  // cập nhật căn hộ 
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData | object }) => apartmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.detail(id ?? "invalid") });
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.all });
    },
  });

  const uploading = uploadMutation.isPending || updateMutation.isPending;
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"tenant" | "tenantHistory" | "reviews">("tenant");

  const [images, setImages] = useState<ApartmentImage[]>([]);

  // Lấy chi tiết căn hộ
  const {
    data: apartment,
    isLoading: loadingApartment,
    refetch: fetchApartment,
  } = useQuery({
    queryKey: queryKeys.apartments.detail(id ?? "invalid"),
    queryFn: () => apartmentService.getById(Number(id)),
    enabled: Boolean(id) && !isNaN(Number(id)),
  });

  useEffect(() => {
    if (apartment?.images) {
      setImages(apartment.images);
    }
  }, [apartment]);

  // Danh sách hợp đồng của căn hộ hiện tại
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ apartmentId: id }),
    queryFn: () => contractService.getAllPage({ apartment_id: Number(id) }),
    select: (res) => res.data,
    enabled: Boolean(id) && !isNaN(Number(id)),
  });

  // Danh sách hợp đồng cũ
  const apartmentContracts = useMemo(() => {
    return apartment?.contracts || [];
  }, [apartment]);

  // Đặt phòng cọc
  const { data: activeReservation, isLoading: loadingReservation } = useQuery({
    queryKey: queryKeys.reservations.apartment(id),
    queryFn: async () => {
      const res = await reservationService.getReservations({ apartment_id: Number(id), status: "ACTIVE" });
      return res.data?.[0] || null;
    },
    enabled: Boolean(id) && !isNaN(Number(id)),
  });

  // Tìm hợp đồng ACTIVE
  const activeContract = useMemo(() => {
    const all = contracts.length > 0 ? contracts : apartmentContracts;
    return all.find((c) => c.status === "ACTIVE") || null;
  }, [contracts, apartmentContracts]);

  // Người thuê
  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: queryKeys.tenants.all,
    queryFn: () => tenantService.getAllPage(),
    select: (res) => res.data,
  });

  const activeTenant = useMemo(() => {
    if (!activeContract) return null;
    return tenants.find((t) => t.id === activeContract.tenant_id) || activeContract.tenant || null;
  }, [activeContract, tenants]);

  // Người dùng
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => authService.getAllPage(),
    select: (res) => res.data,
  });

  const activeTenantUser = useMemo(() => {
    if (!activeTenant) return null;
    return users.find((u) => u.id === activeTenant.user_id) || null;
  }, [activeTenant, users]);

  // Đánh giá
  const { data: reviewRes, isLoading: loadingReviews } = useQuery({
    queryKey: queryKeys.reviews.apartment(id ?? "invalid"),
    queryFn: () => getApartmentReviews(Number(id)),
    enabled: Boolean(id) && !isNaN(Number(id)),
  });

  const reviews = useMemo(() => reviewRes?.data || [], [reviewRes]);
  const reviewMeta = useMemo(() => reviewRes?.meta || {
    averageRating: 0,
    totalReviews: 0,
    currentPage: 1,
    totalPages: 0,
  }, [reviewRes]);

  // Chi tiết người thuê
  const { data: activeTenantDetail, isLoading: loadingOccupants } = useQuery({
    queryKey: queryKeys.occupants.byTenant(activeTenant?.id),
    queryFn: () => tenantService.getById(activeTenant!.id),
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
    loadingReservation ||
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
    if (!apartment) return;
    const targetImage = images.find((img) => img.id === imgId);
    if (!targetImage) return;

    const updated = images.map((img) => ({
      ...img,
      is_thumbnail: img.id === imgId,
    }));
    setImages(updated);

    const fd = new FormData();
    images.forEach((img) => {
      fd.append("existing_image_urls", img.image_url);
    });
    fd.append("thumbnail_image_url", targetImage.image_url);

    updateMutation.mutate(
      { id: apartment.id, data: fd },
      {
        onSuccess: () => {
          toast.success("Đã đặt làm ảnh đại diện");
          fetchApartment();
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error, "Không thể cập nhật ảnh đại diện"));
          fetchApartment();
        },
      }
    );
  }

  function handleDeleteImage(imgId: number) {
    if (!apartment) return;
    const remainingImages = images.filter((img) => img.id !== imgId);
    setImages(remainingImages);

    const fd = new FormData();
    if (remainingImages.length > 0) {
      remainingImages.forEach((img) => {
        fd.append("existing_image_urls", img.image_url);
      });
    } else {
      fd.append("existing_image_urls", JSON.stringify([]));
    }

    updateMutation.mutate(
      { id: apartment.id, data: fd },
      {
        onSuccess: () => {
          toast.success("Đã xóa hình ảnh");
          fetchApartment();
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error, "Không thể xóa hình ảnh"));
          fetchApartment();
        },
      }
    );
  }

  const reservedTenant = activeReservation?.tenant_id
    ? tenants.find((t) => t.id === activeReservation.tenant_id) || activeReservation.tenant
    : activeReservation?.tenant;

  const { data: buildings = [] } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  return {
    role,
    id,
    apartment,
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
    activeReservation,
    reservedTenant,
    tenantContracts,
    fetchData,
    handleImageUpload,
    handleSetThumbnail,
    handleDeleteImage,
  };
}
