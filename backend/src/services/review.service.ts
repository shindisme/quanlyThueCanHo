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
            "A linked tenant profile is required"
        );
    }

    return actor.tenantId;
};

export const createReviewService = async (
    input: CreateReviewRequest["body"],
    actor: Actor
) => {
    const tenantId = requireTenantId(actor);

    try {
        return await prisma.review.create({
            data: {
                apartment: {
                    connect: {
                        id: input.apartment_id,
                        contracts: {
                            some: {
                                tenant_id: tenantId,
                                status: ContractStatus.ENDED
                            }
                        }
                    }
                },
                tenant: {
                    connect: {
                        id: tenantId,
                        user_id: actor.userId
                    }
                },
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
                "This apartment has already been reviewed"
            );
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError
            && error.code === "P2025"
        ) {
            throw new AppError(
                404,
                "NOT_FOUND",
                "An ended contract for this apartment was not found"
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
