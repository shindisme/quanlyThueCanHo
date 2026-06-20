import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { toast } from "sonner";
import * as tenantService from "../../../../services/tenantService";

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
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  async function handleSaveTenantAndUser() {
    if (!formFullName || !formCitizenId) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD");
      return;
    }

    const cleanCCCD = formCitizenId.trim();
    const last6Digits = cleanCCCD.slice(-6);
    const username = `YH${last6Digits}`;
    const defaultEmail = `${username}@yukihouse.vn`;
    const finalEmail = formEmail.trim() || defaultEmail;
    const finalPhone = formPhone.trim() || null;

    try {
      const tenant = await tenantService.createTenant({
        full_name: formFullName,
        citizen_id: formCitizenId,
        date_of_birth: formDob ? new Date(formDob).toISOString() : null,
        address: formAddress || null,
        email: finalEmail,
        phone: finalPhone,
      });

      toast.success(`Đã tự động tạo tài khoản "${username}" (Mật khẩu: 123456) và lưu người thuê thành công!`);

      // Reset fields
      setFormFullName("");
      setFormCitizenId("");
      setFormDob("");
      setFormAddress("");
      setFormEmail("");
      setFormPhone("");

      onSuccess();
      onClose();

      // Redirect to contract page wizard
      const basePath = role === "MANAGER" ? "/manager" : "/admin";
      navigate(
        `${basePath}/contracts?auto_open=true&new_tenant_id=${tenant.id}&new_tenant_building_id=${managerBuildingId || ""
        }`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo người thuê");
    }
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
            <Input label="Họ tên *" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Nhập họ tên" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="CCCD *" value={formCitizenId} onChange={(e) => setFormCitizenId(e.target.value)} placeholder="Nhập số CCCD" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Ngày sinh" type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)} />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Nhập email" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Số điện thoại" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Nhập số điện thoại" />
          </div>
          <div className="col-span-12">
            <Input label="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Nhập địa chỉ" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
