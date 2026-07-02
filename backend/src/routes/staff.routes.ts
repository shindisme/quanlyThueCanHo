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
const authorizeStaffManagement = authorizeRole([
    Role.ADMIN,
    Role.MANAGER
]);

router.use(authenticate, authorizeStaffManagement);
router.get(
    "/",
    validate(listStaffRequestSchema),
    staffController.getAll
);
router.get(
    "/:id",
    validate(staffIdRequestSchema),
    staffController.getById
);
router.post(
    "/",
    validate(createStaffRequestSchema),
    staffController.create
);
router.put(
    "/:id",
    validate(updateStaffRequestSchema),
    staffController.update
);
router.delete(
    "/:id",
    validate(staffIdRequestSchema),
    staffController.remove
);

export default router;
