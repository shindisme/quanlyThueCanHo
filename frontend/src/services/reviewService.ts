import api from "../lib/api";
import type { ReviewData, ReviewMeta, GetReviewsResponse, CreateReviewRequest } from "../types";
export type { ReviewData, ReviewMeta, GetReviewsResponse, CreateReviewRequest };


const REVIEW_API = "/reviews";

export async function getApartmentReviews(
  apartmentId: number,
  page: number = 1,
  limit: number = 10
): Promise<GetReviewsResponse> {
  const res = await api.get<{
    success: boolean;
    data: ReviewData[];
    meta: {
      averageRating: number;
      totalReviews: number;
      pagination: {
        page: number;
        totalPages: number;
      };
    };
  }>(`${REVIEW_API}/apartment/${apartmentId}`, {
    params: { page, limit },
  });

  return {
    data: res.data.data || [],
    meta: {
      averageRating: Number(res.data.meta?.averageRating || 0),
      totalReviews: Number(res.data.meta?.totalReviews || 0),
      currentPage: Number(res.data.meta?.pagination?.page || page),
      totalPages: Number(res.data.meta?.pagination?.totalPages || 0),
    },
  };
}

export async function create(data: CreateReviewRequest): Promise<unknown> {
  const res = await api.post(REVIEW_API, data);
  return res.data;
}

export const reviewService = {
  getApartmentReviews,
  create,
};
