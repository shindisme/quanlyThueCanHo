import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import * as contractService from "../../../../services/contractService";
import * as tenantService from "../../../../services/tenantService";
import type { TenantOccupant, OccupantForm } from "../../../../types";

export interface OccupantItem {
  id: number;
  name: string;
  cccd: string;
  dob: string;
  phone: string;
}

function toOccupantItem(occupant: TenantOccupant): OccupantItem {
  return {
    id: occupant.id,
    name: occupant.full_name,
    cccd: occupant.citizen_id,
    dob: occupant.date_of_birth ? occupant.date_of_birth.slice(0, 10) : "",
    phone: occupant.phone || "",
  };
}

function errorMessage(error: unknown, fallback: string) {
  const err = error as { message?: string; response?: { data?: { error?: string; message?: string } } };
  return err.response?.data?.message || err.response?.data?.error || err.message || fallback;
}

export function useMyOccupants() {
  const queryClient = useQueryClient();
  const { email, role, token } = useAuthStore();

  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [editOccupant, setEditOccupant] = useState<OccupantItem | null>(null);
  const [occupantForm, setOccupantForm] = useState<OccupantForm>({
    name: "",
    cccd: "",
    dob: "",
    phone: "",
  });

  // Query hợp đồng active để lấy thông tin phòng và max_occupants
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContractsPage(),
    enabled: role === "TENANT" && !!email && !!token,
    select: (res) => res.data,
  });

  const userContract = useMemo(
    () => contracts.find((c) => c.status === "ACTIVE"),
    [contracts]
  );

  const maxOccupantsLimit = useMemo(() => {
    if (userContract?.max_occupants && userContract.max_occupants > 0) {
      return userContract.max_occupants;
    }
    if (userContract?.apartment?.bedrooms) {
      return Math.max(2, userContract.apartment.bedrooms * 2);
    }
    return 4;
  }, [userContract]);

  // Query danh sách người ở cùng của cư dân
  const { data: occupantData = [], isLoading } = useQuery({
    queryKey: ["tenant-occupants"],
    queryFn: tenantService.getMyOccupants,
    enabled: role === "TENANT" && !!token,
  });

  const occupants = useMemo(
    () => occupantData.map(toOccupantItem),
    [occupantData]
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: OccupantForm) => tenantService.createMyOccupant(data),
    onSuccess: () => {
      toast.success("Khai báo người ở cùng thành công!");
      queryClient.invalidateQueries({ queryKey: ["tenant-occupants"] });
      setShowOccupantModal(false);
    },
    onError: (err) => toast.error(errorMessage(err, "Khai báo thất bại")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OccupantForm }) =>
      tenantService.updateMyOccupant(id, data),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công!");
      queryClient.invalidateQueries({ queryKey: ["tenant-occupants"] });
      setShowOccupantModal(false);
    },
    onError: (err) => toast.error(errorMessage(err, "Cập nhật thất bại")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tenantService.deleteMyOccupant(id),
    onSuccess: () => {
      toast.success("Đã xóa thông tin người ở cùng!");
      queryClient.invalidateQueries({ queryKey: ["tenant-occupants"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Xóa thất bại")),
  });

  const handleOpenOccupantForm = (occupant: OccupantItem | null = null) => {
    if (!occupant && occupants.length >= maxOccupantsLimit) {
      toast.error(`Căn hộ của bạn đã đạt giới hạn tối đa ${maxOccupantsLimit} người ở cùng.`);
      return;
    }
    setEditOccupant(occupant);
    setOccupantForm({
      name: occupant ? occupant.name : "",
      cccd: occupant ? occupant.cccd : "",
      dob: occupant ? occupant.dob : "",
      phone: occupant ? occupant.phone : "",
    });
    setShowOccupantModal(true);
  };

  const handleSaveOccupant = async () => {
    if (!occupantForm.name.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    if (!occupantForm.cccd.trim() || !/^\d{9,12}$/.test(occupantForm.cccd.trim())) {
      toast.error("Số CCCD phải bao gồm 9 đến 12 chữ số");
      return;
    }

    if (editOccupant) {
      updateMutation.mutate({ id: editOccupant.id, data: occupantForm });
    } else {
      createMutation.mutate(occupantForm);
    }
  };

  const handleDeleteOccupant = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thông tin người ở cùng này?")) {
      deleteMutation.mutate(id);
    }
  };

  return {
    occupants,
    isLoading,
    userContract,
    maxOccupantsLimit,
    showOccupantModal,
    setShowOccupantModal,
    editOccupant,
    occupantForm,
    setOccupantForm,
    handleOpenOccupantForm,
    handleSaveOccupant,
    handleDeleteOccupant,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
