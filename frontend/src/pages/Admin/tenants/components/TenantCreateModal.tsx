import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { mockTenants } from "../../../../data/tenants";
import { mockUsers } from "../../../../data/users";
import { toast } from "sonner";

interface TenantCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: string | null;
  managerBuildingId?: number;
}

export default function TenantCreateModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  managerBuildingId,
}: TenantCreateModalProps) {
  const navigate = useNavigate();
  const [formFullName, setFormFullName] = useState("");
  const [formCitizenId, setFormCitizenId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");

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
        updated_at: new Date().toISOString(),
      };
      currentUsers.push(newUser);
      localStorage.setItem("custom-users", JSON.stringify(currentUsers));
    }

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
      created_at: new Date().toISOString(),
    };

    currentTenants.push(newTenant);
    localStorage.setItem("custom-tenants", JSON.stringify(currentTenants));

    toast.success(`Đã tự động tạo tài khoản "${username}" (Mật khẩu: 123456) và lưu người thuê thành công!`);

    // Reset fields
    setFormFullName("");
    setFormCitizenId("");
    setFormDob("");
    setFormAddress("");

    onSuccess();
    onClose();

    // Redirect to contract page wizard
    const basePath = role === "MANAGER" ? "/manager" : "/admin";
    navigate(
      `${basePath}/contracts?auto_open=true&new_tenant_id=${newTenantId}&new_tenant_building_id=${
        managerBuildingId || ""
      }`
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm người thuê mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSaveTenantAndUser}>Tiếp tục tạo hợp đồng & tài khoản</Button>
        </>
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
  );
}
