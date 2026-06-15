import { Request, Response } from "express";
import * as buildingService from "../services/building.service.js";

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const { address_old, address_new, description, status, total_floors, branch_name } = req.body;

        if (!address_old || !address_new || !total_floors || !branch_name) {
            res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
            return;
        }

        const data = await buildingService.createBuildingService({
            address_old,
            address_new,
            description,
            status: status ? status : "ACTIVE",
            total_floors: Number(total_floors),
            branch_name
        });

        res.status(201).json({
            ...data,
            name: data.branch_name
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const { search, branch_name, page, limit } = req.query;

    const result = await buildingService.getAllBuildingsService({
        search: search as string,
        branch_name: branch_name as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
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
    const { name, ...updateData } = req.body;
    const data = await buildingService.updateBuildingService(Number(req.params.id), updateData);
    res.json({
        ...data,
        name: data.branch_name
    });
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await buildingService.deleteBuildingService(Number(req.params.id));
    res.json({ message: "Deleted" });
};