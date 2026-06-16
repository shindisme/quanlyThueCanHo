import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { mockTenants } from "../../../../data/tenants";
import type { Tenant } from "../../../../types";
import { toast } from "sonner";

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

  useEffect(() => {
    if (editItem && isOpen) {
      setFormFullName(editItem.full_name);
      setFormCitizenId(editItem.citizen_id);
      setFormDob(editItem.date_of_birth || "");
      setFormAddress(editItem.address || "");
    }
  }, [editItem, isOpen]);

  function handleEditSave() {
    if (!formFullName || !formCitizenId) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD");
      return;
    }
    const storedTenants = localStorage.getItem("custom-tenants");
    let currentTenants = storedTenants ? JSON.parse(storedTenants) : [...mockTenants];

    const updated = currentTenants.map((t: any) =>
      t.id === editItem?.id
        ? {
            ...t,
            full_name: formFullName,
            citizen_id: formCitizenId,
            date_of_birth: formDob || null,
            address: formAddress || null,
          }
        : t
    );
    localStorage.setItem("custom-tenants", JSON.stringify(updated));
    toast.success("Đã cập nhật thông tin người thuê");
    onSuccess();
    onClose();
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
          <div className="col-span-12">
            <Input label="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Địa chỉ thường trú" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
