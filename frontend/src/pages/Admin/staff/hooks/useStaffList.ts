import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { toast } from "sonner";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import type { Staff } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { removeVietnameseTones } from "../../../../utils/string";

export function useStaffList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useAuthStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [positionFilter, setPositionFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | "">("");

  const createModal = useOnOff();
  const modifyModal = useOnOff();

  const [editItem, setEditItem] = useState<Staff | null>(null);
  const [deleteItem, setDeleteItem] = useState<Staff | null>(null);
  const [viewItem, setViewItem] = useState<Staff | null>(null);

  const { data: staffRes, isLoading: loadingStaff, refetch: fetchStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAllStaff(),
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingPages(),
  });

  const staffList = staffRes?.data || [];
  const loading = loadingStaff || loadingBuildings;

  function loadData() {
    fetchStaff();
  }

  const displayStaff = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      return staffList.filter((s) => s.building_id === managedBuildingId);
    }
    return staffList;
  })();

  const filtered = displayStaff.filter((s) => {
    const term = removeVietnameseTones(debouncedSearch);
    const nameNorm = removeVietnameseTones(s.full_name);
    const phoneNorm = removeVietnameseTones(s.phone || "");
    const matchSearch = nameNorm.includes(term) || phoneNorm.includes(term);

    const matchPosition = !positionFilter || s.position === positionFilter;
    const matchBuilding =
      buildingFilter === "" || s.building_id === Number(buildingFilter);

    return matchSearch && matchPosition && matchBuilding;
  });

  const pagination = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginated = filtered.slice(pagination.startIdx, pagination.endIdx);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => staffService.deleteStaff(id),
    onSuccess: () => {
      toast.success("Đã xóa nhân viên thành công!");
      setDeleteItem(null);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xóa nhân viên thất bại");
    },
  });

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id);
  }

  function getBuildingName(bId: number | null): string {
    if (!bId) return "Chưa gán";
    return buildings.find((b) => b.id === bId)?.branch_name || `Tòa nhà #${bId}`;
  }

  return {
    role,
    managedBuildingId,
    staffList,
    buildings,
    loading,
    search,
    setSearch,
    positionFilter,
    setPositionFilter,
    buildingFilter,
    setBuildingFilter,
    currentPage: pagination.currentPage,
    setCurrentPage: pagination.setCurrentPage,
    totalPages: pagination.totalPages,
    pageSize: pagination.pageSize,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    filtered,
    paginated,
    handleDelete,
    getBuildingName,
    loadData,
  };
}
