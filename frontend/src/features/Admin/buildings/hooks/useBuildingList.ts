import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useSort } from "../../../../hooks/useSort";
import { useOnOff } from "../../../../hooks/useOnOff";
import { useDeleteBuilding } from "./useDeleteBuilding";
import { getAllBuildings } from "../../../../services/buildingService";
import type { Building } from "../../../../types";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useBuildingList() {
  const { role, managedBuildingId } = useAuthStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const createModal = useOnOff();
  const modifyModal = useOnOff();
  const [editItem, setEditItem] = useState<Building | null>(null);
  const [deleteItem, setDeleteItem] = useState<Building | null>(null);

  const [status] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Lấy danh sách tòa nhà
  const { data: buildingsRes, isLoading: loading, refetch: fetchBuildings } = useQuery({
    queryKey: [QUERY_KEYS.BUILDINGS[0], currentPage, debouncedSearch, status],
    queryFn: () =>
      getAllBuildings({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
      }),
  });

  const buildings = (buildingsRes?.data as unknown as Building[]) || [];
  const totalPages = buildingsRes?.pagination?.totalPages || 1;
  const totalCount = buildingsRes?.pagination?.total || 0;

  const filtered =
    role === "MANAGER"
      ? buildings.filter((b) => b.id === managedBuildingId)
      : buildings;

  const { items: sortedBuildings, requestSort, getSortIcon } = useSort(filtered);

  const deleteMutation = useDeleteBuilding();

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success(`Đã xóa tòa nhà "${deleteItem.branch_name}"`);
        setDeleteItem(null);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Xóa thất bại");
      },
    });
  }

  return {
    role,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    loading,
    totalCount,
    totalPages,
    filtered,
    sortedBuildings,
    requestSort,
    getSortIcon,
    handleDelete,
    fetchBuildings,
    deleting: deleteMutation.isPending,
  };
}
