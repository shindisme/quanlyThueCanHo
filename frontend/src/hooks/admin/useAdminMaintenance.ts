import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../../stores/auth.store";
import * as maintenanceService from "../../services/maintenanceService";
import * as staffService from "../../services/staffService";
import * as buildingService from "../../services/buildingService";
import { confirmMaintenanceSchema, unableMaintenanceSchema } from "../../schemas/maintenance.schema";

export function useAdminMaintenance() {
  const { token, role, managedBuildingId } = useAuthStore();
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [buildingFilter, setBuildingFilter] = useState<string>("");

  // Assign Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  // Unable Modal states
  const [showUnableModal, setShowUnableModal] = useState(false);
  const [unableReason, setUnableReason] = useState<string>("");

  // Fetch all maintenance requests
  const { data: requestsRes, isLoading: loadingRequests, isFetching: fetchingRequests } = useQuery({
    queryKey: ["adminMaintenanceRequests", statusFilter, priorityFilter, buildingFilter, role, managedBuildingId],
    queryFn: () => {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      // If manager, enforce building filter
      if (role === "MANAGER" && managedBuildingId) {
        params.building_id = managedBuildingId;
      } else if (buildingFilter) {
        params.building_id = Number(buildingFilter);
      }
      return maintenanceService.getAllMaintenanceRequests(params);
    },
    enabled: !!token,
  });
  const requests = requestsRes?.data || [];

  // Fetch buildings (for Admin filter)
  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
    enabled: role === "ADMIN",
  });
  const buildings = buildingsRes?.data || [];

  // Fetch technicians in the requested building
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: ["technicians", selectedRequest?.apartment?.building_id],
    queryFn: () => {
      const bId = selectedRequest?.apartment?.building_id;
      return staffService.getAllStaff(bId ? { building_id: bId } : undefined);
    },
    enabled: !!selectedRequest?.apartment?.building_id,
  });
  const technicians = (staffRes?.data || []).filter(
    (s) => s.position !== "Quản lý"
  );

  // Confirm / Assign Mutation
  const confirmMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { assigned_staff_id: number; scheduled_at: string } }) =>
      maintenanceService.confirmMaintenanceRequest(id, data),
    onSuccess: () => {
      toast.success("Đã phân công nhân viên xử lý thành công");
      setShowAssignModal(false);
      setSelectedRequest(null);
      setAssignedStaffId("");
      setScheduledAt("");
      queryClient.invalidateQueries({ queryKey: ["adminMaintenanceRequests"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể phân công yêu cầu");
    },
  });

  // Complete Mutation
  const completeMutation = useMutation({
    mutationFn: (id: number) => maintenanceService.completeMaintenanceRequest(id),
    onSuccess: () => {
      toast.success("Đã đánh dấu hoàn thành sửa chữa");
      queryClient.invalidateQueries({ queryKey: ["adminMaintenanceRequests"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể hoàn thành yêu cầu");
    },
  });

  // Unable Mutation
  const unableMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      maintenanceService.unableMaintenanceRequest(id, { reason }),
    onSuccess: () => {
      toast.success("Đã báo cáo không thể sửa chữa thành công");
      setShowUnableModal(false);
      setSelectedRequest(null);
      setUnableReason("");
      queryClient.invalidateQueries({ queryKey: ["adminMaintenanceRequests"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể gửi báo cáo");
    },
  });

  const handleOpenAssign = (req: any) => {
    setSelectedRequest(req);
    setShowAssignModal(true);
  };

  const handleOpenUnable = (req: any) => {
    setSelectedRequest(req);
    setShowUnableModal(true);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const payload = {
      assigned_staff_id: Number(assignedStaffId),
      scheduled_at: scheduledAt,
    };

    const validation = confirmMaintenanceSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    confirmMutation.mutate({ id: selectedRequest.id, data: payload });
  };

  const handleUnableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const validation = unableMaintenanceSchema.safeParse({ reason: unableReason });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    unableMutation.mutate({ id: selectedRequest.id, reason: unableReason.trim() });
  };

  const handleComplete = (id: number) => {
    if (!window.confirm("Xác nhận đã sửa chữa hoàn tất sự cố này?")) return;
    completeMutation.mutate(id);
  };

  const loading = loadingRequests || loadingBuildings;

  return {
    requests,
    buildings,
    technicians,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    buildingFilter,
    setBuildingFilter,
    loading,
    loadingStaff,
    role,
    managedBuildingId,

    // Assign Modal
    showAssignModal,
    setShowAssignModal,
    assignedStaffId,
    setAssignedStaffId,
    scheduledAt,
    setScheduledAt,
    handleOpenAssign,
    handleConfirm,

    // Unable Modal
    showUnableModal,
    setShowUnableModal,
    unableReason,
    setUnableReason,
    handleOpenUnable,
    handleUnableSubmit,

    // Actions
    handleComplete,
    saving: confirmMutation.isPending || completeMutation.isPending || unableMutation.isPending,
  };
}
