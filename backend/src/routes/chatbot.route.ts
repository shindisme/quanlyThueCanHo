import { Router } from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", chatbotController.handleChat);

export default router;