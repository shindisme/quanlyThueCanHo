import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { DatePicker } from "../../../../components/ui/DatePicker";
import type { Tenant } from "../../../../types";
import { useTenantModify } from "../../../../hooks/useTenantModify";

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
    formFullName,
    setFormFullName,
    formCitizenId,
    setFormCitizenId,
    formDob,
    setFormDob,
    formAddress,
    setFormAddress,
    formEmail,
    setFormEmail,
    formPhone,
    setFormPhone,
    loading,
    handleEditSave,
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
          <Button onClick={handleEditSave} isLoading={loading}>Cập nhật</Button>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
            <DatePicker
              value={formDob ? new Date(formDob) : null}
              onChange={(date) => {
                if (!date) {
                  setFormDob("");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setFormDob(`${y}-${m}-${d}`);
              }}
              placeholder="Chọn ngày sinh..."
            />
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
