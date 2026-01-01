import AsyncStorage from '@react-native-async-storage/async-storage';
import { Delivery, DeliveryStatus, FailureReason } from '../../types';
import { secureStorage } from '../security/secure-storage';
import { deliveriesApi } from '../api/deliveries.api';

interface PendingAction {
  id: string;
  type: 'ACCEPT_DELIVERY' | 'REJECT_DELIVERY' | 'UPDATE_STATUS' | 'VALIDATE_CODE' | 'MARK_FAILED' | 'UPLOAD_PHOTO';
  deliveryId: string;
  payload: any;
  timestamp: number;
  retries: number;
}

class OfflineService {
  private readonly DELIVERIES_KEY = 'offline_deliveries';
  private readonly PENDING_ACTIONS_KEY = 'pending_actions';
  private syncInProgress = false;

  async saveDeliveries(deliveries: Delivery[]): Promise<void> {
    try {
      await secureStorage.setEncrypted(this.DELIVERIES_KEY, JSON.stringify(deliveries));
    } catch (error) {
      console.error('Erreur sauvegarde livraisons');
    }
  }

  async getDeliveries(): Promise<Delivery[]> {
    try {
      const data = await secureStorage.getDecrypted(this.DELIVERIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération livraisons');
      return [];
    }
  }

  async queueAction(action: Omit<PendingAction, 'id' | 'retries'>): Promise<void> {
    try {
      const actions = await this.getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: `${Date.now()}_${Math.random()}`,
        retries: 0,
      };
      actions.push(newAction);
      await AsyncStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error('Erreur queue action:', error);
    }
  }

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_ACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération actions:', error);
      return [];
    }
  }

  async removeAction(actionId: string): Promise<void> {
    try {
      const actions = await this.getPendingActions();
      const filtered = actions.filter(a => a.id !== actionId);
      await AsyncStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Erreur suppression action:', error);
    }
  }

  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) return { success: 0, failed: 0 };
    
    this.syncInProgress = true;
    let success = 0;
    let failed = 0;

    try {
      const actions = await this.getPendingActions();
      
      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.removeAction(action.id);
          success++;
        } catch (error) {
          console.error('Erreur sync action:', action.type, error);
          
          if (action.retries >= 3) {
            await this.removeAction(action.id);
            failed++;
          } else {
            action.retries++;
            const actions = await this.getPendingActions();
            const index = actions.findIndex(a => a.id === action.id);
            if (index !== -1) {
              actions[index] = action;
              await AsyncStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(actions));
            }
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return { success, failed };
  }

  private async executeAction(action: PendingAction): Promise<void> {
    switch (action.type) {
      case 'ACCEPT_DELIVERY':
        await deliveriesApi.acceptDelivery(action.deliveryId);
        break;
      case 'REJECT_DELIVERY':
        await deliveriesApi.rejectDelivery(action.deliveryId, action.payload.reason);
        break;
      case 'UPDATE_STATUS':
        await deliveriesApi.updateStatus(action.deliveryId, action.payload.status, action.payload.location);
        break;
      case 'VALIDATE_CODE':
        await deliveriesApi.validateDeliveryCode(action.deliveryId, action.payload.code);
        break;
      case 'MARK_FAILED':
        await deliveriesApi.markAsFailed(action.deliveryId, action.payload.reason, action.payload.comment, action.payload.location);
        break;
      default:
        console.warn('Type action inconnu:', action.type);
    }
  }

  async updateDeliveryLocally(deliveryId: string, updates: Partial<Delivery>): Promise<void> {
    try {
      const deliveries = await this.getDeliveries();
      const index = deliveries.findIndex(d => d.id === deliveryId);
      
      if (index !== -1) {
        deliveries[index] = { ...deliveries[index], ...updates };
        await this.saveDeliveries(deliveries);
      }
    } catch (error) {
      console.error('Erreur mise à jour locale:', error);
    }
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(this.PENDING_ACTIONS_KEY);
    await secureStorage.remove(this.DELIVERIES_KEY);
  }
}

export const offlineService = new OfflineService();