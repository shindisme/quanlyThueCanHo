import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { ViewingSchedule } from "../../../../types";
import { parseGuestName } from "../../../../utils/string";

interface ScheduleCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  schedule: ViewingSchedule | null;
  loading?: boolean;
}

export default function ScheduleCancelModal({
  isOpen,
  onClose,
  onConfirm,
  schedule,
  loading = false,
}: ScheduleCancelModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  if (!schedule) return null;

  const { name: guestName } = parseGuestName(schedule.guest_name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
  };

  const handleCloseModal = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Hủy lịch xem phòng"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận hủy lịch"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
        <p className="text-gray-600">
          Bạn có chắc chắn muốn hủy lịch xem phòng của khách{" "}
          <strong className="text-gray-900">{guestName}</strong>?
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do hủy lịch
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do hủy lịch xem phòng..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
          />
        </div>
      </form>
    </Modal>
  );
}
