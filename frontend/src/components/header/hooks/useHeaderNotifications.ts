import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../stores/auth.store";
import { queryKeys } from "../../../constants/queryKeys";
import * as notificationService from "../../../services/notificationService";
import type { Notification } from "../../../types/notification";

export interface HeaderNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAllRead: () => void;
  markRead: (id: number) => void;
}

export function useHeaderNotifications(): HeaderNotificationsResult {
  const { token, role } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifData, isLoading } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationService.getAllNotifications({ limit: 5 }),
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    enabled: !!token && !!role,
  });

  const notifications = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  };

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllNotificationsRead(),
    onSuccess: invalidateNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markNotificationRead(id),
    onSuccess: invalidateNotifications,
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllRead: () => markAllReadMutation.mutate(),
    markRead: (id: number) => markReadMutation.mutate(id),
  };
}
