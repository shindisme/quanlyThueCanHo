import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../stores/auth.store";
import { changePassword } from "../../../../services/authService";
import * as contractService from "../../../../services/contractService";
import * as apartmentService from "../../../../services/apartmentService";
import * as buildingService from "../../../../services/buildingService";
import * as staffService from "../../../../services/staffService";
import * as tenantService from "../../../../services/tenantService";
import { changePasswordSchema, occupantSchema } from "../../../../schemas/user.schema";
import type { TenantOccupant } from "../../../../types";

export interface Occupant {
  id: number;
  name: string;
  cccd: string;
  dob: string;
  phone: string;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
function toOccupant(occupant: TenantOccupant): Occupant {
  return {
    id: occupant.id,
    name: occupant.full_name,
    cccd: occupant.citizen_id,
    dob: occupant.date_of_birth?.slice(0, 10) || "",
    phone: occupant.phone || "",
  };
}

function errorMessage(error: unknown, fallback: string) {
  const err = error as { message?: string; response?: { data?: { error?: string; message?: string } } };
  return err.response?.data?.message || err.response?.data?.error || err.message || fallback;
}

export function useProfile() {
  const queryClient = useQueryClient();
  const { email, role, token } = useAuthStore();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPass, newPass }: { oldPass: string; newPass: string }) => changePassword(oldPass, newPass),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, "Đổi mật khẩu thất bại"));
    }
  });
  const saving = changePasswordMutation.isPending;

  const { data: contracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
    enabled: role === "TENANT" && !!email && !!token,
  });

  const userContract = contracts
    ? contracts.find((c) => c.status === "ACTIVE")
    : null;

  const { data: apartmentsRes } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartments({ limit: 100 }),
    enabled: !!userContract,
  });

  const apartmentInfo = userContract && apartmentsRes?.data
    ? apartmentsRes.data.find((a) => a.id === userContract.apartment_id)
    : null;

  const { data: buildingsRes } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildings({ limit: 100 }),
    enabled: !!apartmentInfo,
  });

  const buildingInfo = apartmentInfo && buildingsRes?.data
    ? buildingsRes.data.find((b) => b.id === apartmentInfo.building_id)
    : null;

  const { data: staffRes } = useQuery({
    queryKey: ["staffProfile"],
    queryFn: () => staffService.getAllStaff(),
    enabled: (role === "MANAGER" || role === "STAFF") && !!userId,
  });
  const currentStaff = userId && staffRes?.data
    ? staffRes.data.find((s) => s.user_id === userId)
    : null;

  const overrideFullName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;
  const overridePhone = email ? localStorage.getItem(`profile-phone-${email}`) : null;

  const fullName = overrideFullName || (role === "TENANT"
    ? userContract?.tenant?.full_name
    : (role === "MANAGER" || role === "STAFF"
      ? currentStaff?.full_name
      : "Quản trị viên"));

  const phone = overridePhone || (role === "TENANT"
    ? userContract?.tenant?.phone
    : (role === "MANAGER" || role === "STAFF"
      ? currentStaff?.phone
      : ""));

  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const handleOpenEditProfile = () => {
    setEditFullName(fullName || "");
    setEditPhone(phone || "");
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!editFullName.trim()) {
      toast.error("Họ tên không được để trống");
      return;
    }
    if (email) {
      localStorage.setItem(`profile-fullname-${email}`, editFullName);
      localStorage.setItem(`profile-phone-${email}`, editPhone);
      toast.success("Cập nhật thông tin tài khoản thành công!");
      setShowEditProfileModal(false);
    }
  };
  const { data: occupantData = [] } = useQuery({
    queryKey: ["tenant-occupants"],
    queryFn: tenantService.getMyOccupants,
    enabled: role === "TENANT" && !!token,
  });
  const occupants = useMemo(
    () => occupantData.map(toOccupant),
    [occupantData]
  );

  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [editOccupant, setEditOccupant] = useState<Occupant | null>(null);
  const [occupantForm, setOccupantForm] = useState({
    name: "",
    cccd: "",
    dob: "",
    phone: ""
  });

  const createOccupantMutation = useMutation({
    mutationFn: tenantService.createMyOccupant,
    onSuccess: () => {
      toast.success("Khai báo người ở cùng thành công");
      setShowOccupantModal(false);
      queryClient.invalidateQueries({ queryKey: ["tenant-occupants"] });
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, "Khai báo người ở cùng thất bại"));
    }
  });

  const updateOccupantMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof occupantForm }) => tenantService.updateMyOccupant(id, data),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
      setShowOccupantModal(false);
      queryClient.invalidateQueries({ queryKey: ["tenant-occupants"] });
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, "Cập nhật người ở cùng thất bại"));
    }
  });

  const deleteOccupantMutation = useMutation({
    mutationFn: tenantService.deleteMyOccupant,
    onSuccess: () => {
      toast.success("Xóa người ở cùng thành công");
      queryClient.invalidateQueries({ queryKey: ["tenant-occupants"] });
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, "Xóa người ở cùng thất bại"));
    }
  });

  const maxOccupantsLimit = userContract?.max_occupants || (apartmentInfo ? Math.max(2, apartmentInfo.bedrooms * 2) : 2);

  const handleOpenOccupantForm = (selectedOccupant: Occupant | null) => {
    if (!selectedOccupant) {
      if (1 + occupants.length >= maxOccupantsLimit) {
        toast.error(`Căn hộ đã đạt số người ở tối đa theo hợp đồng (Giới hạn: ${maxOccupantsLimit} người).`);
        return;
      }
    }
    setEditOccupant(selectedOccupant);
    if (selectedOccupant) {
      setOccupantForm({
        name: selectedOccupant.name || "",
        cccd: selectedOccupant.cccd || "",
        dob: selectedOccupant.dob || "",
        phone: selectedOccupant.phone || ""
      });
    } else {
      setOccupantForm({
        name: "",
        cccd: "",
        dob: "",
        phone: ""
      });
    }
    setShowOccupantModal(true);
  };

  const handleDeleteOccupant = (occupantId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người ở cùng này?")) return;
    deleteOccupantMutation.mutate(occupantId);
  };

  const handleSaveOccupant = () => {
    const result = occupantSchema.safeParse(occupantForm);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    if (editOccupant) {
      updateOccupantMutation.mutate({ id: editOccupant.id, data: occupantForm });
    } else {
      createOccupantMutation.mutate(occupantForm);
    }
  };

  function handleChangePassword() {
    const result = changePasswordSchema.safeParse({ oldPass, newPass, confirmPass });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    changePasswordMutation.mutate({ oldPass, newPass });
  }

  return {
    email,
    role,
    oldPass,
    setOldPass,
    newPass,
    setNewPass,
    confirmPass,
    setConfirmPass,
    saving,
    userContract,
    apartmentInfo,
    buildingInfo,
    occupants,
    showOccupantModal,
    setShowOccupantModal,
    editOccupant,
    occupantForm,
    setOccupantForm,
    handleOpenOccupantForm,
    handleDeleteOccupant,
    handleSaveOccupant,
    handleChangePassword,
    fullName,
    phone,
    editFullName,
    setEditFullName,
    editPhone,
    setEditPhone,
    showEditProfileModal,
    setShowEditProfileModal,
    handleOpenEditProfile,
    handleSaveProfile,
    maxOccupantsLimit,
  };
}