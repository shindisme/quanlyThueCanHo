import {
    Role
} from "@prisma/client";
import { Router } from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    bookViewingRequestSchema,
    confirmScheduleRequestSchema,
    cancelScheduleRequestSchema,
    listSchedulesRequestSchema,
    scheduleIdRequestSchema,
    viewingAvailabilityRequestSchema
} from "../schemas/schedule.schema.js";

const router = Router();
const manageRoles = [
    Role.ADMIN,
    Role.MANAGER
];

router.post(
    "/book",
    validate(bookViewingRequestSchema),
    scheduleController.bookViewing
);
router.get(
    "/availability",
    validate(viewingAvailabilityRequestSchema),
    scheduleController.getAvailability
);
router.get(
    "/",
    authenticate,
    authorizeRole(manageRoles),
    validate(listSchedulesRequestSchema),
    scheduleController.getSchedules
);
router.put(
    "/:id/confirm",
    authenticate,
    authorizeRole(manageRoles),
    validate(confirmScheduleRequestSchema),
    scheduleController.confirmSchedules
);
router.put(
    "/:id/cancel",
    authenticate,
    authorizeRole(manageRoles),
    validate(cancelScheduleRequestSchema),
    scheduleController.cancelSchedule
);
router.put(
    "/:id/attended",
    authenticate,
    authorizeRole(manageRoles),
    validate(scheduleIdRequestSchema),
    scheduleController.markAttended
);
router.put(
    "/:id/absent",
    authenticate,
    authorizeRole(manageRoles),
    validate(scheduleIdRequestSchema),
    scheduleController.markAbsent
);
router.delete(
    "/:id",
    authenticate,
    authorizeRole(manageRoles),
    validate(scheduleIdRequestSchema),
    scheduleController.deleteSchedule
);

export default router;
