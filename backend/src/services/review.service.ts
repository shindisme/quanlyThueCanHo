import {
    ContractStatus,
    Prisma
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../errors/app-error.js";
import type { CreateReviewRequest } from "../schemas/review.schema.js";
import type { Actor } from "../types/auth.js";

const requireTenantId = (actor: Actor) => {
    if (actor.tenantId === undefined) {
        throw new AppError(
            403,
            "TENANT_PROFILE_REQUIRED",
            "Yêu cầu phải có hồ sơ khách thuê liên kết"
        );
    }

    return actor.tenantId;
};

export const getMyReviewsService = async (actor: Actor) => {
    const tenantId = requireTenantId(actor);

    return await prisma.review.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: "desc" },
        include: {
            apartment: {
                select: {
                    id: true,
                    room_number: true,
                    floor: true,
                    building: {
                        select: {
                            id: true,
                            branch_name: true,
                            address: true
                        }
                    }
                }
            }
        }
    });
};

export const createReviewService = async (
    input: CreateReviewRequest["body"],
    actor: Actor
) => {
    const tenantId = requireTenantId(actor);

    // Kiểm tra xem người thuê đã từng gửi đánh giá cho phòng này chưa
    const existingReview = await prisma.review.findUnique({
        where: {
            apartment_id_tenant_id: {
                apartment_id: input.apartment_id,
                tenant_id: tenantId
            }
        }
    });

    if (existingReview) {
        throw new AppError(
            409,
            "REVIEW_ALREADY_EXISTS",
            "Bạn đã gửi đánh giá cho căn hộ này rồi. Mỗi căn hộ chỉ được đánh giá 1 lần."
        );
    }

    // Kiểm tra xem người thuê có hợp đồng đã kết thúc không
    const contract = await prisma.rentalContract.findFirst({
        where: {
            tenant_id: tenantId,
            apartment_id: input.apartment_id,
            status: ContractStatus.ENDED
        }
    });

    if (!contract) {
        throw new AppError(
            403,
            "FORBIDDEN",
            "Bạn chỉ có thể gửi đánh giá cho những căn hộ mà bạn đã kết thúc hợp đồng thuê."
        );
    }

    try {
        return await prisma.review.create({
            data: {
                apartment_id: input.apartment_id,
                tenant_id: tenantId,
                rating: input.rating,
                comment: input.comment
            }
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
            && error.code === "P2002"
        ) {
            throw new AppError(
                409,
                "REVIEW_ALREADY_EXISTS",
                "Bạn đã gửi đánh giá cho căn hộ này rồi. Mỗi căn hộ chỉ được đánh giá 1 lần."
            );
        }

        throw error;
    }
};

export const getApartmentReviewsService = async (
    apartmentId: number,
    page = 1,
    limit = 10
) => {
    const skip = (page - 1) * limit;
    const [
        reviews,
        total,
        aggregate
    ] = await prisma.$transaction([
        prisma.review.findMany({
            where: { apartment_id: apartmentId },
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                tenant: {
                    select: {
                        id: true,
                        full_name: true
                    }
                }
            }
        }),
        prisma.review.count({
            where: { apartment_id: apartmentId }
        }),
        prisma.review.aggregate({
            where: { apartment_id: apartmentId },
            _avg: { rating: true }
        })
    ]);

    return {
        data: reviews,
        averageRating: Number(
            (aggregate._avg.rating ?? 0).toFixed(1)
        ),
        totalReviews: total,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};
