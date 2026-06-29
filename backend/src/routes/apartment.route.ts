import { Router } from "express";
import { Role } from "@prisma/client";
import * as apartmentController from "../controllers/apartment.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    apartmentIdRequestSchema,
    createApartmentRequestSchema,
    listApartmentsRequestSchema,
    updateApartmentRequestSchema
} from "../schemas/apartment.schema.js";

const router = Router();

router.get(
    "/",
    validate(listApartmentsRequestSchema),
    apartmentController.getAll
);
router.get(
    "/:id",
    validate(apartmentIdRequestSchema),
    apartmentController.getById
);
router.post(
    "/",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    upload.array("images", 10),
    validate(createApartmentRequestSchema),
    apartmentController.create
);
router.put(
    "/:id",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    upload.array("images", 10),
    validate(updateApartmentRequestSchema),
    apartmentController.update
);
router.delete(
    "/:id",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(apartmentIdRequestSchema),
    apartmentController.remove
);

export default router;
