import { Router } from "express";
import { create, end, extend, getAll, getById } from "../controllers/contract.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, authorizeRole(["ADMIN", "MANAGER", "TENANT"]), getAll);
router.post("/", authenticate, create);
router.patch("/:id/extend", authenticate, extend);
router.patch("/:id/end", authenticate, authorizeRole(["ADMIN", "MANAGER"]), end);
router.get("/:id", authenticate, authorizeRole(["ADMIN", "MANAGER", "TENANT"]), getById);

export default router;
