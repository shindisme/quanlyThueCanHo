import { Request, Response } from "express";
import * as buildingService from "../services/building.service.js";

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, address, description, status, totalFloors, branchName } = req.body;
        if (!name || !address || !totalFloors || !branchName) {
            res.status(400).json({ message: "Vui lòng nhập đủ các trường!" });
            return;
        }
        const data = await buildingService.createBuildingService({
            name, address, description,
            status: status ? Number(status) : 1,
            totalFloors: Number(totalFloors),
            branchName
        });
        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const { search, branchName, page, limit } = req.query;
    const result = await buildingService.getAllBuildingsService({
        search: search as string,
        branchName: branchName as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
    });
    res.json(result);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    const data = await buildingService.getBuildingByIdService(Number(req.params.id));
    data ? res.json(data) : res.status(404).json({ message: "Not found" });
};

export const update = async (req: Request, res: Response): Promise<void> => {
    const data = await buildingService.updateBuildingService(Number(req.params.id), req.body);
    res.json(data);
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await buildingService.deleteBuildingService(Number(req.params.id));
    res.json({ message: "Deleted" });
};