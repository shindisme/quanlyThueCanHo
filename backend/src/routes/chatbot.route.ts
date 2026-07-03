import { Router } from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { chatbotRequestSchema } from "../schemas/chatbot.schema.js";

const router = Router();

router.post(
    "/",
    validate(chatbotRequestSchema),
    chatbotController.handleChat
);

export default router;
