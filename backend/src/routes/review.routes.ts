import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js"; 

const router = Router();

router.get("/apartment/:apartmentId", reviewController.getByApartment);

router.post("/", authenticate, authorizeRole(["TENANT"]), reviewController.create);

export default router;