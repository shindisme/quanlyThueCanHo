import { Request, Response } from "express";
import * as contractService from "../services/contract.service.js";

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== "";

const getActor = (req: Request): contractService.ContractActor | null => {
    const userId = req.user?.id;

    if (!userId || !req.user?.role) {
        return null;
    }

    return {
        userId,
        role: req.user.role
    };
};

const sendError = (res: Response, error: any, fallbackMessage: string) => {
    const statusCode = error?.statusCode || 400;
    res.status(statusCode).json({
        success: false,
        message: error?.message || fallbackMessage
    });
};

export const create = async (req: Request, res: Response) => {
    try {
        const requiredFields = [
            "apartment_id",
            "tenant_id",
            "start_date",
            "end_date",
            "deposit_amount",
            "monthly_rent",
            "signed_at"
        ];
        const missingFields = requiredFields.filter((field) => !hasValue(req.body[field]));

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Thiếu dữ liệu bắt buộc: ${missingFields.join(", ")}`
            });
        }

        const contract = await contractService.createContractService(req.body);
        res.status(201).json({
            success: true,
            message: "Hợp đồng đã được tạo thành công",
            data: contract
        });
    } catch (error: any) {
        sendError(res, error, "Lỗi khi tạo hợp đồng");
    }
};

export const extend = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { new_end_date } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: "Mã hợp đồng không hợp lệ" });
        }

        if (!hasValue(new_end_date)) {
            return res.status(400).json({ success: false, message: "Thiếu ngày kết thúc mới" });
        }

        const result = await contractService.extendContractService(id, new_end_date);
        res.json({
            success: true,
            message: "Hợp đồng đã được gia hạn thành công",
            data: {
                id: result.contract.id,
                old_end_date: result.old_end_date,
                new_end_date: result.contract.end_date,
                extended_at: result.contract.extended_at
            }
        });
    } catch (error: any) {
        sendError(res, error, "Lỗi khi gia hạn hợp đồng");
    }
};

export const end = async (req: Request, res: Response) => {
    try {
        const actor = getActor(req);
        if (!actor) {
            return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
        }

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: "Mã hợp đồng không hợp lệ" });
        }

        const result = await contractService.endContractService(id, actor, req.body?.end_date);
        res.json({
            success: true,
            message: "Hợp đồng đã được kết thúc thành công",
            data: {
                id: result.contract.id,
                old_status: result.old_status,
                new_status: result.new_status,
                end_date: result.contract.end_date,
                ended_at: result.ended_at,
                apartment_status: result.apartment_status,
                contract: result.contract
            }
        });
    } catch (error: any) {
        sendError(res, error, "Lỗi khi kết thúc hợp đồng");
    }
};
