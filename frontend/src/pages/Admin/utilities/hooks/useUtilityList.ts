import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth.store";
import { useSort } from "../common/useSort";
import { useDebounce } from "../common/useDebounce";
import { usePagination } from "../common/usePagination";
import { removeVietnameseTones } from "../../utils/string";
import * as utilityService from "../../services/utilityService";
import type { UtilityReadingData } from "../../services/utilityService";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import type { ApartmentData } from "../../services/apartmentService";

export function useUtilityList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useAuthStore();
  const isWritable = role === "ADMIN" || role === "MANAGER" || role === "STAFF";

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
  const [deleteItem, setDeleteItem] = useState<UtilityReadingData | null>(null);

  const readingsParams: Parameters<typeof utilityService.getAllUtilityReadings>[0] = { limit: 100 };
  if (role !== "ADMIN" && managedBuildingId) {
    readingsParams.building_id = managedBuildingId;
  }

  const { data: readingsRes, isLoading: loadingReadings, refetch: refetchReadings } = useQuery({
    queryKey: ["utilityReadings", role, managedBuildingId],
    queryFn: () => utilityService.getAllUtilityReadings(readingsParams),
  });
  const readings = readingsRes?.data || [];

  const { data: buildingsRes, isLoading: loadingBuildings, refetch: refetchBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });
  const buildings = buildingsRes?.data || [];

  const aptParams: Parameters<typeof apartmentService.getAllApartments>[0] = { limit: 100 };
  if (role !== "ADMIN" && managedBuildingId) {
    aptParams.building_id = managedBuildingId;
  }

  const { data: apartmentsRes, isLoading: loadingApartments, refetch: refetchApartments } = useQuery({
    queryKey: ["apartments", role, managedBuildingId],
    queryFn: () => apartmentService.getAllApartments(aptParams),
  });
  const apartments = apartmentsRes?.data || [];

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
      toast.error("Không thể tải dữ liệu điện nước");
      console.error(error);
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

  const handleOpenDeleteModal = (item: UtilityReadingData) => {
    setDeleteItem(item);
  };

  // Confirm delete handler
  const deleteMutation = useMutation({
    mutationFn: (id: number) => utilityService.deleteUtilityReading(id),
    onSuccess: () => {
      toast.success("Xóa chỉ số điện nước thành công");
      setDeleteItem(null);
      queryClient.invalidateQueries({ queryKey: ["utilityReadings"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể xóa bản ghi");
    }
  });

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id);
  };

  // Filter logic
  const filteredRentedApartments = apartments.filter((apt) => {
    const term = removeVietnameseTones(debouncedSearch);
    const roomNorm = removeVietnameseTones(apt.room_number || "");
    const buildingNorm = removeVietnameseTones(apt.building?.branch_name || "");

    const matchesSearch = roomNorm.includes(term) || buildingNorm.includes(term);
    const matchesBuilding = !filterBuilding || apt.building_id === Number(filterBuilding);
    const matchesFloor = !filterFloor || apt.floor === Number(filterFloor);
    const isRented = apt.status === "RENTED";

    return matchesSearch && matchesBuilding && matchesFloor && isRented;
  });

  const defaultSorted = [...filteredRentedApartments].sort((a, b) => {
    const branchA = a.building?.branch_name || "";
    const branchB = b.building?.branch_name || "";
    const branchCompare = branchA.localeCompare(branchB, "vi");
    if (branchCompare !== 0) return branchCompare;

    if (a.floor !== b.floor) return a.floor - b.floor;

    const roomA = String(a.room_number);
    const roomB = String(b.room_number);
    return roomA.localeCompare(roomB, undefined, { numeric: true });
  });

  const { items: sortedApartments, requestSort, getSortIcon } = useSort(defaultSorted);

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

  // Helper options for filtering
  const filterFloorOptions = (() => {
    if (!filterBuilding) return [];
    const b = buildings.find((x) => x.id === Number(filterBuilding));
    if (!b) return [];
    return Array.from({ length: b.total_floors }, (_, i) => ({
      value: String(i + 1),
      label: `Tầng ${i + 1}`,
    }));
  })();

  const getMonthOptions = () => {
    return Array.from({ length: 12 }).map((_, idx) => ({
      value: String(idx + 1),
      label: `Tháng ${idx + 1}`,
    }));
  };

  const getYearOptions = () => {
    const yearsFromReadings = readings.map((r) => r.year);
    const currentYear = new Date().getFullYear();
    const uniqueYears = Array.from(new Set([...yearsFromReadings, currentYear]));
    return uniqueYears
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: `Năm ${y}` }));
  };

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
    deleteItem,
    setDeleteItem,
    // Handlers
    fetchData,
    handleOpenCreateModal,
    handleOpenModifyModal,
    handleOpenDeleteModal,
    handleConfirmDelete,
    filteredRentedApartments,
    paginatedApartments,
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
