import { Router } from "express";
import * as utilityReadingController from "../controllers/utility-reading.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRole(["ADMIN", "MANAGER", "STAFF", "TENANT"]), utilityReadingController.getAll);
router.get("/:id", authorizeRole(["ADMIN", "MANAGER", "STAFF", "TENANT"]), utilityReadingController.getById);
router.post("/", authorizeRole(["MANAGER", "STAFF"]), utilityReadingController.create);
router.put("/:id", authorizeRole(["MANAGER", "STAFF"]), utilityReadingController.update);
router.delete("/:id", authorizeRole(["MANAGER", "STAFF"]), utilityReadingController.remove);

export default router;
