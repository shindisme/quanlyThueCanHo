import { Request, Response } from "express";
import * as apartmentService from "../services/apartment.service.js";
import { imagekit } from "@/config/imagekit.js";

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];
        const uploadPromises = files?.map(file =>
            imagekit.upload({
                file: file.buffer.toString("base64"),
                fileName: `${Date.now()}_${file.originalname}`,
                folder: "/apartments"
            })
        ) || [];

        const results = await Promise.all(uploadPromises);
        const imageUrls = results.map(r => r.url);

        const data = await apartmentService.createApartmentWithImagesService(
            req.body,
            imageUrls
        );

        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const { building_id, search, page, limit } = req.query;
    const result = await apartmentService.getAllApartmentsService({
        building_id: building_id ? Number(building_id) : undefined,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
    });
    res.json(result);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    const data = await apartmentService.getApartmentByIdService(Number(req.params.id));
    data ? res.json(data) : res.status(404).json({ message: "Not found" });
};

export const update = async (req: Request, res: Response) => {
    try {
        const apartmentId = Number(req.params.id);
        const files = req.files as Express.Multer.File[];

        const uploadPromises = files.map(file =>
            imagekit.upload({
                file: file.buffer.toString("base64"),
                fileName: `${Date.now()}_${file.originalname}`,
                folder: "/apartments"
            })
        );
        const results = await Promise.all(uploadPromises);
        const newImageUrls = results.map(r => r.url);

        await apartmentService.updateApartmentService(apartmentId, newImageUrls);

        res.json({ message: "Cập nhật ảnh thành công" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await apartmentService.deleteApartmentService(Number(req.params.id));
    res.json({ message: "Deleted" });
};