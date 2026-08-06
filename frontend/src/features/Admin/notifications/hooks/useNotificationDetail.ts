import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Notification } from "../../../../types";

interface UseNotificationDetailProps {
  notifications: Notification[];
  markRead: (id: number, isRead: boolean) => void;
}

export function useNotificationDetail({ notifications, markRead }: UseNotificationDetailProps) {
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const openModal = useCallback((notif: Notification) => {
    setSelectedNotif(notif);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedNotif(null);
  }, []);

  useEffect(() => {
    const stateNotifId = location.state?.selectedNotifId;
    if (stateNotifId && notifications.length > 0) {
      const found = notifications.find((n) => n.id === stateNotifId);
      if (found) {
        setSelectedNotif(found);
        navigate(".", { replace: true, state: null });
      }
    }
  }, [location.state, notifications, navigate]);

  // Mark as read immutably without mutating props or state directly
  useEffect(() => {
    if (selectedNotif && !selectedNotif.is_read) {
      markRead(selectedNotif.id, true);
      setSelectedNotif((prev) => (prev ? { ...prev, is_read: true } : null));
    }
  }, [selectedNotif, markRead]);

  return {
    isOpen: Boolean(selectedNotif),
    selectedNotif,
    openModal,
    closeModal,
  };
}
