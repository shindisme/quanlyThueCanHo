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
import { parseJwt } from "../../../../utils/jwt";
import { queryKeys } from "../../../../constants/queryKeys";
import { getApiErrorMessage } from "../../../../utils/apiError";

export function useDashboardStaff() {
  const { email, token, role, managedBuildingId, managedBuildingName, setAuth } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  // Query staff
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: queryKeys.staff.list({ scope: "staff-dashboard", userId }),
    queryFn: () => staffService.getAllPage(),
    select: (response) => response.data,
    enabled: !!userId && !!role,
  });

  // Query maintenance
  const { data: maintenanceData, isLoading: loadingMaintenance } = useQuery({
    queryKey: queryKeys.maintenance.list({ scope: "staff-dashboard", buildingId: managedBuildingId }),
    queryFn: () => maintenanceService.getAllPage({
      building_id: managedBuildingId || undefined,
    }),
    select: (response) => response.data,
  });

  const maintenanceRequests = maintenanceData || [];
  const currentStaff = userId && staffRes ? staffRes.find((staff) => staff.user_id === userId) : null;

  const displayName = currentStaff?.full_name || email?.split("@")[0] || "Nhân viên";

  const activeBuildingId = managedBuildingId || currentStaff?.building_id || undefined;

  // Query buildings if staff has building_id
  const { data: buildings = [] } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    enabled: !!currentStaff?.building_id && (!managedBuildingId || !managedBuildingName),
    select: (res) => res.data,
  });

  useEffect(() => {
    if (currentStaff?.building_id && (!managedBuildingId || !managedBuildingName)) {
      const currentBld = buildings.find((b) => b.id === currentStaff.building_id);
      if (currentBld && role && email) {
        setAuth(token, role, email, currentStaff.building_id, currentBld.branch_name);
      }
    }
  }, [currentStaff, buildings, managedBuildingId, managedBuildingName, role, email, token, setAuth]);

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ buildingId: activeBuildingId }),
    queryFn: () => apartmentService.getAllPage({
      building_id: activeBuildingId || undefined
    }),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: queryKeys.tenants.list({ scope: "staff-dashboard" }),
    queryFn: () => tenantService.getAllPage(),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ buildingId: activeBuildingId }),
    queryFn: () => contractService.getAllPage({
      buildingId: activeBuildingId || undefined
    }),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: queryKeys.schedules.list({ scope: "staff-dashboard" }),
    queryFn: () => scheduleService.getAllPage(),
    enabled: !!role && role !== "STAFF",
    select: (res) => res.data,
  });

  const isLoading = role === "STAFF"
    ? loadingMaintenance
    : (loadingStaff || loadingApartments || loadingTenants || loadingContracts || loadingSchedules || loadingMaintenance);

  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: ({ id, charge_tenant, repair_fee }: { id: number; charge_tenant: boolean; repair_fee?: number }) =>
      maintenanceService.complete(id, { charge_tenant, repair_fee }),
    onSuccess: () => {
      toast.success("Đã hoàn thành sửa chữa sự cố");
      void queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật trạng thái"));
    },
  });

  const unableMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      maintenanceService.unable(id, { reason }),
    onSuccess: () => {
      toast.success("Đã báo cáo không thể sửa chữa thành công");
      void queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi báo cáo"));
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
    completeMutation,
    unableMutation,
  };
}
