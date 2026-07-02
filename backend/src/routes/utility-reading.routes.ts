import {
    Role
} from "@prisma/client";
import { Router } from "express";
import * as utilityReadingController from "../controllers/utility-reading.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createUtilityReadingRequestSchema,
    listUtilityReadingsRequestSchema,
    updateUtilityReadingRequestSchema,
    utilityReadingIdRequestSchema
} from "../schemas/utility-reading.schema.js";

const router = Router();
const utilityRoles = [
    Role.ADMIN,
    Role.MANAGER,
    Role.STAFF
];

router.use(authenticate, authorizeRole(utilityRoles));

router.get(
    "/",
    validate(listUtilityReadingsRequestSchema),
    utilityReadingController.getAll
);
router.get(
    "/:id",
    validate(utilityReadingIdRequestSchema),
    utilityReadingController.getById
);
router.post(
    "/",
    validate(createUtilityReadingRequestSchema),
    utilityReadingController.create
);
router.put(
    "/:id",
    validate(updateUtilityReadingRequestSchema),
    utilityReadingController.update
);
router.delete(
    "/:id",
    validate(utilityReadingIdRequestSchema),
    utilityReadingController.remove
);

export default router;
