import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), invoiceController.getAll);
router.post("/generate-monthly", authorizeRole(["ADMIN", "MANAGER"]), invoiceController.generateMonthly);
router.get("/:id", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), invoiceController.getById);
router.patch("/:id/status", authorizeRole(["ADMIN", "MANAGER"]), invoiceController.updateStatus);

export default router;
