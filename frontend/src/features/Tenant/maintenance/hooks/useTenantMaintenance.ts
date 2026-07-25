import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../../../../stores/auth.store";
import * as maintenanceService from "../../../../services/maintenanceService";
import * as contractService from "../../../../services/contractService";
import * as uploadService from "../../../../services/uploadService";
import { createMaintenanceSchema } from "../../../../schemas/maintenance.schema";
import { useOnOff } from "../../../../hooks/useOnOff";

export function useTenantMaintenance() {
  const { token, role } = useAuthStore();
  const queryClient = useQueryClient();
  const createModal = useOnOff();
  const [search, setSearch] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  // Fetch contracts
  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContractsPage(),
    enabled: role === "TENANT" && !!token,
    select: (res) => res.data,
  });
  const contracts = contractsData || [];

  const currentTenant = contracts && contracts.length > 0
    ? contracts[0].tenant
    : null;

  const activeContract = contracts
    ? contracts.find((c) => c.status === "ACTIVE")
    : null;

  // Fetch maintenance request
  const { data: requestsRes, isLoading: loadingRequests } = useQuery({
    queryKey: ["maintenanceRequests", role],
    queryFn: () => maintenanceService.getAllMaintenanceRequests(),
    enabled: !!token,
  });
  const requests = requestsRes?.data || [];

  // Filter requests cho người thuê hiện tại
  const myRequests = requests;

  const createMutation = useMutation({
    mutationFn: async (data: {
      apartment_id: number;
      title: string;
      description: string;
      priority: string;
      imageFile?: File | null;
    }) => {
      const { imageFile: selectedImage, ...payload } = data;
      const imageUrls = selectedImage
        ? await uploadService.uploadImages([selectedImage])
        : [];

      return maintenanceService.createMaintenanceRequest({
        ...payload,
        ...(imageUrls[0] ? { image_url: imageUrls[0] } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Gửi yêu cầu sửa chữa thành công!");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setImageFile(null);
      setImagePreviewUrl("");
      createModal.onClose();
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể gửi yêu cầu");
    },
  });
  const cancelMutation = useMutation({
    mutationFn: (id: number) => maintenanceService.cancelMaintenanceRequest(id),
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu sửa chữa");
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể hủy yêu cầu");
    },
  });

  const loading = loadingContracts || loadingRequests;

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

  const clearImage = () => handleImageChange(null);
  const handleCreateMaintenanceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !activeContract) {
      toast.error("Không xác định được phòng thuê hoạt động");
      return;
    }

    const payload = {
      apartment_id: activeContract.apartment_id,
      title: title.trim(),
      description: description.trim(),
      priority,
      imageFile,
    };

    const validation = createMaintenanceSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    createMutation.mutate(payload);
  };

  const handleCancelRequest = (id: number) => {
    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu sửa chữa này?")) return;
    cancelMutation.mutate(id);
  };

  return {
    myRequests,
    search,
    setSearch,
    createModal,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    imageFile,
    imagePreviewUrl,
    handleImageChange,
    clearImage,
    loading,
    handleCreateMaintenanceRequest,
    handleCancelRequest,
    activeContract,
    saving: createMutation.isPending || cancelMutation.isPending,
  };
}
