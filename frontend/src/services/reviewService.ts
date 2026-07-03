import api from "../lib/api";

export interface ReviewData {
  id: number;
  apartment_id: number;
  tenant_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  tenant?: {
    id: number;
    full_name: string;
  };
}

export interface ReviewMeta {
  averageRating: number;
  totalReviews: number;
  currentPage: number;
  totalPages: number;
}

export interface GetReviewsResponse {
  data: ReviewData[];
  meta: ReviewMeta;
}

export async function getApartmentReviews(
  apartmentId: number,
  page: number = 1,
  limit: number = 10
): Promise<GetReviewsResponse> {
  const res = await api.get<GetReviewsResponse>(`/reviews/apartment/${apartmentId}`, {
    params: { page, limit },
  });
  return res.data;
}

export async function createReview(data: {
  apartment_id: number;
  rating: number;
  comment?: string;
}): Promise<unknown> {
  const res = await api.post("/reviews", data);
  return res.data;
}
