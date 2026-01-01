import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications/notification.service';

export const useNotifications = (onNotificationReceived?: (notification: any) => void) => {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    notificationService.requestPermissions();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      onNotificationReceived?.(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationResponse = (data: any) => {
    switch (data?.type) {
      case 'NEW_DELIVERY':
        break;
      case 'DELIVERY_CANCELED':
        break;
      case 'MESSAGE':
        break;
      default:
        break;
    }
  };

  return {
    showNotification: notificationService.showLocalNotification.bind(notificationService),
    cancelAll: notificationService.cancelAllNotifications.bind(notificationService),
  };
};
