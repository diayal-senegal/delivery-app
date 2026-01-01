import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import apiClient from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permissions refusées', 'Les notifications sont désactivées');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    await this.registerForPushNotifications();
    return true;
  }

  async registerForPushNotifications(): Promise<void> {
    try {
      // Vérifier si on est en mode dev/simulateur
      if (!__DEV__) {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        this.expoPushToken = token;
        await apiClient.post('/couriers/me/push-token', { token });
      }
    } catch (error) {
      // Ignorer l'erreur en dev (pas de projectId nécessaire)
      console.log('Push notifications non disponibles en dev');
    }
  }

  setupNotificationListeners(): void {
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification cliquée:', response);
    });
  }

  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });
  }

  async notifyNewDelivery(customerName: string, address: string): Promise<void> {
    await this.showLocalNotification(
      'Nouvelle livraison !',
      `Livraison pour ${customerName} - ${address}`,
      { type: 'NEW_DELIVERY' }
    );
  }

  async notifyDeliveryUpdate(status: string): Promise<void> {
    const messages = {
      'picked_up': 'Commande récupérée avec succès',
      'en_route': 'En route vers le client',
      'arrived': 'Vous êtes arrivé à destination',
      'delivered': 'Livraison terminée !',
      'failed': 'Problème de livraison signalé'
    };

    await this.showLocalNotification(
      'Statut mis à jour',
      messages[status as keyof typeof messages] || 'Statut de livraison mis à jour',
      { type: 'STATUS_UPDATE', status }
    );
  }

  async notifyDeliveryCanceled(deliveryId: string): Promise<void> {
    await this.showLocalNotification(
      'Mission annulée',
      'Une de vos missions a été annulée',
      { type: 'DELIVERY_CANCELED', deliveryId }
    );
  }

  async notifyMessage(from: string, message: string): Promise<void> {
    await this.showLocalNotification(
      `Message de ${from}`,
      message,
      { type: 'MESSAGE' }
    );
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();