import { Request, Response } from "express";
import * as tenantService from "../services/tenant.service.js";

export const create = async (req: Request, res: Response) => {
    try {
        const { id, ...tenantData } = req.body;
        const tenant = await tenantService.createTenant(tenantData);
        res.status(201).json({ success: true, data: tenant });
    } catch (error: any) {
        const message = error.message.includes("Unique constraint") 
            ? "Số điện thoại hoặc CCCD đã tồn tại." 
            : error.message;
            
        res.status(400).json({ success: false, message });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        await tenantService.deleteTenant(Number(req.params.id));
        res.status(200).json({ success: true, message: "Đã xóa người thuê thành công" });
    } catch (error) {
        res.status(400).json({ success: false, message: "Lỗi xóa người thuê (có thể do ràng buộc dữ liệu)" });
    }
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const data = await tenantService.getTenants(page);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách" });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const updated = await tenantService.updateTenant(Number(req.params.id), req.body);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: "Lỗi cập nhật người thuê" });
    }
};