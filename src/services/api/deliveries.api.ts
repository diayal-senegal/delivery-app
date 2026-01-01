import apiClient from './client';
import { Delivery, DeliveryStatus, FailureReason } from '../../types';
import { offlineService } from '../offline/offline.service';

type DeliveryBucket = 'pending' | 'active' | 'done';

export const deliveriesApi = {
  async getMyDeliveries(bucket: DeliveryBucket): Promise<Delivery[]> {
    const { data } = await apiClient.get(`/couriers/me/deliveries?bucket=${bucket}`);
    return data;
  },

  async getDeliveryById(id: string): Promise<Delivery> {
    const { data } = await apiClient.get(`/deliveries/${id}`);
    return data;
  },

  async acceptDelivery(id: string): Promise<void> {
    await apiClient.post(`/deliveries/${id}/status`, { newStatus: 'ACCEPTED' });
  },

  async rejectDelivery(id: string, reason: string): Promise<void> {
    await apiClient.post(`/deliveries/${id}/status`, { newStatus: 'REJECTED', meta: { note: reason } });
  },

  async updateStatus(id: string, status: DeliveryStatus, location?: { lat: number; lng: number }): Promise<void> {
    try {
      await apiClient.post(`/deliveries/${id}/status`, { 
        newStatus: status, 
        meta: location ? { location } : {} 
      });
    } catch (error) {
      await offlineService.queueAction({
        type: 'UPDATE_DELIVERY_STATUS',
        payload: { id, status, location },
        timestamp: Date.now(),
      });
      throw error;
    }
  },

  async markAsFailed(id: string, reason: FailureReason, comment?: string, location?: { lat: number; lng: number }): Promise<void> {
    await apiClient.post(`/deliveries/${id}/status`, { 
      newStatus: 'FAILED',
      meta: { reason, note: comment, location }
    });
  },

  async validateDeliveryCode(id: string, code: string): Promise<{ valid: boolean; message?: string }> {
    // Validation côté client pour l'instant (backend à implémenter)
    return { valid: code === '123456', message: code === '123456' ? 'Code valide' : 'Code invalide' };
  },

  async reportIssue(id: string, issue: { reason: string; description: string }): Promise<void> {
    await apiClient.post(`/courier/deliveries/${id}/issues`, issue);
  },
};