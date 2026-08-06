import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";

interface MaintenanceUnableModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  unableReason: string;
  setUnableReason: (val: string) => void;
  onUnableSubmit: (e: React.FormEvent) => void;
}

const MAX_LENGTH = 500;

export default function MaintenanceUnableModal({
  isOpen,
  onClose,
  saving,
  unableReason,
  setUnableReason,
  onUnableSubmit,
}: MaintenanceUnableModalProps) {
  const isSubmitDisabled = saving || !unableReason.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Báo Cáo Không Thể Sửa Chữa">
      <form onSubmit={onUnableSubmit} className="space-y-4 font-sans">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="unable-reason-textarea" className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> Lý do kỹ thuật / Cản trở không thể sửa <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-gray-400 font-medium">
              {unableReason.length}/{MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="unable-reason-textarea"
            className="w-full min-h-30 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all bg-white"
            value={unableReason}
            onChange={(e) => setUnableReason(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Ví dụ: Thiếu linh kiện thay thế, thiết bị hỏng nặng không thể xử lý tại chỗ, không thể liên hệ khách thuê..."
            maxLength={MAX_LENGTH}
            disabled={saving}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-xl">
            Hủy bỏ
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
            type="submit"
            disabled={isSubmitDisabled}
          >
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
