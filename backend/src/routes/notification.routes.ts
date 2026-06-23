import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), notificationController.getAll);
router.post("/building", authorizeRole(["ADMIN", "MANAGER"]), notificationController.sendToBuilding);
router.post("/invoices", authorizeRole(["ADMIN", "MANAGER"]), notificationController.sendInvoices);
router.patch("/read-all", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), notificationController.markAllRead);
router.patch("/:id/read", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), notificationController.markRead);
router.delete("/:id", authorizeRole(["ADMIN", "MANAGER", "TENANT"]), notificationController.remove);

export default router;
