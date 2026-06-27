import { Router } from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/book", scheduleController.bookViewing);
router.use(authenticate, authorizeRole(["ADMIN", "MANAGER"]));

router.get("/", scheduleController.getSchedules);
router.put("/:id/confirm", scheduleController.confirmSchedules);
router.put("/:id/cancel", scheduleController.cancelSchedule);
router.delete("/:id", scheduleController.deleteSchedule);

export default router;
