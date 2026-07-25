import { Role } from "@prisma/client";
import { Router } from "express";
import * as reservationController from "../controllers/reservation.controller.js";
import {
    authenticate,
    authorizeRole
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createReservationRequestSchema,
    listReservationsRequestSchema
} from "../schemas/reservation.schema.js";

const router = Router();
router.get(
    "/",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(listReservationsRequestSchema),
    reservationController.getAll
);

router.post(
    "/",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    validate(createReservationRequestSchema),
    reservationController.create
);

router.post(
    "/expire",
    authenticate,
    authorizeRole([Role.ADMIN, Role.MANAGER]),
    reservationController.expire
);
export default router;
