import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import type { Tenant } from "../../../../types";
import { toast } from "sonner";
import * as tenantService from "../../../../services/tenantService";

interface TenantModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Tenant | null;
}

export default function TenantModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: TenantModifyModalProps) {
  const [formFullName, setFormFullName] = useState("");
  const [formCitizenId, setFormCitizenId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  useEffect(() => {
    if (editItem && isOpen) {
      setFormFullName(editItem.full_name);
      setFormCitizenId(editItem.citizen_id);
      setFormDob(
        editItem.date_of_birth
          ? new Date(editItem.date_of_birth).toISOString().split("T")[0]
          : ""
      );
      setFormAddress(editItem.address || "");
      setFormEmail(editItem.email || "");
      setFormPhone(editItem.phone || "");
    }
  }, [editItem, isOpen]);

  async function handleEditSave() {
    if (!formFullName || !formCitizenId || !editItem) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD");
      return;
    }
    try {
      await tenantService.updateTenant(editItem.id, {
        full_name: formFullName,
        citizen_id: formCitizenId,
        date_of_birth: formDob ? new Date(formDob).toISOString() : null,
        address: formAddress || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
      });
      toast.success("Đã cập nhật thông tin người thuê");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin người thuê"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleEditSave}>Cập nhật</Button>
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
          <div className="col-span-12 sm:col-span-6">
            <Input label="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Số điện thoại" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0901234567" />
          </div>
          <div className="col-span-12">
            <Input label="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Địa chỉ thường trú" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
