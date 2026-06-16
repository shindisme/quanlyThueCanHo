import { Router } from "express";
import { create, extend } from "../controllers/contract.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, create);
router.patch("/:id/extend", authenticate, extend);

export default router;