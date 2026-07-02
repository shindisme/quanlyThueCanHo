import type { NotificationType } from "../constants/enums";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}
