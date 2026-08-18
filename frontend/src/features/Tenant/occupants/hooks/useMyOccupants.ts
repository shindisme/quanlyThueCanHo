import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../../../../constants/queryKeys";
import { useAuthStore } from "../../../../stores/auth.store";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import { occupantSchema } from "../../../../schemas/user.schema";
import * as contractService from "../../../../services/contractService";
import * as tenantService from "../../../../services/tenantService";
import type { OccupantForm, TenantOccupant } from "../../../../types";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { removeVietnameseTones } from "../../../../utils/string";

export interface OccupantItem {
  id: number;
  name: string;
  cccd: string;
  dob: string;
  phone: string;
}

const EMPTY_FORM: OccupantForm = { name: "", cccd: "", dob: "", phone: "" };

function toOccupantItem(occupant: TenantOccupant): OccupantItem {
  return {
    id: occupant.id,
    name: occupant.full_name,
    cccd: occupant.citizen_id,
    dob: occupant.date_of_birth ? String(occupant.date_of_birth).slice(0, 10) : "",
    phone: occupant.phone || "",
  };
}

export function useMyOccupants() {
  const queryClient = useQueryClient();
  const { role, token } = useAuthStore();
  const [search, setSearch] = useState("");
  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [editOccupant, setEditOccupant] = useState<OccupantItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OccupantItem | null>(null);
  const [occupantForm, setOccupantForm] = useState<OccupantForm>(EMPTY_FORM);
  const debouncedSearch = useDebounce(search, 300);

  const contractsQuery = useQuery({
    queryKey: queryKeys.contracts.list({ scope: "tenant", status: "ACTIVE" }),
    queryFn: () => contractService.getAllPage({ status: "ACTIVE" }),
    select: (response) => response.data,
    enabled: role === "TENANT" && Boolean(token),
  });
  const userContract = contractsQuery.data?.[0];
  const maxTotalOccupants = userContract?.max_occupants && userContract.max_occupants > 0
    ? userContract.max_occupants
    : userContract?.apartment?.bedrooms
      ? Math.max(2, userContract.apartment.bedrooms * 2)
      : 4;
  // max_occupants bao gồm người đứng tên hợp đồng.
  const maxCompanions = Math.max(0, maxTotalOccupants - 1);

  const occupantsQuery = useQuery({
    queryKey: queryKeys.occupants.tenantList(),
    queryFn: tenantService.getMyOccupants,
    enabled: role === "TENANT" && Boolean(token),
  });
  const occupants = useMemo(
    () => (occupantsQuery.data ?? []).map(toOccupantItem),
    [occupantsQuery.data]
  );
  const filteredOccupants = useMemo(() => {
    const keyword = removeVietnameseTones(debouncedSearch.trim().toLowerCase());
    if (!keyword) return occupants;
    return occupants.filter((occupant) =>
      removeVietnameseTones(
        [occupant.name, occupant.cccd, occupant.phone].filter(Boolean).join(" ").toLowerCase()
      ).includes(keyword)
    );
  }, [debouncedSearch, occupants]);
  const { items: sortedOccupants, requestSort, sortConfig } = useSort<OccupantItem>(
    filteredOccupants,
    { key: "index", direction: "asc" }
  );
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedOccupants.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, setCurrentPage]);

  const closeOccupantModal = () => {
    setShowOccupantModal(false);
    setEditOccupant(null);
    setOccupantForm(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: tenantService.createMyOccupant,
    onSuccess: () => {
      toast.success("Khai báo người ở cùng thành công!");
      closeOccupantModal();
      void queryClient.invalidateQueries({ queryKey: queryKeys.occupants.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Khai báo thất bại")),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OccupantForm }) =>
      tenantService.updateMyOccupant(id, data),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công!");
      closeOccupantModal();
      void queryClient.invalidateQueries({ queryKey: queryKeys.occupants.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Cập nhật thất bại")),
  });
  const deleteMutation = useMutation({
    mutationFn: tenantService.deleteMyOccupant,
    onSuccess: () => {
      toast.success("Đã xóa thông tin người ở cùng!");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.occupants.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Xóa thất bại")),
  });

  const handleOpenOccupantForm = (occupant: OccupantItem | null = null) => {
    if (!occupant && occupants.length >= maxCompanions) {
      toast.error(`Hợp đồng chỉ cho phép khai báo tối đa ${maxCompanions} người ở cùng.`);
      return;
    }
    setEditOccupant(occupant);
    setOccupantForm(occupant
      ? { name: occupant.name, cccd: occupant.cccd, dob: occupant.dob, phone: occupant.phone }
      : EMPTY_FORM);
    setShowOccupantModal(true);
  };

  const handleSaveOccupant = () => {
    const normalizedForm: OccupantForm = {
      name: occupantForm.name.trim(),
      cccd: occupantForm.cccd.trim(),
      dob: occupantForm.dob || "",
      phone: occupantForm.phone?.trim() || "",
    };
    const validation = occupantSchema.safeParse(normalizedForm);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    if (editOccupant) updateMutation.mutate({ id: editOccupant.id, data: normalizedForm });
    else createMutation.mutate(normalizedForm);
  };

  return {
    occupants: sortedOccupants.slice(startIdx, endIdx),
    occupantCount: occupants.length,
    filteredCount: filteredOccupants.length,
    isLoading: occupantsQuery.isLoading || contractsQuery.isLoading,
    error: occupantsQuery.error,
    refetch: occupantsQuery.refetch,
    activeContract: userContract || null,
    hasActiveContract: Boolean(userContract),
    maxTotalOccupants,
    maxCompanions,
    isLimitReached: occupants.length >= maxCompanions,
    search,
    setSearch,
    showOccupantModal,
    closeOccupantModal,
    editOccupant,
    occupantForm,
    setOccupantForm,
    handleOpenOccupantForm,
    handleSaveOccupant,
    deleteTarget,
    setDeleteTarget,
    confirmDelete: () => deleteTarget && deleteMutation.mutate(deleteTarget.id),
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    requestSort,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
  };
}
