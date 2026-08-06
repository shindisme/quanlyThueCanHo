import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import DatePicker from "../../../../components/ui/DatePicker";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { toast } from "sonner";
import type { Priority } from "../../../../constants/enums";

export interface Technician {
  id: number;
  full_name: string;
  position?: string | null;
}

interface MaintenanceAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingStaff: boolean;
  saving: boolean;
  technicians: Technician[];
  assignedStaffId: string;
  setAssignedStaffId: (val: string) => void;
  scheduledAt: string;
  setScheduledAt: (val: string) => void;
  priority: Priority;
  setPriority: (val: Priority) => void;
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
  priority,
  setPriority,
  onConfirm,
}: MaintenanceAssignModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedStaffId) {
      toast.error("Vui lòng chọn nhân viên kỹ thuật phụ trách");
      return;
    }
    onConfirm(e);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Nhận & Phân Công Sửa Chữa">
      {loadingStaff ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách nhân viên...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 mb-1 select-none block">
              Mức độ ưu tiên xử lý <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={[
                { value: "LOW", label: "Thấp" },
                { value: "MEDIUM", label: "Trung bình" },
                { value: "HIGH", label: "Khẩn cấp" },
              ]}
              value={priority}
              onChange={(val) => setPriority(val as Priority)}
              className="w-full"
              triggerClassName="h-[42px] shadow-lg border-gray-300 px-4 py-2.5"
              placeholder="Chọn mức độ ưu tiên"
              clearable={false}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 mb-1 select-none block">
              Nhân viên kỹ thuật phụ trách <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={technicians.map((t) => ({
                value: String(t.id),
                label: t.position ? `${t.full_name} (${t.position})` : t.full_name,
              }))}
              value={assignedStaffId}
              onChange={setAssignedStaffId}
              className="w-full"
              triggerClassName="h-[42px] shadow-lg border-gray-300 px-4 py-2.5"
              placeholder="Chọn nhân viên kỹ thuật"
              clearable={true}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 mb-1 select-none block">
              Thời gian hẹn sửa chữa <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={true}
              disablePast={true}
              value={scheduledAt ? new Date(scheduledAt) : null}
              className="rounded-xl shadow-lg border-gray-300 px-4 py-2.5"
              onChange={(date) => {
                setScheduledAt(date ? date.toISOString() : "");
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving || !assignedStaffId}>
              Xác nhận & Giao việc
            </Button>
          </div>
        </form>
      )
      }
    </Modal >
  );
}
