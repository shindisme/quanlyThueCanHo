import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as apartmentService from "../../../../services/apartmentService";
import * as tenantService from "../../../../services/tenantService";
import * as contractService from "../../../../services/contractService";
import * as scheduleService from "../../../../services/scheduleService";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import * as maintenanceService from "../../../../services/maintenanceService";
import { toast } from "sonner";

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

export function useDashboardStaff() {
  const { email, token, role, managedBuildingId, managedBuildingName, setAuth } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  // Query staff
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAll(),
    enabled: !!userId && !!role && role !== "STAFF",
  });

  // Query maintenance
  const { data: maintenanceData, isLoading: loadingMaintenance } = useQuery({
    queryKey: ["maintenanceRequests", managedBuildingId],
    queryFn: () => maintenanceService.getAll({
      building_id: managedBuildingId || undefined,
      limit: 100
    }),
  });

  const maintenanceRequests = maintenanceData?.data || [];

  const currentStaff = role === "STAFF"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (maintenanceRequests.length > 0 ? (maintenanceRequests[0] as any).assigned_staff : null)
    : (userId && staffRes?.data ? staffRes.data.find((s) => s.user_id === userId) : null);

  const displayName = currentStaff?.full_name || email?.split("@")[0] || "Nhân viên";

  const activeBuildingId = managedBuildingId || currentStaff?.building_id || undefined;

  // Query buildings if staff has building_id
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllPage(),
    enabled: !!role && role !== "STAFF" && !!currentStaff?.building_id && (!managedBuildingId || !managedBuildingName),
    select: (res) => res.data,
  });

  useEffect(() => {
    if (role !== "STAFF" && currentStaff && currentStaff.building_id && (!managedBuildingId || !managedBuildingName)) {
      const currentBld = buildings.find((b) => b.id === currentStaff.building_id);
      if (currentBld && role && email) {
        setAuth(token, role, email, currentStaff.building_id, currentBld.branch_name);
      }
    }
  }, [currentStaff, buildings, managedBuildingId, managedBuildingName, role, email, token, setAuth]);

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments", activeBuildingId],
    queryFn: () => apartmentService.getAllPage({
      building_id: activeBuildingId || undefined
    }),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllPage(),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", activeBuildingId],
    queryFn: () => contractService.getAllContractsPage({
      buildingId: activeBuildingId || undefined
    }),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => scheduleService.getAllPage(),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const isLoading = role === "STAFF"
    ? loadingMaintenance
    : (loadingStaff || loadingApartments || loadingTenants || loadingContracts || loadingSchedules || loadingMaintenance);

  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number }) =>
      maintenanceService.confirm(id, {
        assigned_staff_id: staffId,
        scheduled_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Đã bắt đầu xử lý sự cố");
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái");
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, charge_tenant, repair_fee }: { id: number; charge_tenant: boolean; repair_fee?: number }) =>
      maintenanceService.complete(id, { charge_tenant, repair_fee }),
    onSuccess: () => {
      toast.success("Đã hoàn thành sửa chữa sự cố");
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái");
    },
  });

  const unableMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      maintenanceService.unable(id, { reason }),
    onSuccess: () => {
      toast.success("Đã báo cáo không thể sửa chữa thành công");
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
    },
    onError: () => {
      toast.error("Không thể gửi báo cáo");
    },
  });

  return {
    displayName,
    managedBuildingId: activeBuildingId,
    apartments,
    tenants,
    contracts,
    schedules,
    maintenanceRequests,
    isLoading,
    currentStaff,
    role,
    startMutation,
    completeMutation,
    unableMutation,
  };
}
