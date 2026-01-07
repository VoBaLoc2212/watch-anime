const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;

export const GetNotificationsApi = async (limit: number = 20) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/notification/get-notifications?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get notifications');
  }
  return data;
};

export const MarkAsReadApi = async (notificationId: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/notification/mark-read/${notificationId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark as read');
  }
  return data;
};

export const MarkAllAsReadApi = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/notification/mark-all-read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark all as read');
  }
  return data;
};

export const GetUnreadCountApi = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/notification/unread-count`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get unread count');
  }
  return data;
};
