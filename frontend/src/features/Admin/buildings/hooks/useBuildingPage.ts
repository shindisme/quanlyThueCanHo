import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useSort } from "../../../../hooks/useSort";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useDeleteBuilding } from "./useDeleteBuilding";
import { getAllBuildingsPage } from "../../../../services/buildingService";
import type { Building } from "../../../../types";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

const DEFAULT_PAGE_SIZE = 10;

export function useBuildingPage() {
  const { role, managedBuildingId } = useAuthStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const createModal = useOnOff();
  const modifyModal = useOnOff();
  const [editItem, setEditItem] = useState<Building | null>(null);
  const [deleteItem, setDeleteItem] = useState<Building | null>(null);

  const canEdit = role === "ADMIN";

  // Lấy toàn bộ danh sách tòa nhà 
  const { data: buildings = [], isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => getAllBuildingsPage(),
    select: (res) => res.data,
  });

  // Lọc danh sách theo quyền quản lý và từ khóa tìm kiếm
  const filtered = useMemo(() => {
    let list = buildings;
    if (role === "MANAGER" && managedBuildingId) {
      list = list.filter((b) => b.id === managedBuildingId);
    }
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (b) =>
          b.branch_name.toLowerCase().includes(term) ||
          b.address.toLowerCase().includes(term)
      );
    }
    return list;
  }, [role, buildings, managedBuildingId, debouncedSearch]);

  // Quản lý sắp xếp danh sách
  const { items: sortedBuildings, requestSort, getSortIcon } = useSort(filtered);

  // Phân trang
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: filtered.length,
    initialPageSize: DEFAULT_PAGE_SIZE,
  });

  const paginatedBuildings = useMemo(
    () => sortedBuildings.slice(startIdx, endIdx),
    [sortedBuildings, startIdx, endIdx]
  );

  // Hook xóa tòa nhà
  const { mutate: deleteBuilding, isPending: deleting } = useDeleteBuilding();

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteBuilding(deleteItem.id, {
      onSuccess: () => {
        toast.success(`Đã xóa tòa nhà "${deleteItem.branch_name}"`);
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string; message?: string } } };
        const msg = err.response?.data?.message || err.response?.data?.error;
        toast.error(msg || "Xóa tòa nhà thất bại");
      },
    });
  };

  return {
    role,
    canEdit,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    startIdx,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    loading,
    totalCount: filtered.length,
    totalPages,
    filtered,
    sortedBuildings: paginatedBuildings,
    requestSort,
    getSortIcon,
    handleDelete,
    deleting,
  };
}
