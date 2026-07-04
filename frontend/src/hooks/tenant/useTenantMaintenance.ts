import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../../stores/auth.store";
import * as maintenanceService from "../../services/maintenanceService";
import * as contractService from "../../services/contractService";
import { createMaintenanceSchema } from "../../schemas/maintenance.schema";

export function useTenantMaintenance() {
  const { token, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  // Fetch contracts to find the active one
  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
    enabled: role === "TENANT" && !!token,
  });
  const contracts = contractsData || [];

  const currentTenant = contracts && contracts.length > 0
    ? contracts[0].tenant
    : null;

  const activeContract = contracts
    ? contracts.find((c) => c.status === "ACTIVE")
    : null;

  // Fetch real maintenance requests from Backend
  const { data: requestsRes, isLoading: loadingRequests } = useQuery({
    queryKey: ["maintenanceRequests", role],
    queryFn: () => maintenanceService.getAllMaintenanceRequests(),
    enabled: !!token,
  });
  const requests = requestsRes?.data || [];

  // Filter requests for the current tenant
  const myRequests = requests;

  const createMutation = useMutation({
    mutationFn: (data: {
      apartment_id: number;
      title: string;
      description: string;
      priority: string;
    }) => maintenanceService.createMaintenanceRequest(data),
    onSuccess: () => {
      toast.success("Gửi yêu cầu sửa chữa thành công!");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setShowCreateModal(false);
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

  const handleSubmit = (e: React.FormEvent) => {
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
    showCreateModal,
    setShowCreateModal,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    loading,
    handleSubmit,
    handleCancelRequest,
    activeContract,
    saving: createMutation.isPending || cancelMutation.isPending,
  };
}
