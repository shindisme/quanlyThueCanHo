import { Router } from "express";
import * as apartmentController from "../controllers/apartment.controller.js";

const router = Router();

router.post("/", apartmentController.create);
router.get("/", apartmentController.getAll);
router.get("/:id", apartmentController.getById);
router.put("/:id", apartmentController.update);
router.delete("/:id", apartmentController.remove);

export default router;