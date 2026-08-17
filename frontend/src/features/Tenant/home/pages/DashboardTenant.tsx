import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useDashboardTenant } from "../hooks/useDashboardTenant";
import ApartmentInfoCard from "../components/ApartmentInfoCard";
import DashboardShortcuts from "../components/DashboardShortcuts";
import RoommatesCard from "../components/RoommatesCard";
import ReviewApartmentModal from "../components/ReviewApartmentModal";
import RefreshButton from "../../../../components/ui/RefreshButton";

export default function DashboardTenant() {
  const {
    displayName,
    occupants,
    activeContract,
    apartment,
    building,
    endedContract,
    endedApartment,
    endedBuilding,
    isLoading,
    reviewModalOpen,
    setReviewModalOpen,
    rating,
    setRating,
    comment,
    setComment,
    submittingReview,
    handleReviewSubmit,
  } = useDashboardTenant();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải tổng quan...</span>
      </div>
    );
  }

  const daysUntilExpiry = activeContract?.end_date
    ? Math.ceil((new Date(activeContract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    if (endedContract) {
      localStorage.setItem("has_ignored_review_contract_" + endedContract.id, "true");
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 font-sans">
      {/* header*/}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Thông tin tổng quan nơi cư trú của bạn</p>
        </div>
        <RefreshButton />
      </div>

      <ApartmentInfoCard
        activeContract={activeContract}
        apartment={apartment}
        building={building}
        endedContract={endedContract}
        endedApartment={endedApartment}
        endedBuilding={endedBuilding}
        daysUntilExpiry={daysUntilExpiry}
        onOpenReviewModal={() => setReviewModalOpen(true)}
      />

      <DashboardShortcuts />

      <RoommatesCard occupants={occupants} />

      {/*reivwew*/}
      <ReviewApartmentModal
        isOpen={reviewModalOpen}
        onClose={handleCloseReviewModal}
        endedApartment={endedApartment}
        endedBuilding={endedBuilding}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        onSubmit={handleReviewSubmit}
        isSubmitting={submittingReview}
      />
    </div>
  );
}
