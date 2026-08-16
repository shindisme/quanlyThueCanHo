import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { useCreateReview } from "../hooks/useContractReview";
import type { RentalContract } from "../../../../types";

interface ContractReviewModalProps {
  contract: RentalContract | null;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  5: "Tuyệt vời (5/5)",
  4: "Tốt (4/5)",
  3: "Bình thường (3/5)",
  2: "Tạm được (2/5)",
  1: "Kém (1/5)",
};

export default function ContractReviewModal({
  contract,
  onClose,
}: ContractReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const createReviewMutation = useCreateReview();

  useEffect(() => {
    if (contract) {
      setRating(5);
      setComment("");
    }
  }, [contract]);

  if (!contract) return null;

  const handleSubmit = async () => {
    try {
      await createReviewMutation.mutateAsync({
        apartmentId: contract.apartment_id,
        rating,
        comment: comment.trim(),
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
      title="Đánh giá căn hộ"
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full font-sans">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createReviewMutation.isPending}
            className="rounded-xl"
          >
            Hủy
          </Button>
          <Button
            isLoading={createReviewMutation.isPending}
            onClick={handleSubmit}
            className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white"
          >
            Gửi đánh giá
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs sm:text-sm">
        <p className="text-gray-500">
          Hãy chia sẻ trải nghiệm của bạn tại căn hộ này sau khi kết thúc hợp đồng thuê.
        </p>

        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-sm font-semibold text-gray-700">Điểm đánh giá:</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
              >
                <Star
                  size={32}
                  className={
                    star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                  }
                />
              </button>
            ))}
          </div>
          <span className="text-xs text-amber-600 font-bold mt-1">
            {RATING_LABELS[rating] || "Bình thường"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-gray-700">Ý kiến nhận xét:</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhập nội dung nhận xét của bạn về căn hộ, dịch vụ, quản lý..."
            className="premium-input rounded-xl resize-none text-xs p-3 border border-gray-250 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>
    </Modal>
  );
}
