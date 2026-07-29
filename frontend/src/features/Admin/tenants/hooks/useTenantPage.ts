import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { removeVietnameseTones } from "../../../../utils/string";
import * as tenantService from "../../../../services/tenantService";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as buildingService from "../../../../services/buildingService";
import type { Tenant } from "../../../../types";
import type { Building } from "../../../../types";
import type { Apartment } from "../../../../types";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useDeleteTenant } from "./useDeleteTenant";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

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
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllTenantsPage(),
    select: (res) => res.data as unknown as Tenant[],
  });
  const tenants = tenantsRes || [];

  const { data: contractsRes, isLoading: loadingContracts, refetch: refetchContracts } = useQuery({
    queryKey: QUERY_KEYS.CONTRACTS,
    queryFn: () => contractService.getAllContractsPage(),
    select: (res) => res.data,
  });
  const contracts = contractsRes || [];

  const { data: apartments = [], isLoading: loadingApartments, refetch: refetchApartments } = useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllApartmentsPage(),
    select: (res) => res.data as unknown as Apartment[],
  });

  const { data: buildings = [], isLoading: loadingBuildings, refetch: refetchBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data as unknown as Building[],
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
    const activeContract = tenantContracts.find((c) => c.status === "ACTIVE");

    if (activeContract) {
      const apt =
        activeContract.apartment ?? apartments.find((a) => a.id === activeContract.apartment_id);
      const bld =
        apt?.building ?? (apt ? buildings.find((b) => b.id === apt.building_id) : null);
      return {
        ...t,
        contracts: [
          {
            ...activeContract,
            apartment: apt
              ? {
                ...apt,
                building: bld ?? undefined,
              }
              : undefined,
          },
        ],
      } as unknown as Tenant;
    }
    return { ...t, contracts: [] } as unknown as Tenant;
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
    const activeContract = t.contracts?.[0];

    // Lọc theo tòa nhà
    if (role === "ADMIN" && selectedBuilding) {
      if (!activeContract || activeContract.apartment?.building_id !== Number(selectedBuilding)) {
        return false;
      }
    }

    // Lọc theo tầng
    if (selectedFloor) {
      if (!activeContract || activeContract.apartment?.floor !== Number(selectedFloor)) {
        return false;
      }
    }

    // Lọc theo trạng thái Đang thuê / Ngừng thuê
    if (selectedStatus) {
      const hasActiveContract = !!activeContract;
      if (selectedStatus === "ACTIVE" && !hasActiveContract) return false;
      if (selectedStatus === "INACTIVE" && hasActiveContract) return false;
    }

    const term = removeVietnameseTones(debouncedSearch);
    if (!term) return true;
    const nameNorm = removeVietnameseTones(t.full_name);
    const citizenNorm = removeVietnameseTones(t.citizen_id);
    return nameNorm.includes(term) || citizenNorm.includes(term);
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: filtered.length,
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
        const err = error as { response?: { data?: { message?: string; error?: string } } };
        toast.error(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Xóa người thuê thất bại"
        );
      },
    });
  }

  const paginated = filtered.slice(startIdx, endIdx);

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
