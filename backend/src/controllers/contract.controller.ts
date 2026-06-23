import { Request, Response } from "express";
import * as contractService from "../services/contract.service.js";

export const create = async (req: Request, res: Response) => {
    try {
        const contract = await contractService.createContractService(req.body);
        res.status(201).json({
            success: true,
            message: "Hợp đồng đã được tạo thành công",
            data: contract
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Lỗi khi tạo hợp đồng"
        });
    }
};

export const extend = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { new_end_date } = req.body;

        if (!new_end_date) {
            return res.status(400).json({ success: false, message: "Thiếu ngày kết thúc mới" });
        }

        const updatedContract = await contractService.extendContractService(Number(id), new_end_date);
        res.json({
            success: true,
            message: "Hợp đồng đã được gia hạn thành công",
            data: {
                id: updatedContract.id,
                old_end_date: "...",
                new_end_date: updatedContract.end_date,
                extended_at: updatedContract.extended_at
            }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Lỗi khi gia hạn hợp đồng"
        });
    }
};
