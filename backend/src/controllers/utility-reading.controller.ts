import { Request, Response } from "express";
import * as utilityReadingService from "../services/utility-reading.service.js";

const getActor = (req: Request): utilityReadingService.UtilityReadingActor | null => {
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
        message: error?.message || "Loi xu ly ban ghi dien nuoc"
    });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const apartmentId = parseRequiredNumber(req.body.apartment_id);
        const month = parseRequiredNumber(req.body.month);
        const year = parseRequiredNumber(req.body.year);
        const electricNew = parseRequiredNumber(req.body.electric_new);
        const waterNew = parseRequiredNumber(req.body.water_new);

        if ([apartmentId, month, year, electricNew, waterNew].some(Number.isNaN)) {
            res.status(400).json({
                success: false,
                message: "Vui long nhap day du apartment_id, month, year, electric_new va water_new."
            });
            return;
        }

        const electricOld = parseOptionalNumber(req.body.electric_old);
        const waterOld = parseOptionalNumber(req.body.water_old);
        const recordedBy = parseOptionalNumber(req.body.recorded_by);

        if ([electricOld, waterOld, recordedBy].some((value) => Number.isNaN(value))) {
            res.status(400).json({ success: false, message: "Du lieu so khong hop le." });
            return;
        }

        const data = await utilityReadingService.createUtilityReadingService({
            apartment_id: apartmentId,
            month,
            year,
            electric_new: electricNew,
            water_new: waterNew,
            electric_old: electricOld,
            water_old: waterOld,
            recorded_by: recordedBy
        }, actor);

        res.status(201).json({
            success: true,
            message: "Da ghi chi so dien nuoc thanh cong.",
            data
        });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const apartmentId = parseOptionalNumber(req.query.apartment_id);
        const buildingId = parseOptionalNumber(req.query.building_id);
        const month = parseOptionalNumber(req.query.month);
        const year = parseOptionalNumber(req.query.year);
        const recordedBy = parseOptionalNumber(req.query.recorded_by);
        const page = parseOptionalNumber(req.query.page);
        const limit = parseOptionalNumber(req.query.limit);

        if ([apartmentId, buildingId, month, year, recordedBy, page, limit].some((value) => Number.isNaN(value))) {
            res.status(400).json({ success: false, message: "Tham so loc khong hop le." });
            return;
        }

        const result = await utilityReadingService.getUtilityReadingsService({
            apartment_id: apartmentId,
            building_id: buildingId,
            month,
            year,
            recorded_by: recordedBy,
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
            res.status(400).json({ success: false, message: "ID ban ghi khong hop le." });
            return;
        }

        const data = await utilityReadingService.getUtilityReadingByIdService(id, actor);
        res.json({ success: true, data });
    } catch (error: any) {
        sendError(res, error);
    }
};

export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const actor = getActor(req);
        if (!actor) {
            res.status(401).json({ success: false, message: "Vui long dang nhap." });
            return;
        }

        const id = parseRequiredNumber(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ success: false, message: "ID ban ghi khong hop le." });
            return;
        }

        const payload: utilityReadingService.UpdateUtilityReadingInput = {};
        const fields = [
            "apartment_id",
            "month",
            "year",
            "electric_old",
            "electric_new",
            "water_old",
            "water_new",
            "recorded_by"
        ] as const;

        for (const field of fields) {
            const parsed = parseOptionalNumber(req.body[field]);
            if (Number.isNaN(parsed)) {
                res.status(400).json({ success: false, message: "Du lieu so khong hop le." });
                return;
            }

            if (parsed !== undefined) {
                payload[field] = parsed;
            }
        }

        const data = await utilityReadingService.updateUtilityReadingService(id, payload, actor);
        res.json({
            success: true,
            message: "Da cap nhat ban ghi dien nuoc.",
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
            res.status(400).json({ success: false, message: "ID ban ghi khong hop le." });
            return;
        }

        await utilityReadingService.deleteUtilityReadingService(id, actor);
        res.json({
            success: true,
            message: "Da xoa ban ghi dien nuoc."
        });
    } catch (error: any) {
        sendError(res, error);
    }
};
