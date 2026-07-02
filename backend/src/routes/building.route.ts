import { Router } from "express";
import { Role } from "@prisma/client";
import { getAll, getById, create, update, remove } from "../controllers/building.controller.js";
import {
    authenticate,
    authorizeRole,
    requireManagerBuildingAssignment
} from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    buildingIdRequestSchema,
    createBuildingRequestSchema,
    listBuildingsRequestSchema,
    updateBuildingRequestSchema
} from "../schemas/building.schema.js";

const router = Router();

router.get("/", validate(listBuildingsRequestSchema), getAll);
router.get("/:id", validate(buildingIdRequestSchema), getById);
router.post(
    "/",
    authenticate,
    authorizeRole([Role.ADMIN]),
    requireManagerBuildingAssignment,
    upload.single("image"),
    validate(createBuildingRequestSchema),
    create
);
router.put(
    "/:id",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    requireManagerBuildingAssignment,
    upload.single("image"),
    validate(updateBuildingRequestSchema),
    update
);
router.delete(
    "/:id",
    authenticate,
    authorizeRole([Role.ADMIN]),
    validate(buildingIdRequestSchema),
    remove
);

export default router;
