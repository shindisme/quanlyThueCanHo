import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../../../../constants/queryKeys";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import { createMaintenanceSchema } from "../../../../schemas/maintenance.schema";
import * as contractService from "../../../../services/contractService";
import * as maintenanceService from "../../../../services/maintenanceService";
import * as uploadService from "../../../../services/uploadService";
import { useAuthStore } from "../../../../stores/auth.store";
import type { MaintenanceRequest } from "../../../../types";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { formatApartmentDisplay, removeVietnameseTones } from "../../../../utils/string";

export function useTenantMaintenance() {
  const { token, role } = useAuthStore();
  const queryClient = useQueryClient();
  const createModal = useOnOff();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [detailRequest, setDetailRequest] = useState<MaintenanceRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MaintenanceRequest | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ scope: "tenant", status: "ACTIVE" }),
    queryFn: () => contractService.getAllPage({ status: "ACTIVE" }),
    select: (response) => response.data,
    enabled: role === "TENANT" && Boolean(token),
  });
  const activeContract = contracts[0] ?? null;

  const requestsQuery = useQuery({
    queryKey: queryKeys.maintenance.tenantList(),
    queryFn: () => maintenanceService.getAllPage(),
    select: (response) => response.data,
    enabled: role === "TENANT" && Boolean(token),
  });
  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);

  const filteredRequests = useMemo(() => {
    const keyword = removeVietnameseTones(debouncedSearch.trim().toLowerCase());
    return requests.filter((request) => {
      if (statusFilter && request.status !== statusFilter) return false;
      if (priorityFilter && request.priority !== priorityFilter) return false;
      if (!keyword) return true;

      const room = request.apartment
        ? formatApartmentDisplay(request.apartment.room_number, request.apartment.floor)
        : "";
      return removeVietnameseTones(
        [request.title, request.description, room].filter(Boolean).join(" ").toLowerCase()
      ).includes(keyword);
    });
  }, [debouncedSearch, priorityFilter, requests, statusFilter]);

  const { items: sortedRequests, requestSort, sortConfig } = useSort<MaintenanceRequest>(
    filteredRequests,
    { key: "created_at", direction: "desc" },
    {
      room: (request) => request.apartment?.room_number ?? "",
    }
  );
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedRequests.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, priorityFilter, setCurrentPage, statusFilter]);

  const paginatedRequests = useMemo(
    () => sortedRequests.slice(startIdx, endIdx),
    [endIdx, sortedRequests, startIdx]
  );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const closeCreateModal = () => {
    createModal.onClose();
    resetForm();
  };

  const createMutation = useMutation({
    mutationFn: async (data: {
      apartment_id: number;
      title: string;
      description: string;
      imageFile?: File | null;
    }) => {
      const { imageFile: selectedImage, ...payload } = data;
      const imageUrls = selectedImage ? await uploadService.uploadImages([selectedImage]) : [];
      return maintenanceService.create({
        ...payload,
        ...(imageUrls[0] ? { image_url: imageUrls[0] } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Gửi yêu cầu sửa chữa thành công!");
      closeCreateModal();
      void queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi yêu cầu sửa chữa"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: maintenanceService.cancel,
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu sửa chữa");
      setCancelTarget(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể hủy yêu cầu sửa chữa"));
    },
  });

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng hình ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleCreateMaintenanceRequest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeContract) {
      toast.error("Không xác định được phòng thuê hoạt động");
      return;
    }
    const payload = {
      apartment_id: activeContract.apartment_id,
      title: title.trim(),
      description: description.trim(),
      imageFile,
    };
    const validation = createMaintenanceSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    createMutation.mutate(payload);
  };

  return {
    requests: paginatedRequests,
    filteredCount: filteredRequests.length,
    requestCount: filteredRequests.length,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    createModal,
    closeCreateModal,
    title,
    setTitle,
    description,
    setDescription,
    imageFile,
    imagePreviewUrl,
    handleImageChange,
    clearImage: () => handleImageChange(null),
    loading: loadingContracts || requestsQuery.isLoading,
    error: requestsQuery.error,
    refetch: requestsQuery.refetch,
    handleCreateMaintenanceRequest,
    detailRequest,
    setDetailRequest,
    cancelTarget,
    setCancelTarget,
    confirmCancel: () => cancelTarget && cancelMutation.mutate(cancelTarget.id),
    activeContract,
    saving: createMutation.isPending || cancelMutation.isPending,
    requestSort,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
  };
}
