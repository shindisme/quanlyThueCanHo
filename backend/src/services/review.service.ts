import { prisma } from "../config/database.js";

export const createReviewService = async (data: {
    user_id: number;
    apartment_id: number;
    rating: number;
    comment?: string;
}) => {
    const tenant = await prisma.tenant.findUnique({
        where: { user_id: data.user_id }
    });

    if (!tenant) {
        throw new Error("Tài khoản của bạn chưa được liên kết với hồ sơ người thuê hợp lệ.");
    }

    const existingReview = await prisma.review.findFirst({
        where: {
            tenant_id: tenant.id,
            apartment_id: data.apartment_id
        }
    });

    if (existingReview) {
        throw new Error("Bạn đã đánh giá căn hộ này rồi. Không thể đánh giá thêm.");
    }

    const validContract = await prisma.rentalContract.findFirst({
        where: {
            apartment_id: data.apartment_id,
            tenant_id: tenant.id,
            status: "ENDED"
        }
    });

    if (!validContract) {
        throw new Error("Bạn chỉ có thể đánh giá sau khi đã thuê và kết thúc hợp đồng tại căn hộ này!");
    }

    return await prisma.review.create({
        data: {
            apartment_id: data.apartment_id,
            tenant_id: tenant.id,
            rating: data.rating,
            comment: data.comment
        }
    });
};

export const getApartmentReviewsService = async (apartmentId: number, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const [reviews, total] = await prisma.$transaction([
        prisma.review.findMany({
            where: { apartment_id: apartmentId },
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                tenant: {
                    select: { 
                        id: true, 
                        full_name: true, 
                    }
                }
            }
        }),
        prisma.review.count({ where: { apartment_id: apartmentId } })
    ]);

    const allReviewsForAvg = await prisma.review.findMany({
        where: { apartment_id: apartmentId },
        select: { rating: true }
    });
    
    const averageRating = allReviewsForAvg.length > 0 
        ? allReviewsForAvg.reduce((sum, r) => sum + r.rating, 0) / allReviewsForAvg.length 
        : 0;

    return {
        data: reviews,
        meta: {
            averageRating: Number(averageRating.toFixed(1)),
            totalReviews: allReviewsForAvg.length,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        }
    };
};