import { useTenantOccupants } from "./useTenantOccupants";
import { useTenantApartmentInfo } from "./useTenantApartmentInfo";
import { useTenantReview } from "./useTenantReview";

export function useDashboardTenant() {
  const { occupants, loadingOccupants } = useTenantOccupants();

  const {
    email,
    displayName,
    activeContract,
    apartment,
    building,
    endedContract,
    endedApartment,
    endedBuilding,
    loadingApartmentInfo,
  } = useTenantApartmentInfo();

  const {
    reviewModalOpen,
    setReviewModalOpen,
    rating,
    setRating,
    comment,
    setComment,
    submittingReview,
    handleReviewSubmit,
  } = useTenantReview({
    activeContract,
    endedContract,
    endedApartment,
  });

  const isLoading = loadingOccupants || loadingApartmentInfo;

  return {
    email,
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
  };
}
