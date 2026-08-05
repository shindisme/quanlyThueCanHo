import api from "../lib/api";
import type { ReviewData, ReviewMeta, GetReviewsResponse, CreateReviewRequest } from "../types";
export type { ReviewData, ReviewMeta, GetReviewsResponse, CreateReviewRequest };


const REVIEW_API = "/reviews";

export async function getApartmentReviews(
  apartmentId: number,
  page: number = 1,
  limit: number = 10
): Promise<GetReviewsResponse> {
  const res = await api.get<GetReviewsResponse>(`${REVIEW_API}/apartment/${apartmentId}`, {
    params: { page, limit },
  });
  return res.data;
}

export async function create(data: CreateReviewRequest): Promise<unknown> {
  const res = await api.post(REVIEW_API, data);
  return res.data;
}

export const reviewService = {
  getApartmentReviews,
  create,
};
