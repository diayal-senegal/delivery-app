import apiClient from './client';

export const notificationsApi = {
  async registerPushToken(token: string): Promise<void> {
    await apiClient.post('/courier/me/push-token', { token });
  },

  async unregisterPushToken(): Promise<void> {
    await apiClient.delete('/courier/me/push-token');
  },

  async getNotifications(): Promise<any[]> {
    const { data } = await apiClient.get('/courier/me/notifications');
    return data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/courier/me/notifications/${notificationId}/read`);
  },
};
