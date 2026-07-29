import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../../../../stores/auth.store";
import * as maintenanceService from "../../../../services/maintenanceService";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import { confirmMaintenanceSchema, unableMaintenanceSchema } from "../../../../schemas/maintenance.schema";
import type { MaintenanceRequest } from "../../../../types";

export function useAdminMaintenance() {
  const { token, role, managedBuildingId } = useAuthStore();
  const queryClient = useQueryClient();

  // Tìm kiếm và bộ lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [floorFilter, setFloorFilter] = useState<string>("");

  // State modal phân công
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  // State modal báo cáo không thể sửa
  const [showUnableModal, setShowUnableModal] = useState(false);
  const [unableReason, setUnableReason] = useState<string>("");

  // Fetch all yêu cầu sửa chữa
  const { data: requestsRes, isLoading: loadingRequests } = useQuery({
    queryKey: ["adminMaintenanceRequests", statusFilter, priorityFilter, buildingFilter, role, managedBuildingId],
    queryFn: () => {
      const params: Parameters<typeof maintenanceService.getAllMaintenanceRequests>[0] = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

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

  // Fetch buildings
  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingsPage(),
    enabled: role === "ADMIN",
    select: (res) => res.data,
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartmentsPage(),
    select: (res) => res.data,
  });

  const availableFloors = useMemo(() => {
    const targetBuildingId = role === "MANAGER" ? managedBuildingId : (buildingFilter ? Number(buildingFilter) : null);
    const apts = targetBuildingId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (apartments as any[]).filter((a) => a.building_id === targetBuildingId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (apartments as any[]);
    const floors = Array.from(new Set(apts.map((a) => a.floor))).sort((a, b) => a - b);
    return floors;
  }, [apartments, buildingFilter, role, managedBuildingId]);

  // Fetch technicians
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: ["technicians", selectedRequest?.apartment?.building_id || selectedRequest?.apartment?.building?.id || managedBuildingId],
    queryFn: () => {
      const bId = selectedRequest?.apartment?.building_id || selectedRequest?.apartment?.building?.id || (role === "MANAGER" ? managedBuildingId : undefined);
      return staffService.getAllStaffs(bId ? { building_id: Number(bId) } : undefined);
    },
    enabled: role !== "STAFF" && !!(selectedRequest?.apartment?.building_id || selectedRequest?.apartment?.building?.id || (role === "MANAGER" && managedBuildingId)),
  });
  const technicians = (staffRes?.data || []).filter(
    (s) => s.position !== "Quản lý"
  );

  // Xác nhận và phân công 
  const confirmMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { assigned_staff_id: number; scheduled_at: string } }) =>
      maintenanceService.confirmMaintenanceRequest(id, data),
    onSuccess: () => {
      toast.success("Phân công nhân viên xử lý thành công");
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

  // Đánh dấu hoàn thành
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

  // Báo cáo không thể sửa 
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

  const handleOpenAssign = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setShowAssignModal(true);
  };

  const handleOpenUnable = (req: MaintenanceRequest) => {
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

  const filteredRequestsByFloor = useMemo(() => {
    return requests.filter((r) => {
      if (floorFilter && r.apartment?.floor !== Number(floorFilter)) {
        return false;
      }
      return true;
    });
  }, [requests, floorFilter]);

  const loading = loadingRequests || loadingBuildings || loadingStaff;

  return {
    requests: filteredRequestsByFloor,
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
    floorFilter,
    setFloorFilter,
    availableFloors,
    loading,
    loadingStaff,
    role,
    managedBuildingId,

    // Modal phân công
    showAssignModal,
    setShowAssignModal,
    assignedStaffId,
    setAssignedStaffId,
    scheduledAt,
    setScheduledAt,
    handleOpenAssign,
    handleConfirm,

    // Modal báo cáo không thể sửa
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
