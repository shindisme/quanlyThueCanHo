import { Star, CheckCircle2, Calendar } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { formatDate } from "../../../../utils/date";
import type { Apartment, Building, MyReviewData } from "../../../../types";

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
  existingReview?: MyReviewData | null;
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
  existingReview,
}: ReviewApartmentModalProps) {
  const isViewMode = Boolean(existingReview);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewMode ? "Đánh giá của bạn" : "Đánh giá căn hộ đã thuê"}
      footer={
        <div className="flex justify-end gap-2 w-full">
          {isViewMode ? (
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="rounded-xl px-5"
            >
              Đóng
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4 font-sans text-sm">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-150">
          <div>
            <p className="font-bold text-gray-800">
              Căn hộ P.{endedApartment?.floor}{endedApartment?.room_number}
            </p>
            <p className="text-xs text-gray-500">{endedBuilding?.branch_name || endedBuilding?.name || "Tòa nhà"}</p>
          </div>
          {isViewMode ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
              <CheckCircle2 size={13} /> Đã đánh giá
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
              Chưa đánh giá
            </span>
          )}
        </div>

        {isViewMode && existingReview ? (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-2 py-4 bg-amber-50/50 rounded-2xl border border-amber-100/80">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Điểm bạn đã chấm
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={28}
                    className={
                      star <= existingReview.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-amber-700 font-bold">
                {RATING_LABELS[existingReview.rating] || `${existingReview.rating}/5 sao`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Nội dung nhận xét:</span>
                {existingReview.created_at && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar size={12} />
                    {formatDate(existingReview.created_at)}
                  </span>
                )}
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap min-h-20 leading-relaxed">
                {existingReview.comment || (
                  <span className="italic text-gray-400">Không có nội dung nhận xét bằng văn bản.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-xs">
              Trải nghiệm của bạn tại căn hộ <strong>P.{endedApartment?.room_number}</strong> ({endedBuilding?.branch_name}) là vô cùng quan trọng đối với chúng tôi.
            </p>

            <div className="flex flex-col items-center gap-2 py-3 bg-gray-50/70 rounded-2xl border border-gray-150">
              <span className="text-xs font-semibold text-gray-700">Chọn mức độ hài lòng:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-115 cursor-pointer p-0.5"
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
              <span className="text-xs text-amber-600 font-bold">
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
        )}
      </div>
    </Modal>
  );
}
