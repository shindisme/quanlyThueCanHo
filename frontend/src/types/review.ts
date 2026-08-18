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

export interface MyReviewData {
  id: number;
  apartment_id: number;
  tenant_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  apartment?: {
    id: number;
    room_number: string;
    floor: number;
    building?: {
      id: number;
      branch_name: string;
      address: string;
    };
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

export interface CreateReviewRequest {
  apartment_id: number;
  rating: number;
  comment?: string;
}
