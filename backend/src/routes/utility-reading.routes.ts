import { Router } from "express";
import * as utilityReadingController from "../controllers/utility-reading.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole(["ADMIN", "MANAGER", "STAFF"]), utilityReadingController.create);
router.get("/", authorizeRole(["ADMIN", "MANAGER"]), utilityReadingController.getAll);
router.get("/:id", authorizeRole(["ADMIN", "MANAGER", "STAFF"]), utilityReadingController.getById);
router.put("/:id", authorizeRole(["ADMIN", "MANAGER"]), utilityReadingController.update);
router.delete("/:id", authorizeRole(["ADMIN", "MANAGER"]), utilityReadingController.remove);

export default router;
