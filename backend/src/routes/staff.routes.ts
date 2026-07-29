import { Role } from "@prisma/client";
import { Router } from "express";
import * as staffController from "../controllers/staff.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createStaffRequestSchema,
    listStaffRequestSchema,
    staffIdRequestSchema,
    updateStaffRequestSchema
} from "../schemas/staff.schema.js";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.STAFF]),
    validate(listStaffRequestSchema),
    staffController.getAll
);
router.get(
    "/:id",
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.STAFF]),
    validate(staffIdRequestSchema),
    staffController.getById
);
router.post(
    "/",
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(createStaffRequestSchema),
    staffController.create
);
router.put(
    "/:id",
    authorizeRole([Role.ADMIN, Role.MANAGER, Role.STAFF]),
    validate(updateStaffRequestSchema),
    staffController.update
);
router.delete(
    "/:id",
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(staffIdRequestSchema),
    staffController.remove
);

export default router;
