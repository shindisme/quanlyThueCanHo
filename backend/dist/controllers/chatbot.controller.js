import * as aiService from "../services/ai.service.js";
export const handleChat = async (req, res) => {
    try {
        const message = req.body?.message?.trim();
        if (!message) {
            res.status(400).json({
                error: "Nội dung tin nhắn không được để trống.",
            });
            return;
        }
        const result = await aiService.processCustomerMessage(message);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({
            reply: "Xin lỗi, hệ thống tư vấn đang bận. Vui lòng thử lại sau.",
        });
    }
};
