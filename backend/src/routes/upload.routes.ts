import { Router } from "express";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import { uploadMultipleImages } from "../controllers/upload.controller.js";

const router = Router();

router.post("/upload-multiple", uploadMultiple, uploadMultipleImages);


export default router;