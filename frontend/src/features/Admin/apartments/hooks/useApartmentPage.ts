import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import { removeVietnameseTones } from "../../../../utils/string";
import { useDeleteApartment } from "./useDeleteApartment";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { getAllApartmentsPage } from "../../../../services/apartmentService";

export function useApartmentPage() {
  const { role, managedBuildingId } = useUserRole();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFeatured, setFilterFeatured] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );

  const createModal = useOnOff();
  const modifyModal = useOnOff();

  const [editItem, setEditItem] = useState<Apartment | null>(null);
  const [deleteItem, setDeleteItem] = useState<Apartment | null>(null);
  const [featuredIds, setFeaturedIds] = useState<number[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  // Lấy danh sách tòa nhà
  const { data: buildings = [] } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data as unknown as Building[],
  });

  // Lấy danh sách căn hộ
  const { data: apartments = [], isLoading: loading, refetch: fetchApartments } = useQuery({
    queryKey: [QUERY_KEYS.APARTMENTS[0], filterBuilding],
    queryFn: () => getAllApartmentsPage({
      building_id: filterBuilding,
    }),
    select: (res) => {
      const value = res as unknown;
      return (Array.isArray(value) ? value : res.data) as unknown as Apartment[];
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem("featured-apartment-ids");
    if (stored) {
      try {
        setFeaturedIds(JSON.parse(stored));
      } catch {
        /* empty */
      }
    }
  }, []);

  function toggleFeatured(id: number) {
    let updated: number[];
    if (featuredIds.includes(id)) {
      updated = featuredIds.filter((fid) => fid !== id);
      toast.success("Đã bỏ nổi bật căn hộ");
    } else {
      if (featuredIds.length >= 6) {
        toast.warning("Chỉ được phép đặt tối đa 6 căn hộ nổi bật");
        return;
      }
      updated = [...featuredIds, id];
      toast.success("Đã đặt làm nổi bật trên trang chủ");
    }
    setFeaturedIds(updated);
    localStorage.setItem("featured-apartment-ids", JSON.stringify(updated));
  }

  const filtered: Apartment[] = apartments.filter((apt) => {
    if (debouncedSearch) {
      const s = removeVietnameseTones(debouncedSearch.toLowerCase());
      const roomMatch = removeVietnameseTones(apt.room_number.toLowerCase()).includes(s);
      const floorMatch =
        removeVietnameseTones(`tầng ${apt.floor}`.toLowerCase()).includes(s) ||
        String(apt.floor).includes(s);
      const buildingName =
        buildings.find((b) => b.id === apt.building_id)?.branch_name.toLowerCase() || "";
      const buildingMatch = removeVietnameseTones(buildingName).includes(s);
      if (!roomMatch && !floorMatch && !buildingMatch) {
        return false;
      }
    }

    if (filterStatus && apt.status !== filterStatus) {
      return false;
    }

    if (filterFeatured === "featured" && !featuredIds.includes(apt.id)) {
      return false;
    }
    if (filterFeatured === "non-featured" && featuredIds.includes(apt.id)) {
      return false;
    }

    return true;
  });

  const defaultSortedFiltered: Apartment[] = [...filtered].sort((a, b) => {
    const branchA = a.building?.branch_name || "";
    const branchB = b.building?.branch_name || "";
    const branchCompare = branchA.localeCompare(branchB, "vi");
    if (branchCompare !== 0) return branchCompare;

    if (a.floor !== b.floor) {
      return a.floor - b.floor;
    }
    return String(a.room_number).localeCompare(String(b.room_number), undefined, {
      numeric: true,
    });
  });

  const { items: sortedApartments, requestSort, getSortIcon } = useSort(defaultSortedFiltered);

  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const paginatedApartments = sortedApartments.slice(startIdx, endIdx);

  const deleteMutation = useDeleteApartment();

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Đã xóa căn hộ");
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
    managedBuildingId,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterFeatured,
    setFilterFeatured,
    filterBuilding,
    setFilterBuilding,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    featuredIds,
    buildings,
    loading,
    fetchApartments,
    toggleFeatured,
    filtered,
    sortedApartments,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedApartments,
    handleDelete,
    deleting: deleteMutation.isPending,
  };
}
