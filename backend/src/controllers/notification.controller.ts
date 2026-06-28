import { InvoiceStatus } from "@prisma/client";
import { Request, Response } from "express";
import * as notificationService from "../services/notification.service.js";

const getActor = (req: Request): notificationService.NotificationActor | null => {
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

const parseNumberArray = (value: unknown) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const values = Array.isArray(value)
        ? value
        : typeof value === "string"
            ? value.split(",")
            : [value];

    const parsed = values.map((item) => Number(item));
    if (parsed.some((item) => !Number.isInteger(item) || item <= 0)) {
        return Number.NaN;
    }

    return [...new Set(parsed)];
};

const isInvalidNumberArray = (value: number[] | number | undefined): value is number => {
    return typeof value === "number" && Number.isNaN(value);
};

const parseOptionalBoolean = (value: unknown) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return undefined;
};

const isInvoiceStatus = (value: unknown): value is InvoiceStatus => {
    return value === InvoiceStatus.PAID || value === InvoiceStatus.UNPAID;
};

const sendError = (res: Response, error: any) => {
    const statusCode = error?.statusCode || 400;
    res.status(statusCode).json({
        success: false,
        message: error?.message || "Loi xu ly thong bao"
    });
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const isRead = parseOptionalBoolean(req.query.is_read);
        if (req.query.is_read !== undefined && isRead === undefined) {
            res.status(400).json({ success: false, message: "Trang thai doc thong bao khong hop le." });
            return;
        }

        const userId = parseOptionalNumber(req.query.user_id);
        const tenantId = parseOptionalNumber(req.query.tenant_id);
        const buildingId = parseOptionalNumber(req.query.building_id);
        const page = parseOptionalNumber(req.query.page);
        const limit = parseOptionalNumber(req.query.limit);

        if ([userId, tenantId, buildingId, page, limit].some((value) => Number.isNaN(value))) {
            res.status(400).json({ success: false, message: "Tham so loc khong hop le." });
            return;
        }

        const result = await notificationService.getNotificationsService({
            type: req.query.type as string | undefined,
            is_read: isRead,
            user_id: userId,
            tenant_id: tenantId,
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

export const sendToBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const buildingId = parseRequiredNumber(req.body.building_id);
        const apartmentIds = parseNumberArray(req.body.apartment_ids);
        const tenantIds = parseNumberArray(req.body.tenant_ids);

        if (Number.isNaN(buildingId)) {
            res.status(400).json({ success: false, message: "ID toa nha khong hop le." });
            return;
        }

        if (isInvalidNumberArray(apartmentIds) || isInvalidNumberArray(tenantIds)) {
            res.status(400).json({ success: false, message: "Danh sach can ho hoac nguoi thue khong hop le." });
            return;
        }

        const result = await notificationService.sendBuildingNotificationService({
            building_id: buildingId,
            title: req.body.title,
            content: req.body.content,
            type: req.body.type,
            apartment_ids: apartmentIds,
            tenant_ids: tenantIds
        }, actor);

        res.status(201).json({
            success: true,
            message: "Da gui thong bao den nguoi thue trong toa nha.",
            data: result
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const sendInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const buildingId = parseOptionalNumber(req.body.building_id);
        const month = parseOptionalNumber(req.body.month);
        const year = parseOptionalNumber(req.body.year);
        const invoiceIds = parseNumberArray(req.body.invoice_ids);
        const tenantIds = parseNumberArray(req.body.tenant_ids);

        if ([buildingId, month, year].some((value) => Number.isNaN(value))) {
            res.status(400).json({ success: false, message: "Thong tin loc hoa don khong hop le." });
            return;
        }

        if (isInvalidNumberArray(invoiceIds) || isInvalidNumberArray(tenantIds)) {
            res.status(400).json({ success: false, message: "Danh sach hoa don hoac nguoi thue khong hop le." });
            return;
        }

        if (req.body.status !== undefined && !isInvoiceStatus(req.body.status)) {
            res.status(400).json({ success: false, message: "Trang thai hoa don khong hop le." });
            return;
        }

        const result = await notificationService.sendInvoiceNotificationsService({
            building_id: buildingId,
            invoice_ids: invoiceIds,
            tenant_ids: tenantIds,
            month,
            year,
            status: req.body.status,
            title: req.body.title,
            content: req.body.content
        }, actor);

        res.status(201).json({
            success: true,
            message: "Da gui thong bao hoa don den nguoi thue.",
            data: result
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const id = parseRequiredNumber(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ success: false, message: "ID thong bao khong hop le." });
            return;
        }

        const isRead = req.body.is_read === undefined ? true : parseOptionalBoolean(req.body.is_read);
        if (isRead === undefined) {
            res.status(400).json({ success: false, message: "Trang thai doc thong bao khong hop le." });
            return;
        }

        const data = await notificationService.markNotificationReadService(id, actor, isRead);
        res.json({
            success: true,
            message: "Da cap nhat trang thai thong bao.",
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const data = await notificationService.markAllNotificationsReadService(actor);
        res.json({
            success: true,
            message: "Da danh dau tat ca thong bao la da doc.",
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const id = parseRequiredNumber(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ success: false, message: "ID thong bao khong hop le." });
            return;
        }

        await notificationService.deleteNotificationService(id, actor);
        res.json({
            success: true,
            message: "Da xoa thong bao."
        });
    } catch (error: any) {
        sendError(res, error);
    }
};
