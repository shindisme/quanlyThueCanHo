import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { Calendar } from "../../../../components/ui/Calendar";
import type { Tenant } from "../../../../types";
import { useTenantModify } from "../../../../hooks/admin/useTenantModify";

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
  const {
    fullName,
    setFullName,
    citizenId,
    setCitizenId,
    dob,
    setDob,
    address,
    setAddress,
    email,
    setEmail,
    phone,
    setPhone,
    loading,
    handleUpdateTenant,
  } = useTenantModify({ isOpen, onClose, onSuccess, editItem });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin người thuê"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleUpdateTenant} isLoading={loading}>Cập nhật</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input label="Họ tên *" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập họ tên" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="CCCD *" value={citizenId} onChange={(e) => setCitizenId(e.target.value)} placeholder="Nhập số CCCD" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
            <Calendar
              value={dob || null}
              onChange={(date) => {
                if (!date) {
                  setDob("");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setDob(`${y}-${m}-${d}`);
              }}
              placeholder="Chọn ngày sinh..."
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
          </div>
          <div className="col-span-12">
            <Input label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
