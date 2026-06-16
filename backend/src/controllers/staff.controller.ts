import { Request, Response } from "express";
import * as staffService from "../services/staff.service.js";

export const getAll = async (req: Request, res: Response) => {
    const data = await staffService.getAllStaffService();
    res.json({ success: true, data });
};
export const create = async (req: Request, res: Response) => {
    try {
        const staff = await staffService.createStaffService(req.body);
        res.status(201).json({ success: true, data: staff });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const updated = await staffService.updateStaffService(Number(req.params.id), req.body);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(400).json({ success: false, message: "Lỗi cập nhật nhân viên" });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        await staffService.deleteStaffService(Number(req.params.id));
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ success: false, message: "Lỗi xóa nhân viên" });
    }
};