import { Request, Response } from "express";
import * as reviewService from "../services/review.service.js";

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ message: "Không tìm thấy thông tin xác thực!" });
            return;
        }

        const { apartment_id, rating, comment } = req.body;

        if (!apartment_id || rating === undefined) {
            res.status(400).json({ message: "Thiếu thông tin căn hộ (apartment_id) hoặc điểm đánh giá (rating)." });
            return;
        }

        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            res.status(400).json({ message: "Điểm đánh giá phải là số từ 1 đến 5." });
            return;
        }

        const data = await reviewService.createReviewService({
            user_id: userId, 
            apartment_id: Number(apartment_id),
            rating: ratingNum,
            comment
        });

        res.status(201).json({ 
            message: "Cảm ơn bạn đã đánh giá căn hộ!", 
            data 
        });
    } catch (error: any) {
        res.status(403).json({ error: error.message });
    }
};

export const getByApartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const apartmentId = Number(req.params.apartmentId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        if (isNaN(apartmentId)) {
            res.status(400).json({ message: "ID Căn hộ không hợp lệ." });
            return;
        }

        const result = await reviewService.getApartmentReviewsService(apartmentId, page, limit);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};