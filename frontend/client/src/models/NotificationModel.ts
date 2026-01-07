export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}
