import { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service.js";

export const bookViewing = async (request: Request, response: Response) => {
    try {
        const schedule = await scheduleService.bookViewingService(request.body);
        response.status(201).json({ message: "Đặt lịch thành công", schedule });
    } catch (error: any) {
        response.status(400).json({ error: error.message });
    }
};

export const getSchedules = async (request: Request, response: Response) => {
    const { date, guestName } = request.query;
    const schedules = await scheduleService.getSchedulesAdminService(date as string, guestName as string);
    response.json(schedules);
};

export const confirmSchedules = async (request: Request, response: Response) => {
    try {
        const id = Number(request.params.id);
        if (isNaN(id)) return response.status(400).json({ error: "ID không hợp lệ" });

        await scheduleService.confirmScheduleService(id);

        response.json({ success: true, message: "Xác nhận đặt lịch thành công" });
    } catch (error: any) {
        const errorMessage = error.message || "Lỗi hệ thống";
        response.status(400).json({ success: false, error: errorMessage });
    }
};

export const deleteSchedule = async (request: Request, response: Response) => {
    try {
        await scheduleService.deleteScheduleService(Number(request.params.id));
        response.json({ message: "Đã xóa lịch hẹn thành công" });
    } catch (error: any) {
        response.status(500).json({ error: error.message });
    }
};

export const cancelSchedule = async (request: Request, response: Response) => {
    try {
        await scheduleService.cancelScheduleService(Number(request.params.id));
        response.json({ message: "Đã hủy lịch hẹn thành công" });
    } catch (error: any) {
        response.status(400).json({ error: error.message });
    }
};