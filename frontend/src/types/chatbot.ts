import type { SenderType } from "../constants/enums";

export interface ChatSession {
  id: number;
  user_id: number | null;
  created_at: string;
  messages?: ChatbotMessage[];
}

export interface ChatbotMessage {
  id: number;
  conversation_id: number;
  message: string;
  sender_type: SenderType;
  created_at: string;
}
