import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import DatePicker from "../../../../components/ui/DatePicker";
import { useCreateContractTermination } from "../hooks/useContractTermination";
import { formatDateToISO } from "../../../../utils/date";
import { toast } from "sonner";
import type { RentalContract } from "../../../../types";

interface ContractTerminationModalProps {
  contract: RentalContract | null;
  onClose: () => void;
}

export default function ContractTerminationModal({
  contract,
  onClose,
}: ContractTerminationModalProps) {
  const [checkoutDate, setCheckoutDate] = useState("");
  const [checkoutReason, setCheckoutReason] = useState("");
  const createTerminationMutation = useCreateContractTermination();

  useEffect(() => {
    if (contract) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 60);
      const contractEndDate = new Date(`${contract.end_date}T00:00:00`);
      const suggestedDate = !Number.isNaN(contractEndDate.getTime()) && contractEndDate < defaultDate
        ? contractEndDate
        : defaultDate;
      setCheckoutDate(formatDateToISO(suggestedDate));
      setCheckoutReason("");
    }
  }, [contract]);

  if (!contract) return null;

  const handleSubmit = async () => {
    if (!checkoutDate) {
      toast.error("Vui lòng chọn ngày đề xuất trả phòng!");
      return;
    }
    const [y, m, d] = checkoutDate.split("-").map(Number);
    const chosenDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(chosenDate.getTime())) {
      toast.error("Ngày trả phòng không hợp lệ!");
      return;
    }

    if (chosenDate.getTime() < today.getTime()) {
      toast.error("Ngày trả phòng không được ở quá khứ!");
      return;
    }

    const contractEndDate = new Date(`${contract.end_date}T00:00:00`);
    if (!Number.isNaN(contractEndDate.getTime()) && chosenDate > contractEndDate) {
      toast.error("Ngày trả phòng không được sau ngày kết thúc hợp đồng!");
      return;
    }
    if (!checkoutReason.trim()) {
      toast.error("Vui lòng nhập lý do trả phòng!");
      return;
    }

    try {
      await createTerminationMutation.mutateAsync({
        contract_id: contract.id,
        requested_end_date: checkoutDate,
        reason: checkoutReason.trim(),
      });
      onClose();
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <Modal
      isOpen={!!contract}
      onClose={onClose}
      title="Gửi yêu cầu trả phòng sớm"
      footer={
        <div className="flex justify-end gap-2 w-full font-sans">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={createTerminationMutation.isPending}
            className="rounded-xl"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTerminationMutation.isPending}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {createTerminationMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs sm:text-sm text-left">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
          <AlertTriangle className="shrink-0 text-amber-600" size={20} />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-xs sm:text-sm">Quy định trả phòng sớm</h4>
            <p className="text-xs text-amber-700 leading-normal">
              Bạn có thể chọn ngày trả phòng mong muốn. Báo trước từ 60 ngày trở lên được áp dụng chính sách hoàn cọc; dưới 60 ngày hệ thống sẽ áp dụng chính sách cọc khi quản lý duyệt.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-550 block mb-1">Ngày thông báo (Hôm nay)</label>
              <input
                type="text"
                value={new Date().toLocaleDateString("vi-VN")}
                disabled
                className="w-full rounded-lg border-gray-300 bg-gray-150 p-2 text-xs font-semibold text-gray-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-550 block mb-1">Ngày đề xuất trả phòng *</label>
              <DatePicker
                value={checkoutDate}
                onChange={(date) => {
                  setCheckoutDate(date ? formatDateToISO(date) : "");
                }}
                minDate={new Date()}
                maxDate={contract.end_date}
                placeholder="Chọn ngày trả phòng"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-550 block mb-1">Lý do trả phòng *</label>
            <textarea
              value={checkoutReason}
              onChange={(e) => setCheckoutReason(e.target.value)}
              placeholder="Vui lòng nhập lý do trả phòng sớm (ví dụ: Chuyển công tác, thay đổi nhu cầu...)"
              className="w-full rounded-lg border-gray-300 p-2.5 text-xs focus:ring-primary-500 min-h-20"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
