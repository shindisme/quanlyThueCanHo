import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../stores/auth.store";
import { changePassword } from "../services/authService";
import * as tenantService from "../services/tenantService";
import * as contractService from "../services/contractService";
import * as apartmentService from "../services/apartmentService";
import * as buildingService from "../services/buildingService";
import { changePasswordSchema, occupantSchema } from "../schemas/user.schema";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function useProfile() {
  const { email, role, token } = useAuthStore();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);

  const [userContract, setUserContract] = useState<any | null>(null);
  const [apartmentInfo, setApartmentInfo] = useState<any | null>(null);
  const [buildingInfo, setBuildingInfo] = useState<any | null>(null);

  useEffect(() => {
    if (role === "TENANT" && email && token) {
      async function loadTenantContract() {
        try {
          const decoded = parseJwt(token);
          const userId = decoded?.userId;
          if (!userId) return;

          const tenantsRes = await tenantService.getAllTenants({ limit: 1000 });
          const currentT = tenantsRes.data.find((t) => t.user_id === userId);
          if (!currentT) return;

          const contracts = await contractService.getAllContracts();
          const activeContract = contracts.find((c) => c.tenant_id === currentT.id && c.status === "ACTIVE");

          if (activeContract) {
            setUserContract(activeContract);

            // Load apartment and building details
            const apartmentsRes = await apartmentService.getAllApartments({ limit: 1000 });
            const apt = apartmentsRes.data.find((a) => a.id === activeContract.apartment_id);
            if (apt) {
              setApartmentInfo(apt);

              const buildingsRes = await buildingService.getAllBuildings({ limit: 100 });
              const bld = buildingsRes.data.find((b) => b.id === apt.building_id);
              if (bld) {
                setBuildingInfo(bld);
              }
            }
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin hợp đồng cho Profile:", err);
        }
      }
      loadTenantContract();
    }
  }, [email, role, token]);

  const [occupants, setOccupants] = useState<any[]>(() => {
    if (!email) return [];
    const stored = localStorage.getItem(`tenant-occupants-${email}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [editOccupant, setEditOccupant] = useState<any | null>(null);
  const [occupantForm, setOccupantForm] = useState({
    name: "",
    cccd: "",
    dob: "",
    phone: ""
  });

  const handleOpenOccupantForm = (occ: any | null) => {
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
    let updated: any[];
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

  async function handleChangePassword() {
    const result = changePasswordSchema.safeParse({ oldPass, newPass, confirmPass });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      await changePassword(oldPass, newPass);
      toast.success("Đổi mật khẩu thành công!");
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
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
  };
}
