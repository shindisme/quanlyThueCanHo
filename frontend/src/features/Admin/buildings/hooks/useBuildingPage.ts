import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useSort } from "../../../../hooks/useSort";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useDeleteBuilding } from "./useDeleteBuilding";
import type { Building } from "../../../../types";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { buildingService } from "../../../../services";

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
    queryFn: () => buildingService.getAllPage(),
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
  const { mutate: removeBuilding, isPending: deleting } = useDeleteBuilding();

  const handleDelete = () => {
    if (!deleteItem) return;
    removeBuilding(deleteItem.id, {
      onSuccess: () => {
        toast.success(`Đã xóa tòa nhà "${deleteItem.branch_name}"`);
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        toast.error(
          getApiErrorMessage(
            error,
            `Không thể xóa. Tòa nhà này hiện đang có căn hộ!`
          )
        );
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
