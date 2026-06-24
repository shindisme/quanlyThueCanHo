import { Request, Response } from "express";
import * as buildingService from "../services/building.service.js";
import { imagekit } from "@/config/imagekit.js";

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const { address_old, address_new, description, status, total_floors, branch_name, staff_id } = req.body;

        if (!address_old || !address_new || !total_floors || !branch_name) {
            res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
            return;
        }

        let imageUrl = "";
        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer.toString("base64"),
                fileName: `${Date.now()}_${req.file.originalname}`,
                folder: "/buildings"
            });
            imageUrl = uploadResponse.url;
        }

        const data = await buildingService.createBuildingService({
            address_old,
            address_new,
            description,
            status: status ? status : "ACTIVE",
            total_floors: Number(total_floors),
            branch_name,
            assigned_staff: staff_id ? { connect: { id: Number(staff_id) } } : undefined
        }, imageUrl);

        res.status(201).json({
            ...data,
            name: data.branch_name
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const { search, branch_name, page, limit, staff } = req.query;

    const result = await buildingService.getAllBuildingsService({
        search: search as string,
        branch_name: branch_name as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        staffId: staff ? Number(staff) : undefined
    });

    res.json({
        ...result,
        data: result.data.map(b => ({
            ...b,
            name: b.branch_name
        }))
    });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    const data = await buildingService.getBuildingByIdService(Number(req.params.id));
    if (data) {
        res.json({
            ...data,
            name: data.branch_name
        });
    } else {
        res.status(404).json({ message: "Not found" });
    }
};

export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const buildingId = Number(req.params.id);
        const { name, staff_id, ...updateData } = req.body;

        const oldBuilding = await buildingService.getBuildingByIdService(buildingId);
        let newImageUrl = oldBuilding?.thumbnail_url;

        if (req.file) {
            if (oldBuilding?.thumbnail_url) {
                const oldFilePath = oldBuilding.thumbnail_url.split(".io/").pop()?.split("/").slice(1).join("/");
                if (oldFilePath) {
                    await imagekit.deleteFile(oldFilePath).catch(err => console.log("Lỗi xóa ảnh cũ:", err));
                }
            }

            const uploadResponse = await imagekit.upload({
                file: req.file.buffer.toString("base64"),
                fileName: `${Date.now()}_${req.file.originalname}`,
                folder: "/buildings"
            });
            newImageUrl = uploadResponse.url;
        }

        const prismaUpdateData: any = {
            ...updateData,
            thumbnail_url: newImageUrl
        };

        if (staff_id !== undefined) {
            prismaUpdateData.assigned_staff = staff_id
                ? { connect: { id: Number(staff_id) } }
                : { disconnect: true };
        }

        const data = await buildingService.updateBuildingService(buildingId, prismaUpdateData);

        res.json({
            ...data,
            name: data.branch_name
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await buildingService.deleteBuildingService(Number(req.params.id));
    res.json({ message: "Deleted" });
};