import { useState, useEffect, useMemo } from "react";
import { Star, CheckCircle2, Calendar } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { useCreateReview } from "../hooks/useContractReview";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { MyReviewData, RentalContract } from "../../../../types";

interface ContractReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  endedContracts: RentalContract[];
  myReviews: MyReviewData[];
  initialApartmentId?: number | null;
}

const RATING_LABELS: Record<number, string> = {
  5: "Tuyệt vời (5/5)",
  4: "Tốt (4/5)",
  3: "Bình thường (3/5)",
  2: "Tạm được (2/5)",
  1: "Kém (1/5)",
};

export default function ContractReviewModal({
  isOpen,
  onClose,
  endedContracts,
  myReviews,
  initialApartmentId,
}: ContractReviewModalProps) {
  const endedApartments = useMemo(() => {
    const map = new Map<number, {
      apartmentId: number;
      roomNumber: string;
      floor: number;
      branchName: string;
      address?: string;
    }>();

    endedContracts.forEach((c) => {
      if (c.apartment_id && !map.has(c.apartment_id)) {
        map.set(c.apartment_id, {
          apartmentId: c.apartment_id,
          roomNumber: c.apartment?.room_number || `P.${c.apartment_id}`,
          floor: c.apartment?.floor || 1,
          branchName: c.apartment?.building?.branch_name || c.apartment?.building?.name || "Tòa nhà",
          address: c.apartment?.building?.address,
        });
      }
    });

    return Array.from(map.values());
  }, [endedContracts]);

  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const createReviewMutation = useCreateReview();

  useEffect(() => {
    if (isOpen) {
      if (initialApartmentId && endedApartments.some((a) => a.apartmentId === initialApartmentId)) {
        setSelectedApartmentId(initialApartmentId);
      } else if (endedApartments.length > 0) {
        setSelectedApartmentId(endedApartments[0].apartmentId);
      }
      setRating(5);
      setComment("");
    }
  }, [isOpen, initialApartmentId, endedApartments]);

  const selectedApartment = useMemo(
    () => endedApartments.find((a) => a.apartmentId === selectedApartmentId) || null,
    [endedApartments, selectedApartmentId]
  );

  const existingReview = useMemo(
    () => myReviews.find((r) => r.apartment_id === selectedApartmentId) || null,
    [myReviews, selectedApartmentId]
  );

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedApartmentId) return;
    try {
      await createReviewMutation.mutateAsync({
        apartmentId: selectedApartmentId,
        rating,
        comment: comment.trim(),
      });
      setComment("");
    } catch {
      // empty
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingReview ? "Đánh giá của bạn" : "Đánh giá căn hộ"}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full font-sans">
          {existingReview ? (
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5"
            >
              Đóng
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs sm:text-sm">
        {endedApartments.length > 1 && (
          <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
            <label className="font-semibold text-gray-700">Chọn căn hộ:</label>
            <div className="flex flex-wrap gap-2">
              {endedApartments.map((apt) => {
                const isReviewed = myReviews.some((r) => r.apartment_id === apt.apartmentId);
                const isSelected = apt.apartmentId === selectedApartmentId;
                return (
                  <button
                    key={apt.apartmentId}
                    type="button"
                    onClick={() => {
                      setSelectedApartmentId(apt.apartmentId);
                      setRating(5);
                      setComment("");
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                      ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <span>{formatApartmentDisplay(apt.roomNumber, apt.floor)} ({apt.branchName})</span>
                    {isReviewed && (
                      <span className="inline-flex items-center text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-md">
                        Đã gửi
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedApartment && (
          <div className="flex items-center justify-between p-3  bg-gray-50">
            <div className="flex items-center gap-2.5">
              <div>
                <p className="font-bold text-gray-800">
                  {formatApartmentDisplay(selectedApartment.roomNumber, selectedApartment.floor)}
                </p>
                <p className="text-[11px] text-gray-500">{selectedApartment.branchName}</p>
              </div>
            </div>
            {existingReview ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                <CheckCircle2 size={13} /> Đã đánh giá
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                Chưa đánh giá
              </span>
            )}
          </div>
        )}

        {/* View Mode */}
        {existingReview ? (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-2 py-4 bg-amber-50/50 border border-amber-100/80">
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
              <div className="p-3.5 bg-gray-50  border border-gray-200 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap min-h-20 leading-relaxed">
                {existingReview.comment || (
                  <span className="italic text-gray-400">Không có nội dung nhận xét bằng văn bản.</span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center italic">
              Đánh giá này đã được ghi nhận vào hệ thống và công khai trên trang thông tin căn hộ.
            </p>
          </div>
        ) : (
          /* Create Mode (New Review) */
          <div className="space-y-4">
            <p className="text-gray-500 text-xs">
              Hãy chia sẻ trải nghiệm thực tế của bạn tại căn hộ này để giúp chúng tôi hoàn thiện chất lượng dịch vụ.
            </p>

            <div className="flex flex-col items-center gap-2 py-3 bg-gray-50/70 border border-gray-150">
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
                placeholder="Nhập cảm nhận của bạn về phòng ốc, tiện ích, hỗ trợ từ ban quản lý..."
                className="premium-input rounded-xl resize-none text-xs p-3 border border-gray-250 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
