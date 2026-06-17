import { Router } from "express";
import * as apartmentController from "../controllers/apartment.controller.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/", upload.array("images", 10), apartmentController.create);
router.get("/", apartmentController.getAll);
router.get("/:id", apartmentController.getById);
router.put("/:id", upload.array("images", 10), apartmentController.update);
router.delete("/:id", apartmentController.remove);

export default router;