import type { Response } from "express";

export type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type SuccessResponse<T> = {
    success: true;
    data: T;
};

export type PaginatedResponse<T> = SuccessResponse<T> & {
    meta: {
        pagination: Pagination;
    };
};

export const sendSuccess = <T>(
    response: Response,
    data: T,
    statusCode = 200
) => {
    return response.status(statusCode).json({
        success: true,
        data
    } satisfies SuccessResponse<T>);
};

export const sendPaginated = <T>(
    response: Response,
    data: T,
    pagination: Pagination,
    statusCode = 200
) => {
    return response.status(statusCode).json({
        success: true,
        data,
        meta: {
            pagination
        }
    } satisfies PaginatedResponse<T>);
};
