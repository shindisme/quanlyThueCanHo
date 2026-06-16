import * as scheduleService from "../services/schedule.service.js";
export const bookViewing = async (request, response) => {
    try {
        const schedule = await scheduleService.bookViewingService(request.body);
        response.status(201).json({ message: "Đặt lịch thành công", schedule });
    }
    catch (error) {
        response.status(400).json({ error: error.message });
    }
};
export const getSchedules = async (request, response) => {
    const { date, guestName } = request.query;
    const schedules = await scheduleService.getSchedulesAdminService(date, guestName);
    response.json(schedules);
};
export const confirmSchedules = async (request, response) => {
    try {
        const id = Number(request.params.id);
        const { status } = request.body;
        await scheduleService.confirmScheduleService(id);
        response.json({ message: "Xác nhận đặt lịch thành công" });
    }
    catch (error) {
        response.status(400).json({ error: error.message });
    }
};
export const deleteSchedule = async (request, response) => {
    try {
        await scheduleService.deleteScheduleService(Number(request.params.id));
        response.json({ message: "Đã xóa lịch hẹn thành công" });
    }
    catch (error) {
        response.status(500).json({ error: error.message });
    }
};
export const cancelSchedule = async (request, response) => {
    try {
        await scheduleService.cancelScheduleService(Number(request.params.id));
        response.json({ message: "Đã hủy lịch hẹn thành công" });
    }
    catch (error) {
        response.status(400).json({ error: error.message });
    }
};
