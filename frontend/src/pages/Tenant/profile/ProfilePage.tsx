import { useState, useEffect } from "react";
import { User, Mail, Save, Plus, Pencil, Trash2, FileText } from "lucide-react";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { useAuthStore } from "../../../stores/auth.store";
import { changePassword } from "../../../services/authService";
import { toast } from "sonner";
import * as tenantService from "../../../services/tenantService";
import * as contractService from "../../../services/contractService";
import * as apartmentService from "../../../services/apartmentService";
import * as buildingService from "../../../services/buildingService";
import { formatCurrency, formatDate } from "../../../utils/format";

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

export default function ProfilePage() {
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
    const stored = localStorage.getItem(`occupants-${email}`);
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
      localStorage.setItem(`occupants-${email}`, JSON.stringify(updated));
    }
    toast.success("Xóa người ở cùng thành công");
  };

  const handleSaveOccupant = () => {
    if (!occupantForm.name || !occupantForm.cccd) {
      toast.error("Vui lòng điền đầy đủ Họ tên và Số CCCD");
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
      localStorage.setItem(`occupants-${email}`, JSON.stringify(updated));
    }
    setShowOccupantModal(false);
  };

  const displayName = email?.split("@")[0] || "User";
  const roleLabel =
    role === "ADMIN" ? "Quản trị viên" :
      role === "MANAGER" ? "Quản lý" : "Người thuê";

  async function handleChangePassword() {
    if (!oldPass || !newPass) {
      toast.error("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (newPass.length < 6) {
      toast.error("Mật khẩu mới phải ít nhất 6 ký tự");
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

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        icon={User}
        title="Hồ sơ cá nhân"
        subtitle="Xem thông tin tài khoản và đổi mật khẩu bảo mật"
        iconColor="linear-gradient(135deg, #7C3AED, #A78BFA)"
      />

      {/* Thông tin cá nhân */}
      <div className="premium-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Thông tin tài khoản</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md text-white text-2xl font-bold" style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{displayName}</p>
            <p className="text-sm text-gray-500">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Vai trò</p>
              <p className="text-sm font-medium text-gray-800">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu - kết nối API thật */}
      <div className="premium-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Đổi mật khẩu</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)}
              className="premium-input rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              className="premium-input rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
              className="premium-input rounded-xl" />
          </div>
          <Button onClick={handleChangePassword} isLoading={saving}>
            <Save size={16} /> Đổi mật khẩu
          </Button>
        </div>
      </div>

      {/* Thông tin hợp đồng đang thuê */}
      {role === "TENANT" && userContract && (
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b pb-3 border-gray-155">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Thông tin hợp đồng đang thuê</h3>
              <p className="text-xs text-gray-400 mt-0.5">Chi tiết hợp đồng thuê căn hộ hiện tại của bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-sans">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã hợp đồng:</span>
                <span className="font-semibold text-primary-600">HD-{String(userContract.id).padStart(5, "0")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chi nhánh / Tòa nhà:</span>
                <span className="font-medium text-gray-800">{buildingInfo?.branch_name || "Yuki House"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Căn hộ:</span>
                <span className="font-semibold text-gray-800">
                  {apartmentInfo ? `Phòng ${apartmentInfo.floor}${apartmentInfo.room_number}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền thuê / tháng:</span>
                <span className="font-bold text-[#3f6ad8]">{formatCurrency(userContract.monthly_rent)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền đặt cọc:</span>
                <span className="font-semibold text-gray-800">{formatCurrency(userContract.deposit_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày bắt đầu:</span>
                <span className="font-medium text-gray-800">{formatDate(userContract.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày kết thúc:</span>
                <span className="font-medium text-gray-800">{formatDate(userContract.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái hợp đồng:</span>
                <span className="font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-md text-xs">
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Khai báo người ở cùng */}
      {role === "TENANT" && (
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Khai báo người ở cùng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Khai báo thông tin những người sinh hoạt cùng căn hộ của bạn</p>
            </div>
            <Button size="sm" onClick={() => handleOpenOccupantForm(null)}>
              <Plus size={16} /> Khai báo người ở
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-150">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Họ và tên</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Số CCCD</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày sinh</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">SĐT</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Chức năng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {occupants.map((occ) => (
                  <tr key={occ.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{occ.name}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.cccd}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.dob ? new Date(occ.dob).toLocaleDateString("vi-VN") : "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenOccupantForm(occ)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteOccupant(occ.id)}
                          className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {occupants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Chưa khai báo người ở cùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal*/}
          <Modal
            isOpen={showOccupantModal}
            onClose={() => setShowOccupantModal(false)}
            title={editOccupant ? "Chỉnh sửa thông tin người ở" : "Khai báo người ở cùng mới"}
            footer={
              <>
                <Button variant="outline" onClick={() => setShowOccupantModal(false)}>Hủy</Button>
                <Button onClick={handleSaveOccupant}>Lưu thông tin</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input
                label="Họ và tên"
                value={occupantForm.name}
                onChange={(e) => setOccupantForm({ ...occupantForm, name: e.target.value })}
                placeholder="Nhập họ và tên"
              />
              <Input
                label="Số CCCD (Căn cước công dân)"
                value={occupantForm.cccd}
                onChange={(e) => setOccupantForm({ ...occupantForm, cccd: e.target.value })}
                placeholder="Nhập số CCCD"
              />
              <Input
                label="Ngày sinh"
                type="date"
                value={occupantForm.dob}
                onChange={(e) => setOccupantForm({ ...occupantForm, dob: e.target.value })}
              />
              <Input
                label="Số điện thoại"
                value={occupantForm.phone}
                onChange={(e) => setOccupantForm({ ...occupantForm, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
