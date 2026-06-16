import { Router } from "express";
import * as tenantController from "../controllers/tenant.controller.js";

const router = Router();

router.post("/", tenantController.create);
router.get("/", tenantController.getAll);
router.put("/:id", tenantController.update);
router.delete("/:id", tenantController.remove);

export default router;