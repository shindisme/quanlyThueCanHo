import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), paymentController.getAll);
router.post("/", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), paymentController.create);
router.get("/methods", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), paymentController.getMethods);
router.get("/:id", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), paymentController.getById);
router.patch("/:id/status", authorizeRole(["ADMIN", "MANAGER"]), paymentController.updateStatus);

export default router;
