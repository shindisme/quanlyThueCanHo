import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";

interface ProfileEditModalProps {
  isOpen: boolean;
  fullName: string;
  phone: string;
  isSaving: boolean;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ProfileEditModal({
  isOpen,
  fullName,
  phone,
  isSaving,
  onFullNameChange,
  onPhoneChange,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa thông tin tài khoản">
      <div className="space-y-4">
        <Input label="Họ và tên hiển thị *" value={fullName} onChange={(event) => onFullNameChange(event.target.value)} />
        <Input
          label="Số điện thoại liên hệ"
          inputMode="tel"
          maxLength={10}
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, ""))}
        />
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button onClick={onSave} isLoading={isSaving}>Lưu thay đổi</Button>
        </div>
      </div>
    </Modal>
  );
}
