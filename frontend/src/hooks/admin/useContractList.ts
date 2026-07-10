import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import * as tenantService from "../../services/tenantService";
import * as authService from "../../services/authService";
import * as contractService from "../../services/contractService";
import type { RentalContract, User } from "../../types";
import { useDebounce } from "../common/useDebounce";
import { useOnOff } from "../common/useOnOff";
import { usePagination } from "../common/usePagination";
import { useUserRole } from "../common/useUserRole";
import { useSort } from "../common/useSort";
import { removeVietnameseTones } from "../../utils/string";

interface LocationState {
  openCreateModal?: boolean;
  tenantId?: string | number;
  apartmentId?: string | number;
  buildingId?: string | number;
  floor?: string | number;
  search?: string;
}

export function useContractList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId, email } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modals state
  const createModal = useOnOff();
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
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
  });

  const { data: buildingsRes, isLoading: loadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
  });
  const buildings = buildingsRes?.data || [];

  const { data: apartmentsRes, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments", "all"],
    queryFn: async () => {
      const pages = [1, 2, 3, 4, 5, 6, 7];
      const resList = await Promise.all(
        pages.map((p) => apartmentService.getAllApartments({ limit: 100, page: p }))
      );
      const combined = resList.flatMap((r) => r.data);
      return combined.filter((a, index, self) => self.findIndex(t => t.id === a.id) === index);
    }
  });
  const apartments = apartmentsRes || [];

  const { data: tenantsRes, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
  });
  const tenants = tenantsRes?.data || [];

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const uRes = await authService.getAllUsers();
      return uRes as unknown as User[];
    }
  });

  const loading = loadingContracts || loadingBuildings || loadingApartments || loadingTenants || loadingUsers;

  const [isNewTenantFromNavigation, setIsNewTenantFromNavigation] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);

  useEffect(() => {
    if (location.state) {
      const stateObj = location.state as LocationState;
      if (stateObj.openCreateModal) {
        setTimeout(() => {
          if (stateObj.tenantId) {
            setInitialTenantId(Number(stateObj.tenantId));
            setIsNewTenantFromNavigation(true);
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
          createModal.onOpen();
        }, 0);
      }
      if (stateObj.search) {
        setSearch(stateObj.search);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, createModal, navigate]);

  const handleCancelCreateContract = () => {
    if (isNewTenantFromNavigation && initialTenantId) {
      setShowConfirmCancelModal(true);
    } else {
      createModal.onClose();
      setInitialTenantId(undefined);
    }
  };

  const handleConfirmCancelCreate = async () => {
    if (initialTenantId) {
      setDeletingTenant(true);
      try {
        await tenantService.deleteTenant(initialTenantId);
        toast.success("Đã hủy tạo người thuê mới và xóa thông tin khỏi hệ thống.");
      } catch (error) {
        toast.error("Không thể xóa thông tin người thuê vừa tạo.");
      } finally {
        setDeletingTenant(false);
        setShowConfirmCancelModal(false);
        setIsNewTenantFromNavigation(false);
        setInitialTenantId(undefined);
        createModal.onClose();
        queryClient.invalidateQueries({ queryKey: ["tenants"] });
      }
    }
  };

  const displayContracts = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const buildingApartmentIds = apartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id);
      return contracts.filter((c) => buildingApartmentIds.includes(c.apartment_id));
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

  const filteredContracts = displayContracts.filter((c) => {
    const term = removeVietnameseTones(debouncedSearch);
    const code = `HD-${String(c.id).padStart(5, "0")}`;
    const tenant = tenants.find((t) => t.id === c.tenant_id);
    const tenantName = tenant ? removeVietnameseTones(tenant.full_name) : "";
    const apt = apartments.find((a) => a.id === c.apartment_id);
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
      tenant: (item) => tenants.find((t) => t.id === item.tenant_id)?.full_name || "",
      apartment: (item) => {
        const apt = apartments.find((a) => a.id === item.apartment_id);
        return apt ? `${apt.room_number}` : "";
      },
      monthly_rent: (item) => Number(item.monthly_rent),
      start_date: (item) => new Date(item.start_date).getTime(),
      end_date: (item) => new Date(item.end_date).getTime(),
      status: (item) => item.status,
    }
  );

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    endIdx,
  } = usePagination({
    totalItems: filteredContracts.length,
    initialPageSize: 10,
  });

  const paginatedContracts = sortedContracts.slice(startIdx, endIdx);

  const extendMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => contractService.extendContract(id, date),
    onSuccess: () => {
      toast.success("Gia hạn hợp đồng thành công!");
      setSelectedExtendContract(null);
      setExtendEndDate("");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: () => {
      toast.error("Gia hạn hợp đồng thất bại!");
    },
  });

  function handleExtendContract() {
    if (!selectedExtendContract || !extendEndDate) {
      toast.error("Vui lòng chọn ngày kết thúc mới!");
      return;
    }
    extendMutation.mutate({ id: selectedExtendContract.id, date: extendEndDate });
  }

  const terminateMutation = useMutation({
    mutationFn: (id: number) => contractService.terminateContract(id),
    onSuccess: () => {
      toast.success("Hủy/thanh lý hợp đồng thành công!");
      setTerminateItem(null);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err.response?.data?.error || err.response?.data?.message || "Hủy hợp đồng thất bại!");
    },
  });

  function handleTerminateContract() {
    if (!terminateItem) return;
    terminateMutation.mutate(terminateItem.id);
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
    createModal,
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
    deletingTenant,
    handleCancelCreateContract,
    handleConfirmCancelCreate,
  };
}
