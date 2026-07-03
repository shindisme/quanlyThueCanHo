import { Role } from "@prisma/client";
import { Router } from "express";
import { uploadMultipleImages } from "../controllers/upload.controller.js";
import {
    authenticate,
    authorizeRole,
    requireManagerBuildingAssignment
} from "../middleware/auth.middleware.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { uploadImagesRequestSchema } from "../schemas/upload.schema.js";

const router = Router();

router.post(
    "/upload-multiple",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    requireManagerBuildingAssignment,
    uploadMultiple,
    validate(uploadImagesRequestSchema),
    uploadMultipleImages
);


export default router;
