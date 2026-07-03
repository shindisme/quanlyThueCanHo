import type {
    Request,
    Response
} from "express";
import { getValidated } from "../middleware/validate.middleware.js";
import type { ChatbotRequest } from "../schemas/chatbot.schema.js";
import * as aiService from "../services/chatbot.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const handleChat = async (
    request: Request,
    response: Response
) => {
    const { body } = getValidated<ChatbotRequest>(request);
    const result = await aiService.processCustomerMessage(
        body.message
    );

    return sendSuccess(response, result);
};
