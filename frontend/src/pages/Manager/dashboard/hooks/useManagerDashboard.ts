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

export function useManagerDashboard() {
  const { email, token, role, managedBuildingId, managedBuildingName, setAuth } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  // Query staff
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAllStaff(),
    enabled: !!userId,
  });
  const currentStaff = userId && staffRes?.data
    ? staffRes.data.find((s) => s.user_id === userId)
    : null;

  const displayName = currentStaff?.full_name || email?.split("@")[0] || "Quản lý";

  // Query buildings if staff has building_id
  const { data: buildingsRes } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings(),
    enabled: !!currentStaff?.building_id && (!managedBuildingId || !managedBuildingName),
  });

  // Sync manager building mapping if not present in Zustand store
  useEffect(() => {
    if (currentStaff && currentStaff.building_id && (!managedBuildingId || !managedBuildingName)) {
      const currentBld = buildingsRes?.data?.find((b) => b.id === currentStaff.building_id);
      if (currentBld && role && email) {
        setAuth(token, role, email, currentStaff.building_id, currentBld.branch_name);
      }
    }
  }, [currentStaff, buildingsRes, managedBuildingId, managedBuildingName, role, email, token, setAuth]);

  const activeBuildingId = managedBuildingId || currentStaff?.building_id || undefined;

  const { data: apartmentsData, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments", activeBuildingId],
    queryFn: () => apartmentService.getAllApartments({
      building_id: activeBuildingId || undefined,
      limit: 100
    }),
  });
  const apartments = apartmentsData?.data || [];

  const { data: tenantsData, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
  });
  const tenants = tenantsData?.data || [];

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", activeBuildingId],
    queryFn: () => contractService.getAllContracts({
      buildingId: activeBuildingId || undefined
    }),
  });
  const contracts = contractsData || [];

  const { data: schedulesData, isLoading: loadingSchedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => scheduleService.getSchedules(),
  });
  const schedules = schedulesData || [];

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices", activeBuildingId],
    queryFn: () => invoiceService.getAllInvoices({
      building_id: activeBuildingId || undefined,
      limit: 100
    }),
  });
  const invoices = invoicesData?.data || [];

  const { data: maintenanceData, isLoading: loadingMaintenance } = useQuery({
    queryKey: ["maintenanceRequests", activeBuildingId],
    queryFn: () => maintenanceService.getAllMaintenanceRequests({
      building_id: activeBuildingId || undefined,
      limit: 100
    }),
  });
  const maintenanceRequests = maintenanceData?.data || [];

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
