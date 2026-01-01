import apiClient from './client';

export const trackingApi = {
  async sendLocation(deliveryId: string, location: { latitude: number; longitude: number; timestamp: number; accuracy?: number }): Promise<void> {
    await apiClient.post('/couriers/location', {
      lat: location.latitude,
      lng: location.longitude,
      accuracy: location.accuracy,
      deliveryId
    });
  },

  async getLocationHistory(deliveryId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/courier/deliveries/${deliveryId}/location-history`);
    return data;
  },
};
