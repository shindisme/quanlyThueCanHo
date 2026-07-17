import {
    Role
} from "@prisma/client";
import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    listNotificationsRequestSchema,
    markAllNotificationsReadRequestSchema,
    markNotificationReadRequestSchema,
    notificationIdRequestSchema,
    sendBuildingNotificationRequestSchema,
    sendInvoiceNotificationsRequestSchema
} from "../schemas/notification.schema.js";

const router = Router();
const readRoles = [
    Role.ADMIN,
    Role.MANAGER,
    Role.STAFF,
    Role.TENANT
];
const manageRoles = [
    Role.ADMIN,
    Role.MANAGER
];

router.get(
    "/",
    authenticate,
    authorizeRole(readRoles),
    validate(listNotificationsRequestSchema),
    notificationController.getAll
);
router.post(
    "/building",
    authenticate,
    authorizeRole(manageRoles),
    validate(sendBuildingNotificationRequestSchema),
    notificationController.sendToBuilding
);
router.post(
    "/invoices",
    authenticate,
    authorizeRole(manageRoles),
    validate(sendInvoiceNotificationsRequestSchema),
    notificationController.sendInvoices
);
router.patch(
    "/read-all",
    authenticate,
    authorizeRole(readRoles),
    validate(markAllNotificationsReadRequestSchema),
    notificationController.markAllRead
);
router.patch(
    "/:id/read",
    authenticate,
    authorizeRole(readRoles),
    validate(markNotificationReadRequestSchema),
    notificationController.markRead
);
router.delete(
    "/:id",
    authenticate,
    authorizeRole(readRoles),
    validate(notificationIdRequestSchema),
    notificationController.remove
);

export default router;
