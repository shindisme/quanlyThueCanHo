import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { removeVietnameseTones } from "../../../../utils/string";
import * as tenantService from "../../../../services/tenantService";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as buildingService from "../../../../services/buildingService";
import type { Tenant } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useDeleteTenant } from "./useDeleteTenant";
import { queryKeys } from "../../../../constants/queryKeys";
import { getPreferredContract } from "../../../../utils/contract";

export function useTenantPage() {
  const { role, managedBuildingId } = useUserRole();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const createModal = useOnOff();
  const modifyModal = useOnOff();

  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const [viewItem, setViewItem] = useState<Tenant | null>(null);

  const { data: tenantsRes, isLoading: loadingTenants, refetch: refetchTenants } = useQuery({
    queryKey: queryKeys.tenants.all,
    queryFn: () => tenantService.getAllPage(),
    select: (res) => res.data,
  });
  const tenants = tenantsRes || [];

  const { data: contractsRes, isLoading: loadingContracts, refetch: refetchContracts } = useQuery({
    queryKey: queryKeys.contracts.all,
    queryFn: () => contractService.getAllPage(),
    select: (res) => res.data,
  });
  const contracts = contractsRes || [];

  const { data: apartments = [], isLoading: loadingApartments, refetch: refetchApartments } = useQuery({
    queryKey: queryKeys.apartments.all,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data,
  });

  const { data: buildings = [], isLoading: loadingBuildings, refetch: refetchBuildings } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data,
  });

  const loading = loadingTenants || loadingContracts || loadingApartments || loadingBuildings;

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        refetchTenants(),
        refetchContracts(),
        refetchApartments(),
        refetchBuildings(),
      ]);
    } catch {
      toast.error("Không thể tải danh sách người thuê");
    }
  }, [refetchTenants, refetchContracts, refetchApartments, refetchBuildings]);

  const displayTenants = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const managerApartmentIds = apartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id);
      const managerTenantIds = contracts
        .filter(
          (c) =>
            c.apartment?.building_id === managedBuildingId ||
            managerApartmentIds.includes(c.apartment_id)
        )
        .map((c) => c.tenant_id);
      return tenants.filter((t) => managerTenantIds.includes(t.id));
    }
    return tenants;
  })();

  const displayTenantsWithContracts = displayTenants.map((t) => {
    const tenantContracts = t.contracts?.length
      ? t.contracts
      : contracts.filter((c) => c.tenant_id === t.id);

    const mappedContracts = tenantContracts.map((c) => {
      const apt =
        c.apartment ?? apartments.find((a) => a.id === c.apartment_id);
      const bld =
        apt?.building ?? (apt ? buildings.find((b) => b.id === apt.building_id) : null);
      return {
        ...c,
        apartment: apt
          ? {
              ...apt,
              building: bld ?? undefined,
            }
          : undefined,
      };
    });

    mappedContracts.sort((a, b) => {
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
      return (b.id || 0) - (a.id || 0);
    });

    return {
      ...t,
      contracts: mappedContracts,
    };
  });

  const availableFloors = useMemo(() => {
    const targetBuildingId =
      role === "MANAGER"
        ? managedBuildingId
        : selectedBuilding
          ? Number(selectedBuilding)
          : null;
    const apts = targetBuildingId
      ? apartments.filter((a) => a.building_id === targetBuildingId)
      : apartments;
    const floors = Array.from(new Set(apts.map((a) => a.floor))).sort((a, b) => a - b);
    return floors;
  }, [apartments, selectedBuilding, role, managedBuildingId]);

  const filtered = displayTenantsWithContracts.filter((t) => {
    const activeContract = t.contracts?.find((c) => c.status === "ACTIVE");
    const preferredContract = getPreferredContract(t.contracts);

    // Lọc theo tòa nhà
    if (role === "ADMIN" && selectedBuilding) {
      if (!preferredContract || preferredContract.apartment?.building_id !== Number(selectedBuilding)) {
        return false;
      }
    }

    // Lọc theo tầng
    if (selectedFloor) {
      if (!preferredContract || preferredContract.apartment?.floor !== Number(selectedFloor)) {
        return false;
      }
    }

    // Lọc theo trạng thái Đang thuê / Ngừng thuê
    if (selectedStatus) {
      const hasActiveContract = !!activeContract;
      if (selectedStatus === "ACTIVE" && !hasActiveContract) return false;
      if (selectedStatus === "INACTIVE" && hasActiveContract) return false;
    }

    const rawSearch = debouncedSearch.trim();
    const term = removeVietnameseTones(rawSearch).toLowerCase();
    if (!term) return true;
    const cleanRoomTerm = term.replace(/^(phong|p\.|p\s*)/i, "").trim();

    const nameNorm = removeVietnameseTones(t.full_name || "").toLowerCase();
    const citizenNorm = removeVietnameseTones(t.citizen_id || "").toLowerCase();
    const phoneNorm = (t.phone || "").toLowerCase();
    const emailNorm = (t.email || "").toLowerCase();

    // Tìm theo phòng căn hộ đang thuê hoặc từng thuê
    const matchApartment = t.contracts?.some((c) => {
      const roomNum = (c.apartment?.room_number || "").toLowerCase();
      const roomNorm = removeVietnameseTones(roomNum);
      const branchNorm = removeVietnameseTones(
        c.apartment?.building?.branch_name || c.apartment?.building?.name || ""
      ).toLowerCase();
      const addressNorm = removeVietnameseTones(c.apartment?.building?.address || "").toLowerCase();

      return (
        roomNum.includes(term) ||
        roomNorm.includes(term) ||
        (cleanRoomTerm !== "" && (roomNum.includes(cleanRoomTerm) || roomNorm.includes(cleanRoomTerm))) ||
        branchNorm.includes(term) ||
        addressNorm.includes(term)
      );
    });

    return (
      nameNorm.includes(term) ||
      citizenNorm.includes(term) ||
      phoneNorm.includes(term) ||
      emailNorm.includes(term) ||
      Boolean(matchApartment)
    );
  });

  const { items: sorted, requestSort, sortConfig } = useSort(filtered, null, {
    name: (tenant) => tenant.full_name,
    apartment: (tenant) => {
      const apartment = getPreferredContract(tenant.contracts)?.apartment;
      return apartment
        ? `${apartment.building?.branch_name || ""}-${apartment.floor}-${apartment.room_number}`
        : "";
    },
    phone: (tenant) => tenant.phone || "",
    citizen_id: (tenant) => tenant.citizen_id,
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sorted.length,
    initialPageSize: 10,
  });

  const deleteMutation = useDeleteTenant();

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        setDeleteItem(null);
        toast.success("Đã xóa người thuê");
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string; error?: string }; status?: number } };
        const backendMessage = err.response?.data?.message || err.response?.data?.error;


        if (backendMessage && backendMessage !== "Đã xảy ra lỗi hệ thống") {
          toast.error(backendMessage);
        } else {
          toast.error(
            "Không thể xóa người thuê: Hồ sơ người thuê này đã có liên kết dữ liệu trong hệ thống."
          );
        }
      },
    });
  }

  const paginated = sorted.slice(startIdx, endIdx);

  return {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    endIdx,
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
    requestSort,
    sortConfig,
    loadData,
    handleDelete,
    loading,
    role,
    managedBuildingId,
    selectedBuilding,
    setSelectedBuilding,
    selectedFloor,
    setSelectedFloor,
    selectedStatus,
    setSelectedStatus,
    availableFloors,
    buildings,
    deleting: deleteMutation.isPending,
  };
}
