import { InvoiceStatus } from "@prisma/client";
import { Request, Response } from "express";
import * as invoiceService from "../services/invoice.service.js";

const getActor = (req: Request): invoiceService.InvoiceActor | null => {
    if (!req.actor) {
        return null;
    }

    return {
        userId: req.actor.userId,
        role: req.actor.role
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
        message: error?.message || "Loi xu ly hoa don"
    });
};

const isInvoiceStatus = (value: unknown): value is InvoiceStatus => {
    return value === InvoiceStatus.PAID || value === InvoiceStatus.UNPAID;
};

const parseMonthlyInput = (body: Record<string, unknown>): invoiceService.MonthlyInvoiceInput => {
    const numericFields = [
        "month",
        "year",
        "building_id",
        "management_fee",
        "management_fee_per_m2",
        "electric_unit_price",
        "water_unit_price",
        "internet_fee"
    ] as const;

    const input: invoiceService.MonthlyInvoiceInput = {};

    for (const field of numericFields) {
        const parsed = parseOptionalNumber(body[field]);
        if (Number.isNaN(parsed)) {
            throw new invoiceService.InvoiceError("Du lieu so khong hop le.");
        }

        if (parsed !== undefined) {
            input[field] = parsed;
        }
    }

    if (typeof body.due_date === "string" && body.due_date.trim()) {
        input.due_date = body.due_date;
    }

    if (body.notify !== undefined) {
        input.notify = Boolean(body.notify);
    }

    return input;
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const status = req.query.status;
        if (status !== undefined && !isInvoiceStatus(status)) {
            res.status(400).json({ success: false, message: "Trang thai hoa don khong hop le." });
            return;
        }

        const tenantId = parseOptionalNumber(req.query.tenant_id);
        const contractId = parseOptionalNumber(req.query.contract_id);
        const apartmentId = parseOptionalNumber(req.query.apartment_id);
        const buildingId = parseOptionalNumber(req.query.building_id);
        const month = parseOptionalNumber(req.query.month);
        const year = parseOptionalNumber(req.query.year);
        const page = parseOptionalNumber(req.query.page);
        const limit = parseOptionalNumber(req.query.limit);

        if ([tenantId, contractId, apartmentId, buildingId, month, year, page, limit].some((value) => Number.isNaN(value))) {
            res.status(400).json({ success: false, message: "Tham so loc khong hop le." });
            return;
        }

        const result = await invoiceService.getInvoicesService({
            status,
            tenant_id: tenantId,
            contract_id: contractId,
            apartment_id: apartmentId,
            building_id: buildingId,
            month,
            year,
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

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const id = parseRequiredNumber(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ success: false, message: "ID hoa don khong hop le." });
            return;
        }

        const data = await invoiceService.getInvoiceByIdService(id, actor);
        res.json({ success: true, data });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const generateMonthly = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const result = await invoiceService.generateMonthlyInvoicesService(
            parseMonthlyInput(req.body ?? {}),
            actor
        );

        res.status(201).json({
            success: true,
            message: "Da tao hoa don thang.",
            data: result
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
            res.status(400).json({ success: false, message: "ID hoa don khong hop le." });
            return;
        }

        if (!isInvoiceStatus(req.body.status)) {
            res.status(400).json({ success: false, message: "Trang thai hoa don khong hop le." });
            return;
        }

        const data = await invoiceService.updateInvoiceStatusService(id, req.body.status, actor);
        res.json({
            success: true,
            message: "Da cap nhat trang thai hoa don.",
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};
