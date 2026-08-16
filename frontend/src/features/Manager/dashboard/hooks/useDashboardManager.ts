import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as apartmentService from "../../../../services/apartmentService";
import * as tenantService from "../../../../services/tenantService";
import * as contractService from "../../../../services/contractService";
import * as scheduleService from "../../../../services/scheduleService";
import * as invoiceService from "../../../../services/invoiceService";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import * as maintenanceService from "../../../../services/maintenanceService";
import { parseJwt } from "../../../../utils/jwt";
import { queryKeys } from "../../../../constants/queryKeys";

export function useDashboardManager() {
  const { email, token, role, managedBuildingId, managedBuildingName, setAuth } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  // Query staff
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: queryKeys.staff.list({ scope: "manager-dashboard" }),
    queryFn: () => staffService.getAllPage(),
    select: (response) => response.data,
    enabled: !!userId,
  });
  const currentStaff = userId && staffRes
    ? staffRes.find((s) => s.user_id === userId)
    : null;

  const displayName = currentStaff?.full_name || email?.split("@")[0] || "Quản lý";

  // Query buildings if staff has building_id
  const { data: buildings = [] } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    enabled: !!currentStaff?.building_id && (!managedBuildingId || !managedBuildingName),
    select: (res) => res.data,
  });

  useEffect(() => {
    if (currentStaff && currentStaff.building_id && (!managedBuildingId || !managedBuildingName)) {
      const currentBld = buildings.find((b) => b.id === currentStaff.building_id);
      if (currentBld && role && email) {
        setAuth(token, role, email, currentStaff.building_id, currentBld.branch_name);
      }
    }
  }, [currentStaff, buildings, managedBuildingId, managedBuildingName, role, email, token, setAuth]);

  const activeBuildingId = managedBuildingId || currentStaff?.building_id || undefined;

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: queryKeys.apartments.list({ buildingId: activeBuildingId }),
    queryFn: () => apartmentService.getAllPage({
      building_id: activeBuildingId || undefined
    }),
    select: (res) => res.data,
  });

  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: queryKeys.tenants.list({ scope: "manager-dashboard" }),
    queryFn: () => tenantService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: queryKeys.contracts.list({ buildingId: activeBuildingId }),
    queryFn: () => contractService.getAllPage({
      buildingId: activeBuildingId || undefined
    }),
    select: (res) => res.data,
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: queryKeys.schedules.list({ scope: "manager-dashboard" }),
    queryFn: () => scheduleService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: queryKeys.invoices.list({ buildingId: activeBuildingId }),
    queryFn: () => invoiceService.getAllPage({
      building_id: activeBuildingId || undefined,
    }),
    select: (res) => res.data,
  });

  const { data: maintenanceData, isLoading: loadingMaintenance } = useQuery({
    queryKey: queryKeys.maintenance.list({ buildingId: activeBuildingId }),
    queryFn: () => maintenanceService.getAllPage({
      building_id: activeBuildingId || undefined,
    }),
    select: (response) => response.data,
  });
  const maintenanceRequests = maintenanceData || [];

  const isLoading = loadingStaff || loadingApartments || loadingTenants || loadingContracts || loadingSchedules || loadingInvoices || loadingMaintenance;

  return {
    email,
    displayName,
    managedBuildingName,
    managedBuildingId: activeBuildingId,
    apartments,
    tenants,
    contracts,
    schedules,
    invoices,
    maintenanceRequests,
    isLoading,
  };
}
