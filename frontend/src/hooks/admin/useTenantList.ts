import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { removeVietnameseTones } from "../../utils/string";
import * as tenantService from "../../services/tenantService";
import * as contractService from "../../services/contractService";
import * as apartmentService from "../../services/apartmentService";
import * as buildingService from "../../services/buildingService";
import type { Tenant, RentalContract } from "../../types";

import { useDebounce } from "../common/useDebounce";
import { useOnOff } from "../common/useOnOff";
import { usePagination } from "../common/usePagination";
import { useUserRole } from "../common/useUserRole";

export function useTenantList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const createModal = useOnOff();
  const modifyModal = useOnOff();

  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const [viewItem, setViewItem] = useState<Tenant | null>(null);

  const { data: tenantsRes, isLoading: loadingTenants, refetch: refetchTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
  });
  const tenants = tenantsRes?.data || [];

  const { data: contractsRes, isLoading: loadingContracts, refetch: refetchContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
  });
  const contracts = contractsRes || [];

  const { data: apartmentsRes, isLoading: loadingApartments, refetch: refetchApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartments({ limit: 100 }),
  });
  const apartments = apartmentsRes?.data || [];

  const { data: buildingsRes, isLoading: loadingBuildings, refetch: refetchBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });
  const buildings = buildingsRes?.data || [];

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
        .filter((c: RentalContract) => managerApartmentIds.includes(c.apartment_id))
        .map((c: RentalContract) => c.tenant_id);
      return tenants.filter((t) => managerTenantIds.includes(t.id));
    }
    return tenants;
  })();

  const displayTenantsWithContracts = displayTenants.map((t) => {
    const tenantContracts = contracts.filter((c) => c.tenant_id === t.id);
    const activeContract = tenantContracts.find((c) => c.status === "ACTIVE") || tenantContracts[0];

    if (activeContract) {
      const apt = apartments.find((a) => a.id === activeContract.apartment_id);
      const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
      return {
        ...t,
        contracts: [
          {
            ...activeContract,
            apartment: apt ? {
              ...apt,
              building: bld,
            } : undefined,
          },
        ],
      } as unknown as Tenant;
    }
    return { ...t, contracts: [] } as unknown as Tenant;
  });

  const filtered = displayTenantsWithContracts.filter((t) => {
    const term = removeVietnameseTones(debouncedSearch);
    const nameNorm = removeVietnameseTones(t.full_name);
    const citizenNorm = removeVietnameseTones(t.citizen_id);
    return nameNorm.includes(term) || citizenNorm.includes(term);
  });

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    endIdx,
  } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 10,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tenantService.deleteTenant(id),
    onSuccess: () => {
      setDeleteItem(null);
      toast.success("Đã xóa người thuê");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xóa người thuê thất bại");
    },
  });

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id);
  }

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
    loadData,
    handleDelete,
    loading,
    role,
    managedBuildingId,
  };
}
