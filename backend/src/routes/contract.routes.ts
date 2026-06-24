import { Router } from "express";
import { create, end, extend } from "../controllers/contract.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, create);
router.patch("/:id/extend", authenticate, extend);
router.patch("/:id/end", authenticate, authorizeRole(["ADMIN", "MANAGER"]), end);

export default router;
