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

export default function MaintenanceUnableModal({
  isOpen,
  onClose,
  saving,
  unableReason,
  setUnableReason,
  onUnableSubmit,
}: MaintenanceUnableModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Báo Cáo Không Thể Sửa Chữa">
      <form onSubmit={onUnableSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle size={14} /> Lý do kỹ thuật / Cản trở không thể sửa
          </label>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
            value={unableReason}
            onChange={(e) => setUnableReason(e.target.value)}
            placeholder="Nhập lý do chi tiết"
            required
            disabled={saving}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-none">
            Hủy bỏ
          </Button>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-none" type="submit" disabled={saving}>
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
