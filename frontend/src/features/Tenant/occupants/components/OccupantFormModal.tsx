import Button from "../../../../components/ui/Button";
import { DatePicker } from "../../../../components/ui/DatePicker";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import type { OccupantForm } from "../../../../types";
import { formatDateToISO } from "../../../../utils/date";

interface OccupantFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  form: OccupantForm;
  onChange: (form: OccupantForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function OccupantFormModal({ isOpen, isEditing, isSaving, form, onChange, onClose, onSave }: OccupantFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Chỉnh sửa người ở cùng" : "Khai báo người ở cùng"}>
      <div className="space-y-4">
        <Input label="Họ và tên *" placeholder="Ví dụ: Nguyễn Văn A" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
        <Input label="Số CCCD *" inputMode="numeric" maxLength={12} placeholder="Nhập đúng 12 chữ số" value={form.cccd} onChange={(event) => onChange({ ...form, cccd: event.target.value.replace(/\D/g, "") })} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Ngày sinh</label>
          <DatePicker
            value={form.dob ? new Date(`${form.dob}T00:00:00`) : undefined}
            onChange={(date) => onChange({ ...form, dob: formatDateToISO(date) })}
            placeholder="Chọn ngày sinh"
            maxDate={new Date()}
          />
        </div>
        <Input label="Số điện thoại" inputMode="tel" maxLength={10} placeholder="Ví dụ: 0912345678" value={form.phone || ""} onChange={(event) => onChange({ ...form, phone: event.target.value.replace(/\D/g, "") })} />
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button onClick={onSave} isLoading={isSaving}>{isEditing ? "Lưu thay đổi" : "Khai báo"}</Button>
        </div>
      </div>
    </Modal>
  );
}
