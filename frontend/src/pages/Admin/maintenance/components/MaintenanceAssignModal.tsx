import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Calendar from "../../../../components/ui/Calendar";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

interface MaintenanceAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingStaff: boolean;
  saving: boolean;
  technicians: any[];
  assignedStaffId: string;
  setAssignedStaffId: (val: string) => void;
  scheduledAt: string;
  setScheduledAt: (val: string) => void;
  onConfirm: (e: React.FormEvent) => void;
}

export default function MaintenanceAssignModal({
  isOpen,
  onClose,
  loadingStaff,
  saving,
  technicians,
  assignedStaffId,
  setAssignedStaffId,
  scheduledAt,
  setScheduledAt,
  onConfirm,
}: MaintenanceAssignModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Nhận & Phân Công Sửa Chữa">
      {loadingStaff ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải...</span>
        </div>
      ) : (
        <form onSubmit={onConfirm} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-650 mb-1 select-none">Nhân viên kỹ thuật phụ trách</label>
            <Combobox
              options={technicians.map((t) => ({ value: String(t.id), label: `${t.full_name} (${t.position})` }))}
              value={assignedStaffId}
              onChange={setAssignedStaffId}
              className="w-full"
              triggerClassName="h-[42px] rounded-none border-gray-300 px-4 py-2.5"
              placeholder="Chọn nhân viên kỹ thuật"
              clearable={true}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-650 mb-1 select-none">Thời gian hẹn sửa chữa</label>
            <Calendar
              showTime={true}
              value={scheduledAt ? new Date(scheduledAt) : null}
              onChange={(date) => {
                setScheduledAt(date ? date.toISOString() : "");
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-none">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving} className="rounded-none">Xác nhận & Giao việc</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
