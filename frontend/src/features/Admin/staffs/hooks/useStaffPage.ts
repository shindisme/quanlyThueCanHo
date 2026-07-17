import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { toast } from "sonner";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import type { Staff } from "../../../../types";
import type { Building } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { removeVietnameseTones } from "../../../../utils/string";
import { useDeleteStaff } from "./useDeleteStaff";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useStaffPage() {
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
    queryKey: QUERY_KEYS.STAFF,
    queryFn: () => staffService.getAllStaffsPage(),
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data as unknown as Building[],
  });

  const staffList = (staffRes?.data as unknown as Staff[]) || [];
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

  const deleteMutation = useDeleteStaff();

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa nhân viên thành công!");
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Xóa nhân viên thất bại");
      },
    });
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
    deleting: deleteMutation.isPending,
  };
}
