import { Star } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { Apartment, Building } from "../../../../types";

interface ReviewApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  endedApartment: Apartment | null;
  endedBuilding: Building | null;
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const RATING_LABELS: Record<number, string> = {
  5: "Tuyệt vời (5/5)",
  4: "Tốt (4/5)",
  3: "Bình thường (3/5)",
  2: "Tạm được (2/5)",
  1: "Kém (1/5)",
};

export default function ReviewApartmentModal({
  isOpen,
  onClose,
  endedApartment,
  endedBuilding,
  rating,
  setRating,
  comment,
  setComment,
  onSubmit,
  isSubmitting,
}: ReviewApartmentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh giá căn hộ đã thuê"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-sm">
        <p className="text-gray-500 text-xs">
          Trải nghiệm của bạn tại căn hộ <strong>P.{endedApartment?.room_number}</strong> ({endedBuilding?.branch_name}) là vô cùng quan trọng đối với chúng tôi.
        </p>

        <div className="flex flex-col items-center gap-2 py-4 border-y border-gray-50">
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
            placeholder="Nhập nội dung nhận xét của bạn..."
            className="premium-input rounded-xl resize-none text-xs p-3 border border-gray-250 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>
    </Modal>
  );
}
