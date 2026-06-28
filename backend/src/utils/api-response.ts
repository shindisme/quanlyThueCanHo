import type { Response } from "express";

export type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

type Metadata = Record<string, unknown>;

export type SuccessResponse<
    T,
    M extends Metadata = Metadata
> = {
    success: true;
    data: T;
    meta?: M;
};

type PaginatedMetadata<M extends Metadata> = Omit<M, "pagination"> & {
    pagination: Pagination;
};

export type PaginatedResponse<
    T,
    M extends Metadata = Record<string, never>
> = SuccessResponse<T, PaginatedMetadata<M>> & {
    meta: PaginatedMetadata<M>;
};

export const sendSuccess = <
    T,
    M extends Metadata = Record<string, never>
>(
    response: Response,
    data: T,
    statusCode = 200,
    meta?: M
) => {
    const body: SuccessResponse<T, M> = {
        success: true,
        data
    };

    if (meta !== undefined) {
        body.meta = meta;
    }

    return response.status(statusCode).json(body);
};

export const sendPaginated = <
    T,
    M extends Metadata = Record<string, never>
>(
    response: Response,
    data: T,
    pagination: Pagination,
    statusCode = 200,
    extraMetadata?: M
) => {
    const meta = {
        ...extraMetadata,
        pagination
    } as PaginatedMetadata<M>;

    return response.status(statusCode).json({
        success: true,
        data,
        meta
    } satisfies PaginatedResponse<T, M>);
};
