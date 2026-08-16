import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as staffService from "../../../../services/staffService";
import * as apartmentService from "../../../../services/apartmentService";
import type { Apartment } from "../../../../types";
import { useBuildings } from "../../buildings/hooks/useBuildings";
import { useMaintenances } from "./useMaintenances";
import { useMaintenanceAssign } from "./useMaintenanceAssign";
import { useMaintenanceComplete } from "./useMaintenanceComplete";
import { useMaintenanceUnable } from "./useMaintenanceUnable";
import { queryKeys } from "../../../../constants/queryKeys";

export function useMaintenancePage() {
  const { role, managedBuildingId } = useAuthStore();

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [floorFilter, setFloorFilter] = useState<string>("");

  const assign = useMaintenanceAssign();
  const complete = useMaintenanceComplete();
  const unable = useMaintenanceUnable();

  // hook lấy danh sách yêu cầu sửa chữa
  const { data: requests = [], isLoading: loadingRequests } = useMaintenances({
    statusFilter,
    priorityFilter,
    buildingFilter,
  });

  // hook lấy danh sách tòa nhà
  const { data: buildingsData = [], isLoading: loadingBuildings } = useBuildings();
  const buildings = useMemo(() => (role === "ADMIN" ? buildingsData : []), [role, buildingsData]);

  // Fetch danh sách căn hộ để tính số tầng khả dụng
  const { data: apartments = [] } = useQuery({
    queryKey: queryKeys.apartments.all,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data as Apartment[],
  });

  const availableFloors = useMemo(() => {
    const targetBuildingId = role === "MANAGER" ? managedBuildingId : (buildingFilter ? Number(buildingFilter) : null);
    const apts = targetBuildingId
      ? apartments.filter((a) => a.building_id === targetBuildingId)
      : apartments;
    const floors = Array.from(new Set(apts.map((a) => a.floor))).sort((a, b) => a - b);
    return floors;
  }, [apartments, buildingFilter, role, managedBuildingId]);

  const activeRequest = assign.selectedRequest || complete.selectedRequest || unable.selectedRequest;

  const selectedBuildingId = useMemo(() => {
    return (
      activeRequest?.apartment?.building_id ||
      activeRequest?.apartment?.building?.id ||
      (role === "MANAGER" ? managedBuildingId : undefined)
    );
  }, [activeRequest, role, managedBuildingId]);

  // Fetch danh sách nhân viên kỹ thuật
  const { data: staffRes, isLoading: loadingStaff } = useQuery({
    queryKey: queryKeys.staff.technicians(selectedBuildingId),
    queryFn: () => staffService.getAllPage(selectedBuildingId ? { building_id: Number(selectedBuildingId) } : undefined),
    enabled: role !== "STAFF" && !!selectedBuildingId,
  });

  const technicians = useMemo(() => {
    return (staffRes?.data || []).filter(
      (s) => !s.position || !s.position.toLowerCase().includes("quản lý")
    );
  }, [staffRes?.data]);

  const loading = loadingRequests || loadingBuildings;
  const saving = assign.isPending || complete.isPending || unable.isPending;

  return {
    requests,
    buildings,
    technicians,
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
    saving,
    role,
    managedBuildingId,

    // Modal phân công
    assign,

    // Modal báo cáo không thể sửa
    unable,

    // Modal hoàn thành
    complete,
  };
}
