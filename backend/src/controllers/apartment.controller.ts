import { Request, Response } from "express";
import * as apartmentService from "../services/apartment.service.js";

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await apartmentService.createApartmentService(req.body);
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

export const update = async (req: Request, res: Response): Promise<void> => {
    const data = await apartmentService.updateApartmentService(Number(req.params.id), req.body);
    res.json(data);
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await apartmentService.deleteApartmentService(Number(req.params.id));
    res.json({ message: "Deleted" });
};