import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import * as tenantService from "../../../../services/tenantService";
import * as authService from "../../../../services/authService";
import * as contractService from "../../../../services/contractService";
import * as contractTerminationService from "../../../../services/contractTerminationService";
import type { ContractTermination, OverdueTerminationCandidate, RentalContract } from "../../../../types";
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
  const [terminationItem, setTerminationItem] = useState<ContractTermination | null>(null);
  const [checkoutDraftTerminationId, setCheckoutDraftTerminationId] = useState<number | null>(null);
  const [selectedTerminationDetail, setSelectedTerminationDetail] = useState<ContractTermination | null>(null);
  const [cancelContractItem, setCancelContractItem] = useState<RentalContract | null>(null);
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
    queryFn: () => buildingService.getAllPage(),
    select: (res) => res.data as unknown as Building[],
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: QUERY_KEYS.APARTMENTS,
    queryFn: () => apartmentService.getAllPage(),
    select: (res) => res.data as unknown as Apartment[],
  });

  const { data: tenantsRes, isLoading: loadingTenants } = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: () => tenantService.getAllPage(),
    select: (res) => res.data,
  });
  const tenants = (tenantsRes as unknown as Tenant[]) || [];

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => authService.getAllPage(),
    select: (res) => res.data as unknown as User[],
  });
  const { data: terminations = [], isLoading: loadingTerminations } = useQuery({
    queryKey: QUERY_KEYS.TERMINATIONS,
    queryFn: () => contractTerminationService.getAllPage(),
    select: (res) => res.data as ContractTermination[],
  });

  const { data: overdueCandidates = [], isLoading: loadingOverdueCandidates } = useQuery({
    queryKey: [...QUERY_KEYS.TERMINATIONS, "overdue-candidates"],
    queryFn: () => contractTerminationService.getOverdueCandidates(),
    enabled: role === "ADMIN" || role === "MANAGER",
    select: (res) => res as OverdueTerminationCandidate[],
  });

  const loading =
    loadingContracts || loadingBuildings || loadingApartments || loadingTenants || loadingUsers || loadingTerminations || loadingOverdueCandidates;

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
    mutationFn: (id: number) => tenantService.remove(id),
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


  const openTerminationsByContractId = useMemo(() => {
    const openStatuses = new Set(["PENDING", "APPROVED", "INSPECTION", "SETTLING"]);
    return new Map(
      terminations
        .filter((termination) => openStatuses.has(termination.status))
        .map((termination) => [termination.contract_id, termination])
    );
  }, [terminations]);

  const overdueCandidateIds = useMemo(
    () => new Set(overdueCandidates.map((candidate) => candidate.contract.id)),
    [overdueCandidates]
  );
  const filteredContracts = displayContracts.filter((c) => {
    const apt = c.apartment ?? apartments.find((a) => a.id === c.apartment_id);
    const termination = openTerminationsByContractId.get(c.id);

    // Lọc theo tòa nhà được chọn
    if (filterBuilding && apt?.building_id !== filterBuilding) {
      return false;
    }

    // Lọc theo trạng thái 
    if (filterStatus === "TERMINATION_OPEN") {
      if (termination?.type !== "TENANT_REQUEST") return false;
    } else if (filterStatus && c.status !== filterStatus) {
      return false;
    }

    // Lọc theo tháng bắt đầu
    if (filterMonth) {
      const start = new Date(c.start_date);
      if (start.getMonth() + 1 !== filterMonth) {
        return false;
      }
    }

    // Lọc theo năm bắt đầu ký
    if (filterYear) {
      const start = new Date(c.start_date);
      if (start.getFullYear() !== filterYear) {
        return false;
      }
    }

    const term = removeVietnameseTones(search);
    const code = `HD-${String(c.id).padStart(5, "0")}`;
    const tenant = c.tenant ?? tenants.find((t) => t.id === c.tenant_id);
    const tenantName = tenant ? removeVietnameseTones(tenant.full_name) : "";
    const room = apt ? removeVietnameseTones(apt.room_number) : "";

    return (
      code.toLowerCase().includes(term.toLowerCase()) ||
      tenantName.toLowerCase().includes(term.toLowerCase()) ||
      room.toLowerCase().includes(term.toLowerCase())
    );
  }).sort((a, b) => {
    const aTermination = openTerminationsByContractId.get(a.id);
    const bTermination = openTerminationsByContractId.get(b.id);
    const priority = (item?: ContractTermination) => {
      if (item?.type === "TENANT_REQUEST") return 0;
      if (item) return 1;
      return 2;
    };

    return priority(aTermination) - priority(bTermination);
  });

  // Lọc
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
      status: (item) => {
        const termination = openTerminationsByContractId.get(item.id);
        if (termination?.type === "TENANT_REQUEST") return `0-${termination.status}`;
        if (termination) return `1-${termination.status}`;
        return `2-${item.status}`;
      },
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
  const invalidateTerminationFlow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TERMINATIONS }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APARTMENTS }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES }),
    ]);
  };

  const approveTerminationMutation = useMutation({
    mutationFn: (id: number) => contractTerminationService.approve(id),
    onSuccess: async () => {
      toast.success("Đã duyệt yêu cầu thanh lý.");
      await invalidateTerminationFlow();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Không thể duyệt yêu cầu thanh lý.");
    },
  });

  const rejectTerminationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => contractTerminationService.reject(id, reason),
    onSuccess: async () => {
      toast.success("Đã từ chối yêu cầu thanh lý.");
      await invalidateTerminationFlow();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Không thể từ chối yêu cầu thanh lý.");
    },
  });
  const cancelTerminationMutation = useMutation({
    mutationFn: (id: number) => contractTerminationService.cancel(id),
    onSuccess: async () => {
      toast.success("Đã hủy thanh lý hợp đồng.");
      setSelectedTerminationDetail(null);
      setTerminateItem(null);
      setTerminationItem(null);
      await invalidateTerminationFlow();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Không thể hủy thanh lý hợp đồng.");
    },
  });

  const createOverdueTerminationMutation = useMutation({
    mutationFn: ({ contractId, reason }: { contractId: number; reason: string }) => contractTerminationService.createOverdue({
      contract_id: contractId,
      reason,
    }),
    onSuccess: (termination) => {
      toast.success("Đã tạo hồ sơ thanh lý hợp đồng.");
      setCheckoutDraftTerminationId(termination.id);
      setTerminationItem(termination);
      const contract = displayContracts.find((item) => item.id === termination.contract_id) || null;
      setTerminateItem(contract);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Không thể tạo thanh lý hợp đồng.");
    },
  });


  function handleApproveTermination(termination: ContractTermination) {
    approveTerminationMutation.mutate(termination.id);
  }

  function handleRejectTermination(termination: ContractTermination) {
    const reason = window.prompt("Nhập lý do từ chối yêu cầu thanh lý:");
    if (!reason?.trim()) return;
    rejectTerminationMutation.mutate({ id: termination.id, reason: reason.trim() });
  }
  function handleCancelTermination(termination: ContractTermination) {
    const ok = window.confirm("Bạn có chắc chắn muốn hủy thanh lý hợp đồng này không?");
    if (!ok) return;
    cancelTerminationMutation.mutate(termination.id);
  }

  function handleCreateOverdueTermination(contract: RentalContract) {
    const reason = window.prompt("Nhập lý do quản lý chủ động thanh lý hợp đồng:");
    if (!reason?.trim()) return;
    createOverdueTerminationMutation.mutate({ contractId: contract.id, reason: reason.trim() });
  }

  function handleOpenTerminationCheckout(contract: RentalContract, termination: ContractTermination) {
    if (termination.status === "PENDING") {
      toast.info("Yêu cầu thanh lý cần được duyệt trước khi bàn giao.");
      return;
    }
    setCheckoutDraftTerminationId(null);
    setTerminationItem(termination);
    setTerminateItem(contract);
  }

  function handleCloseTerminationCheckout(options?: { completed?: boolean }) {
    const draftTerminationId = checkoutDraftTerminationId;
    setTerminateItem(null);
    setTerminationItem(null);
    setCheckoutDraftTerminationId(null);

    if (options?.completed || draftTerminationId === null) return;

    contractTerminationService.cancel(draftTerminationId)
      .then(() => invalidateTerminationFlow())
      .catch((error: unknown) => {
        const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
        toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Không thể hủy phiên thanh lý chưa hoàn tất.");
      });
  }

  function handleConfirmCancelContract() {
    toast.error("Không thể kết thúc hợp đồng trực tiếp. Vui lòng dùng quy trình thanh lý hợp đồng.");
    setCancelContractItem(null);
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
    terminationItem,
    setTerminationItem,
    selectedTerminationDetail,
    setSelectedTerminationDetail,
    terminations,
    openTerminationsByContractId,
    overdueCandidateIds,
    handleApproveTermination,
    handleRejectTermination,
    handleCancelTermination,
    handleCreateOverdueTermination,
    handleOpenTerminationCheckout,
    cancelContractItem,
    setCancelContractItem,
    handleConfirmCancelContract,
    handleCloseTerminationCheckout,
    terminating: approveTerminationMutation.isPending || rejectTerminationMutation.isPending || cancelTerminationMutation.isPending || createOverdueTerminationMutation.isPending,
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
