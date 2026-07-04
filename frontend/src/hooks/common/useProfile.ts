import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth.store";
import { changePassword } from "../../services/authService";
import * as contractService from "../../services/contractService";
import * as apartmentService from "../../services/apartmentService";
import * as buildingService from "../../services/buildingService";
import * as staffService from "../../services/staffService";
import { changePasswordSchema, occupantSchema } from "../../schemas/user.schema";

interface Occupant {
  id: string;
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

export function useProfile() {
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
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Đổi mật khẩu thất bại");
    }
  });
  const saving = changePasswordMutation.isPending;

  // Tenant Queries
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

  // Staff Queries (Manager / Staff)
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

  const [occupants, setOccupants] = useState<Occupant[]>(() => {
    if (!email) return [];
    const stored = localStorage.getItem(`tenant-occupants-${email}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [editOccupant, setEditOccupant] = useState<Occupant | null>(null);
  const [occupantForm, setOccupantForm] = useState({
    name: "",
    cccd: "",
    dob: "",
    phone: ""
  });

  const maxOccupantsLimit = userContract?.max_occupants || (apartmentInfo ? Math.max(2, apartmentInfo.bedrooms * 2) : 2);

  const handleOpenOccupantForm = (occ: Occupant | null) => {
    if (!occ) {
      if (1 + occupants.length >= maxOccupantsLimit) {
        toast.error(`Căn hộ đã đạt số người ở tối đa theo hợp đồng (Giới hạn: ${maxOccupantsLimit} người.`);
        return;
      }
    }
    setEditOccupant(occ);
    if (occ) {
      setOccupantForm({
        name: occ.name || "",
        cccd: occ.cccd || "",
        dob: occ.dob || "",
        phone: occ.phone || ""
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

  const handleDeleteOccupant = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người ở cùng này?")) return;
    const updated = occupants.filter((occ) => occ.id !== id);
    setOccupants(updated);
    if (email) {
      localStorage.setItem(`tenant-occupants-${email}`, JSON.stringify(updated));
    }
    toast.success("Xóa người ở cùng thành công");
  };

  const handleSaveOccupant = () => {
    const result = occupantSchema.safeParse(occupantForm);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    let updated: Occupant[];
    if (editOccupant) {
      updated = occupants.map((occ) =>
        occ.id === editOccupant.id ? { ...occ, ...occupantForm } : occ
      );
      toast.success("Cập nhật thông tin thành công");
    } else {
      const newOcc = {
        id: Date.now().toString(),
        ...occupantForm
      };
      updated = [...occupants, newOcc];
      toast.success("Khai báo người ở cùng thành công");
    }
    setOccupants(updated);
    if (email) {
      localStorage.setItem(`tenant-occupants-${email}`, JSON.stringify(updated));
    }
    setShowOccupantModal(false);
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
