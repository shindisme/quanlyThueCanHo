import { Request, Response } from "express";
import { imagekit } from "../config/imagekit.js";

export const uploadMultipleImages = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "Vui lòng chọn ít nhất 1 ảnh" });
        }

        const uploadPromises = files.map(file =>
            imagekit.upload({
                file: file.buffer.toString("base64"),
                fileName: `${Date.now()}_${file.originalname}`,
                folder: "/buildings"
            })
        );

        const results = await Promise.all(uploadPromises);

        const urls = results.map(r => r.url);
        res.status(200).json({ urls });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};