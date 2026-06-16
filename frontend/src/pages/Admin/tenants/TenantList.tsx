import { useState, useEffect } from "react";
import { Plus, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { mockTenants } from "../../../data/tenants";
import { mockUsers } from "../../../data/users";
import { mockApartments } from "../../../data/apartments";
import { mockContracts } from "../../../data/contracts";
import { useAuthStore } from "../../../stores/auth.store";
import type { Tenant } from "../../../types";
import { toast } from "sonner";
import { removeVietnameseTones, maskPhone, maskCCCD, formatDate } from "../../../utils/format";

// Trang danh sach nguoi thue
export default function TenantList() {
  const navigate = useNavigate();
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const [viewItem, setViewItem] = useState<Tenant | null>(null);
  const pageSize = 10;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Controlled form states
  const [formFullName, setFormFullName] = useState("");
  const [formCitizenId, setFormCitizenId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");

  useEffect(() => {
    // Load custom tenants
    const storedTenants = localStorage.getItem("custom-tenants");
    if (storedTenants) {
      try {
        setTenants(JSON.parse(storedTenants));
      } catch {
        setTenants(mockTenants);
      }
    } else {
      setTenants(mockTenants);
    }

    // Load custom users
    const storedUsers = localStorage.getItem("custom-users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        setUsers(mockUsers);
      }
    } else {
      setUsers(mockUsers);
    }
  }, [showForm]);

  useEffect(() => {
    if (editItem) {
      setFormFullName(editItem.full_name);
      setFormCitizenId(editItem.citizen_id);
      setFormDob(editItem.date_of_birth || "");
      setFormAddress(editItem.address || "");
    } else {
      setFormFullName("");
      setFormCitizenId("");
      setFormDob("");
      setFormAddress("");
    }
  }, [editItem, showForm]);

  // Lọc tenants theo building của manager trước khi tìm kiếm
  const displayTenants = (() => {
    // Load custom contracts to check apartments manager link
    const storedContracts = localStorage.getItem("custom-contracts");
    const currentContracts = storedContracts ? JSON.parse(storedContracts) : mockContracts;

    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      const managerTenantIds = currentContracts
        .filter((c: any) => managerApartmentIds.includes(c.apartment_id))
        .map((c: any) => c.tenant_id);
      return tenants.filter((t) => managerTenantIds.includes(t.id));
    }
    return tenants;
  })();

  // Loc 
  const filtered = displayTenants.filter((t) => {
    const term = removeVietnameseTones(search);
    const nameNorm = removeVietnameseTones(t.full_name);
    const citizenNorm = removeVietnameseTones(t.citizen_id);
    return nameNorm.includes(term) || citizenNorm.includes(term);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Thêm người thuê và tự động tạo tài khoản user, chuyển hướng qua tạo hợp đồng
  function handleSaveTenantAndUser() {
    if (!formFullName || !formCitizenId) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD");
      return;
    }

    const cleanCCCD = formCitizenId.trim();
    const last6Digits = cleanCCCD.slice(-6);
    const username = `YH${last6Digits}`;
    const tenantEmail = `${username}@yukihouse.vn`;

    const storedUsers = localStorage.getItem("custom-users");
    let currentUsers = storedUsers ? JSON.parse(storedUsers) : [...mockUsers];

    let existingUser = currentUsers.find((u: any) => u.email === tenantEmail);
    let newUserId = existingUser ? existingUser.id : Date.now();

    if (!existingUser) {
      const newUser = {
        id: newUserId,
        email: tenantEmail,
        phone: "-",
        password_hash: "$mock_hash",
        role: "TENANT",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      currentUsers.push(newUser);
      localStorage.setItem("custom-users", JSON.stringify(currentUsers));
    }

    // 2. Tạo Tenant mới
    const storedTenants = localStorage.getItem("custom-tenants");
    let currentTenants = storedTenants ? JSON.parse(storedTenants) : [...mockTenants];

    const newTenantId = Date.now() + 1;
    const newTenant = {
      id: newTenantId,
      user_id: newUserId,
      full_name: formFullName,
      citizen_id: formCitizenId,
      date_of_birth: formDob || null,
      address: formAddress || null,
      is_verified: true,
      created_at: new Date().toISOString()
    };

    currentTenants.push(newTenant);
    localStorage.setItem("custom-tenants", JSON.stringify(currentTenants));
    setTenants(currentTenants);

    // 3. Close modal
    setShowForm(false);
    toast.success(`Đã tự động tạo tài khoản "${username}" (Mật khẩu: 123456) và lưu người thuê thành công!`);

    // 4. Chuyển hướng qua trang Tạo hợp đồng
    const basePath = role === "MANAGER" ? "/manager" : "/admin";
    navigate(`${basePath}/contracts?auto_open=true&new_tenant_id=${newTenantId}&new_tenant_building_id=${managerBuildingId || ""}`);
  }

  // Chỉnh sửa thông tin người thuê
  function handleEditSave() {
    if (!formFullName || !formCitizenId) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD");
      return;
    }
    const storedTenants = localStorage.getItem("custom-tenants");
    let currentTenants = storedTenants ? JSON.parse(storedTenants) : [...mockTenants];

    const updated = currentTenants.map((t: any) =>
      t.id === editItem?.id
        ? { ...t, full_name: formFullName, citizen_id: formCitizenId, date_of_birth: formDob || null, address: formAddress || null }
        : t
    );
    localStorage.setItem("custom-tenants", JSON.stringify(updated));
    setTenants(updated);
    setShowForm(false);
    setEditItem(null);
    toast.success("Đã cập nhật thông tin người thuê");
  }

  // Xóa người thuê
  function handleDelete() {
    if (!deleteItem) return;
    const storedTenants = localStorage.getItem("custom-tenants");
    let currentTenants = storedTenants ? JSON.parse(storedTenants) : [...mockTenants];

    const updated = currentTenants.filter((t: any) => t.id !== deleteItem.id);
    localStorage.setItem("custom-tenants", JSON.stringify(updated));
    setTenants(updated);
    setDeleteItem(null);
    toast.success("Đã xóa người thuê");
  }

  // Lay email cua user lien ket voi tenant
  function getUserEmail(userId: number | null): string {
    if (!userId) return "-";
    return users.find((u) => u.id === userId)?.email || "-";
  }

  function getUserPhone(userId: number | null): string {
    if (!userId) return "-";
    return users.find((u) => u.id === userId)?.phone || "-";
  }

  const columns: Column<Tenant>[] = [
    { key: "name", label: "Họ tên", sortValue: (t) => t.full_name, render: (t) => <span className="font-medium">{t.full_name}</span> },
    { key: "email", label: "Email", sortValue: (t) => getUserEmail(t.user_id), render: (t) => getUserEmail(t.user_id) },
    { key: "phone", label: "Số điện thoại", sortValue: (t) => getUserPhone(t.user_id), render: (t) => maskPhone(getUserPhone(t.user_id)) },
    { key: "citizen_id", label: "CCCD", sortValue: (t) => t.citizen_id, render: (t) => maskCCCD(t.citizen_id) },
    {
      key: "verified",
      label: "Xác thực",
      sortValue: (t) => t.is_verified,
      render: (t) => (
        <Badge variant={t.is_verified ? "success" : "warning"}>
          {t.is_verified ? "Đã xác thực" : "Chưa xác thực"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Chức năng",
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewItem(t)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditItem(t);
              setShowForm(true);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Chỉnh sửa"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteItem(t)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Người thuê"
        subtitle="Quản lý thông tin người thuê"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #8B5CF6, #A78BFA)"
        actions={
          <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
            <Plus size={18} /> Thêm người thuê
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setCurrentPage(1); }}
        placeholder="Tìm kiếm..."
        className="max-w-md"
      />

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Modal thêm/sửa người thuê */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Chỉnh sửa người thuê" : "Thêm người thuê mới"}
        size="lg"
        footer={
          editItem ? (
            <>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</Button>
              <Button onClick={handleEditSave}>Cập nhật</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</Button>
              <Button onClick={handleSaveTenantAndUser}>Tiếp tục tạo hợp đồng & tài khoản</Button>
            </>
          )
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <Input label="Họ tên *" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input label="CCCD *" value={formCitizenId} onChange={(e) => setFormCitizenId(e.target.value)} placeholder="079200001234" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input label="Ngày sinh" type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)} />
            </div>
            <div className="col-span-12">
              <Input label="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Địa chỉ thường trú" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xóa người thuê"
        message={`Bạn có chắc chắn muốn xóa người thuê "${deleteItem?.full_name}" không?`}
      />

      {/* Modal xem chi tiết người thuê */}
      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Chi tiết người thuê"
        size="md"
        footer={
          <Button onClick={() => setViewItem(null)}>Đóng</Button>
        }
      >
        {viewItem && (
          <div className="space-y-4 font-sans text-sm">
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Họ và tên:</span>
              <span className="font-semibold text-gray-800">{viewItem.full_name}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Số điện thoại:</span>
              <span className="font-semibold text-gray-800">{getUserPhone(viewItem.user_id)}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Email:</span>
              <span className="font-semibold text-gray-800">{getUserEmail(viewItem.user_id)}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Số CCCD:</span>
              <span className="font-semibold text-gray-800">{viewItem.citizen_id}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Ngày sinh:</span>
              <span className="font-semibold text-gray-800">
                {viewItem.date_of_birth ? formatDate(viewItem.date_of_birth) : "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Địa chỉ:</span>
              <span className="font-semibold text-gray-800">{viewItem.address || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Trạng thái xác thực:</span>
              <Badge variant={viewItem.is_verified ? "success" : "warning"}>
                {viewItem.is_verified ? "Đã xác thực" : "Chưa xác thực"}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
