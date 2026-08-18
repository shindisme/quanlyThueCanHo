import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type {
    CreateReviewRequest,
    ListApartmentReviewsRequest
} from "../schemas/review.schema.js";
import * as reviewService from "../services/review.service.js";
import {
    sendPaginated,
    sendSuccess
} from "../utils/api-response.js";

export const create = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<CreateReviewRequest>(request);
    const review = await reviewService.createReviewService(
        body,
        request.actor!
    );

    return sendSuccess(response, review, 201);
};

export const getMyReviews = async (
    request: Request,
    response: Response
) => {
    const reviews = await reviewService.getMyReviewsService(request.actor!);
    return sendSuccess(response, reviews);
};

export const getByApartment = async (
    request: Request,
    response: Response
) => {
    const {
        params,
        query
    } = getValidated<ListApartmentReviewsRequest>(request);
    const result = await reviewService.getApartmentReviewsService(
        params.apartmentId,
        query.page,
        query.limit
    );

    return sendPaginated(
        response,
        result.data,
        result.pagination,
        200,
        {
            averageRating: result.averageRating,
            totalReviews: result.totalReviews
        }
    );
};
