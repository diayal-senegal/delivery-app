import React from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootStack from './src/navigation/RootStack';
import { ConnectionStatus } from './src/components/ui/ConnectionStatus';
import { OfflineIndicator } from './src/components/ui/OfflineIndicator';
import { notificationService } from './src/services/notifications/notification.service';
import { offlineService } from './src/services/offline/offline.service';
import { authManager } from './src/services/auth/auth-manager.service';

// Ignorer les warnings Expo Go connus
LogBox.ignoreLogs([
  'expo-notifications',
  'Require cycle:',
]);

export default function App() {
  React.useEffect(() => {
    initializeServices();
    return () => authManager.clearTimer();
  }, []);

  const initializeServices = async () => {
    await notificationService.requestPermissions();
    notificationService.setupNotificationListeners();
    await offlineService.syncPendingActions();
  };

  const handleConnectionChange = async (isConnected: boolean) => {
    if (isConnected) {
      await offlineService.syncPendingActions();
    }
  };

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <OfflineIndicator />
        <RootStack />
        <StatusBar style="light" />
      </NavigationContainer>
      <ConnectionStatus onConnectionChange={handleConnectionChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});