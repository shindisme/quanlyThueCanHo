import { PaymentStatus } from "@prisma/client";
import { Request, Response } from "express";
import * as paymentService from "../services/payment.service.js";

const getActor = (req: Request): paymentService.PaymentActor | null => {
    const userId = req.user?.id;

    if (!userId || !req.user?.role) {
        return null;
    }

    return {
        userId,
        role: req.user.role
    };
};

const parseOptionalNumber = (value: unknown) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const parseRequiredNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const sendError = (res: Response, error: any) => {
    const statusCode = error?.statusCode || 400;
    res.status(statusCode).json({
        success: false,
        message: error?.message || "Loi xu ly thanh toan"
    });
};

const isPaymentStatus = (value: unknown): value is PaymentStatus => {
    return value === PaymentStatus.SUCCESS || value === PaymentStatus.PENDING || value === PaymentStatus.FAILED;
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const status = req.query.status;
        if (status !== undefined && !isPaymentStatus(status)) {
            res.status(400).json({ success: false, message: "Trang thai thanh toan khong hop le." });
            return;
        }

        const invoiceId = parseOptionalNumber(req.query.invoice_id);
        const tenantId = parseOptionalNumber(req.query.tenant_id);
        const contractId = parseOptionalNumber(req.query.contract_id);
        const buildingId = parseOptionalNumber(req.query.building_id);
        const page = parseOptionalNumber(req.query.page);
        const limit = parseOptionalNumber(req.query.limit);

        if ([invoiceId, tenantId, contractId, buildingId, page, limit].some((value) => Number.isNaN(value))) {
            res.status(400).json({ success: false, message: "Tham so loc khong hop le." });
            return;
        }

        const result = await paymentService.getPaymentsService({
            status,
            payment_method: req.query.payment_method as string | undefined,
            invoice_id: invoiceId,
            tenant_id: tenantId,
            contract_id: contractId,
            building_id: buildingId,
            search: req.query.search as string | undefined,
            page,
            limit
        }, actor);

        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const getMethods = async (req: Request, res: Response): Promise<void> => {
    res.json({
        success: true,
        data: [
            { value: paymentService.PAYMENT_METHODS.CASH, label: "Tien mat" },
            { value: paymentService.PAYMENT_METHODS.BANK_TRANSFER, label: "Chuyen khoan ngan hang" },
            { value: paymentService.PAYMENT_METHODS.E_WALLET, label: "Vi dien tu" }
        ]
    });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const id = parseRequiredNumber(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ success: false, message: "ID thanh toan khong hop le." });
            return;
        }

        const data = await paymentService.getPaymentByIdService(id, actor);
        res.json({
            success: true,
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const invoiceId = parseRequiredNumber(req.body.invoice_id);
        const amount = parseOptionalNumber(req.body.amount);

        if (Number.isNaN(invoiceId)) {
            res.status(400).json({ success: false, message: "ID hoa don khong hop le." });
            return;
        }

        if (Number.isNaN(amount)) {
            res.status(400).json({ success: false, message: "So tien thanh toan khong hop le." });
            return;
        }

        const status = req.body.status;
        if (status !== undefined && !isPaymentStatus(status)) {
            res.status(400).json({ success: false, message: "Trang thai thanh toan khong hop le." });
            return;
        }

        const data = await paymentService.createPaymentService({
            invoice_id: invoiceId,
            payment_method: req.body.payment_method,
            transaction_code: req.body.transaction_code,
            amount,
            status
        }, actor);

        res.status(201).json({
            success: true,
            message: "Da ghi nhan giao dich thanh toan.",
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const id = parseRequiredNumber(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ success: false, message: "ID thanh toan khong hop le." });
            return;
        }

        if (!isPaymentStatus(req.body.status)) {
            res.status(400).json({ success: false, message: "Trang thai thanh toan khong hop le." });
            return;
        }

        const data = await paymentService.updatePaymentStatusService(id, req.body.status, actor);
        res.json({
            success: true,
            message: "Da cap nhat trang thai thanh toan.",
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};
