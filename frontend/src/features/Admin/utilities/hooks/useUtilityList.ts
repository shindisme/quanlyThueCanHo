import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { useSort } from "../../../../hooks/useSort";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { removeVietnameseTones, formatApartmentDisplay } from "../../../../utils/string";
import { getMonthOptions, getYearOptions } from "../../../../utils/date";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import * as utilityService from "../../../../services/utilityService";
import type { UtilityReadingData } from "../../../../services/utilityService";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import type { ApartmentData } from "../../../../services/apartmentService";
import * as maintenanceService from "../../../../services/maintenanceService";
import { isUtilityTrackedApartment } from "../utils/utilityApartment";
import { getFloorOptions } from "../utils/utilityForm";

export function useUtilityList() {
  const { role, managedBuildingId, email, token, setAuth } = useAuthStore();
  const isWritable = role === "MANAGER" || role === "STAFF";

  const { data: maintenanceData } = useQuery({
    queryKey: ["maintenanceRequestsFallback"],
    queryFn: () => maintenanceService.getAll({ limit: 50 }),
    enabled: (role === "MANAGER" || role === "STAFF") && !managedBuildingId,
  });

  useEffect(() => {
    if ((role === "MANAGER" || role === "STAFF") && !managedBuildingId && email && token && maintenanceData?.data) {
      const firstWithBuilding = maintenanceData.data.find(
        (r) => r.apartment?.building_id || r.assigned_staff?.building_id
      );
      if (firstWithBuilding) {
        const bId = firstWithBuilding.apartment?.building_id || firstWithBuilding.assigned_staff?.building_id;
        const bName = firstWithBuilding.apartment?.building?.branch_name || "";
        if (bId) {
          setAuth(token, role, email, bId, bName);
        }
      }
    }
  }, [role, managedBuildingId, maintenanceData, email, token, setAuth]);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [filterBuilding, setFilterBuilding] = useState<string>("");
  const [filterFloor, setFilterFloor] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  // Modal Triggers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<UtilityReadingData | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [preselectedApartment, setPreselectedApartment] = useState<ApartmentData | null>(null);

  const selectedMonth = Number(filterMonth) || undefined;
  const selectedYear = Number(filterYear) || undefined;
  const selectedBuildingId = role !== "ADMIN" && managedBuildingId
    ? managedBuildingId
    : filterBuilding
      ? Number(filterBuilding)
      : undefined;
  const readingsParams: Parameters<typeof utilityService.getAllPage>[0] = {};
  if (selectedMonth !== undefined) readingsParams.month = selectedMonth;
  if (selectedYear !== undefined) readingsParams.year = selectedYear;
  if (selectedBuildingId !== undefined) readingsParams.building_id = selectedBuildingId;

  const { data: readingsRes, isLoading: loadingReadings, refetch: refetchReadings } = useQuery({
    queryKey: [...QUERY_KEYS.UTILITIES, role, managedBuildingId, filterBuilding, filterMonth, filterYear],
    queryFn: () => utilityService.getAllPage(readingsParams),
    select: (res) => res.data,
  });
  const readings = readingsRes || [];

  const { data: buildings = [], isLoading: loadingBuildings, refetch: refetchBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const aptParams: { building_id?: number; search?: string; status?: string } = {};
  if (role !== "ADMIN" && managedBuildingId) {
    aptParams.building_id = managedBuildingId;
  }

  const { data: apartments = [], isLoading: loadingApartments, refetch: refetchApartments } = useQuery({
    queryKey: [...QUERY_KEYS.APARTMENTS, role, managedBuildingId],
    queryFn: () => apartmentService.getAllPage(aptParams),
    select: (res) => res.data,
  });

  const loading = loadingReadings || loadingBuildings || loadingApartments;

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        refetchReadings(),
        refetchBuildings(),
        refetchApartments(),
      ]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải dữ liệu điện nước"));
    }
  }, [refetchReadings, refetchBuildings, refetchApartments]);

  useEffect(() => {
    if (role !== "ADMIN" && managedBuildingId) {
      setFilterBuilding(String(managedBuildingId));
    }
  }, [role, managedBuildingId]);

  // Open modal triggers
  const handleOpenCreateModal = (preselectedApt: ApartmentData | null = null) => {
    setPreselectedApartment(preselectedApt);
    setShowCreateModal(true);
  };

  const handleOpenModifyModal = (item: UtilityReadingData, viewOnly: boolean) => {
    setEditItem(item);
    setIsViewOnly(viewOnly);
    setShowModifyModal(true);
  };

  // Filter logic
  const filteredRentedApartments = useMemo(() => {
    const term = removeVietnameseTones(debouncedSearch.trim());
    return (apartments as ApartmentData[]).filter((apt: ApartmentData) => {
      const roomNorm = removeVietnameseTones(apt.room_number || "");
      const buildingNorm = removeVietnameseTones(apt.building?.branch_name || "");

      const matchesSearch = !term || roomNorm.includes(term) || buildingNorm.includes(term);
      const matchesBuilding = !filterBuilding || apt.building_id === Number(filterBuilding);
      const matchesFloor = !filterFloor || apt.floor === Number(filterFloor);
      const isRented = isUtilityTrackedApartment(apt.status);

      return matchesSearch && matchesBuilding && matchesFloor && isRented;
    });
  }, [apartments, debouncedSearch, filterBuilding, filterFloor]);

  const defaultSorted = useMemo(() => {
    return [...filteredRentedApartments].sort((a, b) => {
      const branchA = a.building?.branch_name || "";
      const branchB = b.building?.branch_name || "";
      const branchCompare = branchA.localeCompare(branchB, "vi");
      if (branchCompare !== 0) return branchCompare;

      if (a.floor !== b.floor) return a.floor - b.floor;

      const roomA = String(a.room_number);
      const roomB = String(b.room_number);
      return roomA.localeCompare(roomB, undefined, { numeric: true });
    });
  }, [filteredRentedApartments]);

  const aptIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    defaultSorted.forEach((item, idx) => map.set(item.id, idx + 1));
    return map;
  }, [defaultSorted]);

  const customExtractors = useMemo(
    () => ({
      index: (apt: ApartmentData) => aptIndexMap.get(apt.id) ?? apt.id,
      room: (apt: ApartmentData) => formatApartmentDisplay(apt.room_number, apt.floor),
    }),
    [aptIndexMap]
  );

  const { items: sortedApartments, requestSort, getSortIcon, sortConfig } = useSort(
    defaultSorted,
    null,
    customExtractors
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    endIdx,
    pageSize,
  } = usePagination({
    totalItems: filteredRentedApartments.length,
    initialPageSize: 15,
  });

  const paginatedApartments = sortedApartments.slice(startIdx, endIdx);

  const isLockedMonth = (selectedMonth: number, selectedYear: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = currentYear - 1;
    }

    if (selectedYear < prevYear) return true;
    if (selectedYear === prevYear && selectedMonth < prevMonth) return true;
    return false;
  };

  const filterFloorOptions = useMemo(
    () => getFloorOptions(buildings, filterBuilding),
    [buildings, filterBuilding]
  );

  return {
    role,
    managedBuildingId,
    isWritable,
    readings,
    buildings,
    apartments,
    loading,
    search,
    setSearch,
    filterBuilding,
    setFilterBuilding,
    filterFloor,
    setFilterFloor,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    currentPage,
    setCurrentPage,
    // Modals
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
    editItem,
    setEditItem,
    isViewOnly,
    setIsViewOnly,
    preselectedApartment,
    setPreselectedApartment,
    // Handlers
    fetchData,
    handleOpenCreateModal,
    handleOpenModifyModal,
    filteredRentedApartments,
    paginatedApartments,
    sortConfig,
    requestSort,
    getSortIcon,
    totalPages,
    pageSize,
    isLockedMonth,
    filterFloorOptions,
    getMonthOptions,
    getYearOptions,
  };
}
