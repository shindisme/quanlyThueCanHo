import { Router } from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
const router = Router();
router.post("/", chatbotController.handleChat);
export default router;
