import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import * as tenantService from "../../../../services/tenantService";
import * as authService from "../../../../services/authService";
import * as contractService from "../../../../services/contractService";
import type { RentalContract } from "../../../../types";
import type { Apartment } from "../../../../types";
import type { Tenant } from "../../../../types";
import type { Building } from "../../../../types";
import type { User } from "../../../../types/user";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import { removeVietnameseTones } from "../../../../utils/string";
import { useExtendContract } from "./useExtendContract";
import { useTerminateContract } from "./useTerminateContract";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

interface LocationState {
  openCreateModal?: boolean;
  tenantId?: string | number;
  apartmentId?: string | number;
  buildingId?: string | number;
  floor?: string | number;
  search?: string;
  isNewTenant?: boolean;
}

export function useContractPage() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId, email } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterMonth, setFilterMonth] = useState<number | undefined>();
  const [filterYear, setFilterYear] = useState<number | undefined>();

  // Modals state
  const createContractModal = useOnOff();
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentalContract | null>(null);
  const [selectedDocContract, setSelectedDocContract] = useState<RentalContract | null>(null);
  const [selectedExtendContract, setSelectedExtendContract] = useState<RentalContract | null>(null);
  const [terminateItem, setTerminateItem] = useState<RentalContract | null>(null);
  const [extendEndDate, setExtendEndDate] = useState("");
  const [initialTenantId, setInitialTenantId] = useState<number | undefined>();
  const [initialApartmentId, setInitialApartmentId] = useState<number | undefined>();
  const [initialBuildingId, setInitialBuildingId] = useState<number | undefined>();
  const [initialFloor, setInitialFloor] = useState<number | undefined>();

  const { data: contracts = [], isLoading: loadingContracts, refetch: fetchContracts } = useQuery({
    queryKey: QUERY_KEYS.CONTRACTS,
    queryFn: () => contractService.getAllContractsPage(),
    select: (res) => res.data as unknown as RentalContract[],
  });

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: QUERY_KEYS.BUILDINGS,
    queryFn: () => buildingService.getAllBuildingsPage(),
    select: (res) => res.data as unknown as Building[],
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllApartmentsPage(),
    select: (res) => res.data as unknown as Apartment[],
  });

  const { data: tenantsRes, isLoading: loadingTenants } = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllTenantsPage(),
    select: (res) => res.data,
  });
  const tenants = (tenantsRes as unknown as Tenant[]) || [];

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => authService.getAllUsersPage(),
    select: (res) => res.data as unknown as User[],
  });

  const loading =
    loadingContracts || loadingBuildings || loadingApartments || loadingTenants || loadingUsers;

  const [isNewTenantFromNavigation, setIsNewTenantFromNavigation] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);

  useEffect(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      const stateObj = location.state as LocationState;
      if (stateObj.openCreateModal) {
        setTimeout(() => {
          if (stateObj.tenantId) {
            setInitialTenantId(Number(stateObj.tenantId));
            if (stateObj.isNewTenant) {
              setIsNewTenantFromNavigation(true);
            }
          }
          if (stateObj.apartmentId) {
            setInitialApartmentId(Number(stateObj.apartmentId));
          }
          if (stateObj.buildingId) {
            setInitialBuildingId(Number(stateObj.buildingId));
          }
          if (stateObj.floor) {
            setInitialFloor(Number(stateObj.floor));
          }
          createContractModal.onOpen();
        }, 0);
      }
      if (stateObj.search) {
        setSearch(stateObj.search);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, createContractModal, navigate]);

  const handleCancelCreateContract = () => {
    if (isNewTenantFromNavigation && initialTenantId) {
      setShowConfirmCancelModal(true);
    } else {
      createContractModal.onClose();
      setInitialTenantId(undefined);
    }
  };

  const handleCancelCreateTenant = useMutation({
    mutationFn: (id: number) => tenantService.deleteTenant(id),
    onSuccess: () => {
      toast.success("Đã hủy tạo người thuê mới và xóa thông tin khỏi hệ thống.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
    },
    onError: () => {
      toast.error("Không thể xóa thông tin người thuê vừa tạo.");
    },
    onSettled: () => {
      setShowConfirmCancelModal(false);
      setIsNewTenantFromNavigation(false);
      setInitialTenantId(undefined);
      createContractModal.onClose();
    },
  });

  const handleConfirmCancelCreate = () => {
    if (initialTenantId) {
      handleCancelCreateTenant.mutate(initialTenantId);
    }
  };

  const displayContracts = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const buildingApartmentIds = apartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id);
      return contracts.filter(
        (c) =>
          c.apartment?.building_id === managedBuildingId ||
          buildingApartmentIds.includes(c.apartment_id)
      );
    }
    if (role === "TENANT") {
      const currentUser = users.find((u) => u.username === email);
      const currentTenant = currentUser
        ? tenants.find((t) => t.user_id === currentUser.id)
        : null;
      if (currentTenant) {
        return contracts.filter((c) => c.tenant_id === currentTenant.id);
      }
      return [];
    }
    return contracts;
  })();

  const filteredContracts = displayContracts.filter((c: any) => {
    const apt = c.apartment ?? apartments.find((a: any) => a.id === c.apartment_id);
    
    // Building filter
    if (filterBuilding && apt?.building_id !== filterBuilding) {
      return false;
    }

    // Status filter
    if (filterStatus && c.status !== filterStatus) {
      return false;
    }

    // Month filter
    if (filterMonth) {
      const start = new Date(c.start_date);
      if (start.getMonth() + 1 !== filterMonth) {
        return false;
      }
    }

    // Year filter
    if (filterYear) {
      const start = new Date(c.start_date);
      if (start.getFullYear() !== filterYear) {
        return false;
      }
    }

    const term = removeVietnameseTones(search);
    const code = `HD-${String(c.id).padStart(5, "0")}`;
    const tenant = c.tenant ?? tenants.find((t: any) => t.id === c.tenant_id);
    const tenantName = tenant ? removeVietnameseTones(tenant.full_name) : "";
    const room = apt ? removeVietnameseTones(apt.room_number) : "";

    return (
      code.toLowerCase().includes(term.toLowerCase()) ||
      tenantName.toLowerCase().includes(term.toLowerCase()) ||
      room.toLowerCase().includes(term.toLowerCase())
    );
  });

  // Sorting
  const { items: sortedContracts, requestSort, getSortIcon } = useSort(
    filteredContracts,
    null,
    {
      id: (item) => item.id,
      tenant: (item) =>
        item.tenant?.full_name || tenants.find((t) => t.id === item.tenant_id)?.full_name || "",
      apartment: (item) => {
        const apt = item.apartment ?? apartments.find((a) => a.id === item.apartment_id);
        return apt ? `${apt.room_number}` : "";
      },
      monthly_rent: (item) => Number(item.monthly_rent),
      start_date: (item) => new Date(item.start_date).getTime(),
      end_date: (item) => new Date(item.end_date).getTime(),
      status: (item) => item.status,
    }
  );

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: filteredContracts.length,
    initialPageSize: 10,
  });

  const paginatedContracts = sortedContracts.slice(startIdx, endIdx);

  const extendMutation = useExtendContract();

  function handleExtendContract() {
    if (!selectedExtendContract || !extendEndDate) {
      toast.error("Vui lòng chọn ngày kết thúc mới!");
      return;
    }
    extendMutation.mutate(
      { id: selectedExtendContract.id, newEndDate: extendEndDate },
      {
        onSuccess: () => {
          toast.success("Gia hạn hợp đồng thành công!");
          setSelectedExtendContract(null);
          setExtendEndDate("");
        },
        onError: () => {
          toast.error("Gia hạn hợp đồng thất bại!");
        },
      }
    );
  }

  const terminateMutation = useTerminateContract();

  function handleTerminateContract() {
    if (!terminateItem) return;
    terminateMutation.mutate(
      { id: terminateItem.id },
      {
        onSuccess: () => {
          toast.success("Hủy/thanh lý hợp đồng thành công!");
          setTerminateItem(null);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string; message?: string } } };
          toast.error(
            err.response?.data?.error || err.response?.data?.message || "Hủy hợp đồng thất bại!"
          );
        },
      }
    );
  }

  return {
    role,
    managedBuildingId,
    contracts,
    buildings,
    apartments,
    tenants,
    users,
    loading,
    search,
    setSearch,
    filterBuilding,
    setFilterBuilding,
    filterStatus,
    setFilterStatus,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    createContractModal,
    selectedDetailContract,
    setSelectedDetailContract,
    selectedDocContract,
    setSelectedDocContract,
    selectedExtendContract,
    setSelectedExtendContract,
    extendEndDate,
    setExtendEndDate,
    initialTenantId,
    setInitialTenantId,
    initialApartmentId,
    setInitialApartmentId,
    initialBuildingId,
    setInitialBuildingId,
    initialFloor,
    setInitialFloor,
    filteredContracts,
    sortedContracts,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedContracts,
    handleExtendContract,
    terminateItem,
    setTerminateItem,
    handleTerminateContract,
    terminating: terminateMutation.isPending,
    fetchContracts,
    isNewTenantFromNavigation,
    setIsNewTenantFromNavigation,
    showConfirmCancelModal,
    setShowConfirmCancelModal,
    deletingTenant: handleCancelCreateTenant.isPending,
    handleCancelCreateContract,
    handleConfirmCancelCreate,
    extending: extendMutation.isPending,
  };
}
