import { Router } from "express";
import { uploadMultiple } from "../middleware/upload.js";
import { uploadMultipleImages } from "../controllers/image.controller.js";

const router = Router();

router.post("/upload-multiple", uploadMultiple, uploadMultipleImages);


export default router;