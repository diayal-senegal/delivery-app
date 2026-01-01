import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocation } from '../../hooks/useLocation';
import { notificationService } from '../../services/notifications/notification.service';
import { cameraService } from '../../services/camera/camera.service';
import { offlineService } from '../../services/offline/offline.service';

export default function TestScreen() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { location, getCurrentLocation, hasPermission } = useLocation();

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: true }));
      Alert.alert('✅ Test réussi', `${testName} fonctionne correctement`);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }));
      Alert.alert('❌ Test échoué', `${testName}: ${error}`);
    }
  };

  const testLocation = async () => {
    if (!hasPermission) throw new Error('Permission de localisation refusée');
    const loc = await getCurrentLocation();
    if (!loc) throw new Error('Impossible d\'obtenir la position');
  };

  const testNotifications = async () => {
    await notificationService.showLocalNotification('Test', 'Notification de test');
  };

  const testCamera = () => {
    return new Promise<void>((resolve, reject) => {
      cameraService.showPhotoOptions((uri) => {
        if (uri) resolve();
        else reject(new Error('Aucune photo prise'));
      });
    });
  };

  const testOfflineStorage = async () => {
    await offlineService.queueAction({
      type: 'TEST_ACTION',
      payload: { test: true },
      timestamp: Date.now(),
    });
    const actions = await offlineService.getPendingActions();
    if (actions.length === 0) throw new Error('Action non sauvegardée');
  };

  const getTestIcon = (testName: string) => {
    if (!(testName in testResults)) return '⏳';
    return testResults[testName] ? '✅' : '❌';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tests des fonctionnalités</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Géolocalisation</Text>
        <Text style={styles.info}>
          Permission: {hasPermission ? '✅' : '❌'}{'\n'}
          Position: {location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'Non disponible'}
        </Text>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => runTest('Géolocalisation', testLocation)}
        >
          <Text style={styles.testButtonText}>
            {getTestIcon('Géolocalisation')} Tester la géolocalisation
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => runTest('Notifications', testNotifications)}
        >
          <Text style={styles.testButtonText}>
            {getTestIcon('Notifications')} Tester les notifications
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📷 Caméra</Text>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => runTest('Caméra', testCamera)}
        >
          <Text style={styles.testButtonText}>
            {getTestIcon('Caméra')} Tester la caméra
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Stockage hors-ligne</Text>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => runTest('Stockage', testOfflineStorage)}
        >
          <Text style={styles.testButtonText}>
            {getTestIcon('Stockage')} Tester le stockage
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.runAllButton}
        onPress={async () => {
          await runTest('Géolocalisation', testLocation);
          await runTest('Notifications', testNotifications);
          await runTest('Stockage', testOfflineStorage);
        }}
      >
        <Text style={styles.runAllButtonText}>🚀 Lancer tous les tests</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  runAllButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  runAllButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});