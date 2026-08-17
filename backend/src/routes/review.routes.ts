import { Role } from "@prisma/client";
import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createReviewRequestSchema,
    getMyReviewsRequestSchema,
    listApartmentReviewsRequestSchema
} from "../schemas/review.schema.js";

const router = Router();

router.get(
    "/my-reviews",
    authenticate,
    authorizeRole([Role.TENANT]),
    validate(getMyReviewsRequestSchema),
    reviewController.getMyReviews
);

router.get(
    "/apartment/:apartmentId",
    validate(listApartmentReviewsRequestSchema),
    reviewController.getByApartment
);

router.post(
    "/",
    authenticate,
    authorizeRole([Role.TENANT]),
    validate(createReviewRequestSchema),
    reviewController.create
);

export default router;
