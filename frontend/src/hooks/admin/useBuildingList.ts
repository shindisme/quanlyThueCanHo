import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth.store";
import { useDebounce } from "../common/useDebounce";
import { useSort } from "../common/useSort";
import * as buildingService from "../../services/buildingService";
import type { BuildingData } from "../../services/buildingService";
import { toast } from "sonner";

export function useBuildingList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useAuthStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<BuildingData | null>(null);
  const [deleteItem, setDeleteItem] = useState<BuildingData | null>(null);

  const [status] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Lấy danh sách tòa nhà
  const { data: buildingsRes, isLoading: loading, refetch: fetchBuildings } = useQuery({
    queryKey: ["buildings", currentPage, debouncedSearch, status],
    queryFn: () => buildingService.getAllBuildings({
      page: currentPage,
      limit: pageSize,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
  });

  const buildings = buildingsRes?.data || [];
  const totalPages = buildingsRes?.pagination?.totalPages || 1;
  const totalCount = buildingsRes?.pagination?.total || 0;

  const filtered = role === "MANAGER"
    ? buildings.filter((b) => b.id === managedBuildingId)
    : buildings;

  const { items: sortedBuildings, requestSort, getSortIcon } = useSort(filtered);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => buildingService.deleteBuilding(id),
    onSuccess: () => {
      if (deleteItem) {
        toast.success(`Đã xóa tòa nhà "${deleteItem.name}"`);
      }
      setDeleteItem(null);
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Xóa thất bại");
    },
  });

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id);
  }

  return {
    role,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
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
  };
}
