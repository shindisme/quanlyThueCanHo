import { Role } from "@prisma/client";
import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    cancelMaintenanceRequestSchema,
    completeMaintenanceRequestSchema,
    confirmMaintenanceRequestSchema,
    createMaintenanceRequestSchema,
    listMaintenanceRequestSchema,
    maintenanceIdRequestSchema,
    unableMaintenanceRequestSchema
} from "../schemas/maintenance.schema.js";

const router = Router();
const readRoles = [
    Role.ADMIN,
    Role.MANAGER,
    Role.STAFF,
    Role.TENANT
];

router.get(
    "/",
    authenticate,
    authorizeRole(readRoles),
    validate(listMaintenanceRequestSchema),
    maintenanceController.getAll
);
router.post(
    "/",
    authenticate,
    authorizeRole([Role.TENANT]),
    validate(createMaintenanceRequestSchema),
    maintenanceController.create
);
router.put(
    "/:id/cancel",
    authenticate,
    authorizeRole([Role.TENANT]),
    validate(cancelMaintenanceRequestSchema),
    maintenanceController.cancel
);
router.put(
    "/:id/confirm",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(confirmMaintenanceRequestSchema),
    maintenanceController.confirm
);
router.put(
    "/:id/unable",
    authenticate,
    authorizeRole([Role.STAFF]),
    validate(unableMaintenanceRequestSchema),
    maintenanceController.unable
);
router.put(
    "/:id/complete",
    authenticate,
    authorizeRole([Role.STAFF]),
    validate(completeMaintenanceRequestSchema),
    maintenanceController.complete
);
router.get(
    "/:id",
    authenticate,
    authorizeRole(readRoles),
    validate(maintenanceIdRequestSchema),
    maintenanceController.getById
);

export default router;
