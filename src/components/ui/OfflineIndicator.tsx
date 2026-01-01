import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { offlineService } from '../../services/offline/offline.service';
import { theme } from '../../theme/theme';

export const OfflineIndicator = () => {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOnline && pendingCount > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (isOnline && pendingCount > 0) {
      syncActions();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, pendingCount]);

  const loadPendingCount = async () => {
    const actions = await offlineService.getPendingActions();
    setPendingCount(actions.length);
  };

  const syncActions = async () => {
    if (syncing) return;
    setSyncing(true);
    
    try {
      const result = await offlineService.syncPendingActions();
      await loadPendingCount();
    } finally {
      setSyncing(false);
    }
  };

  if (pendingCount === 0 && isOnline) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.indicator, isOnline ? styles.syncing : styles.offline]}>
        <Text style={styles.text}>
          {isOnline 
            ? `🔄 Synchronisation... (${pendingCount})`
            : `📴 Hors ligne • ${pendingCount} action(s) en attente`
          }
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  indicator: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: theme.colors.warning,
  },
  syncing: {
    backgroundColor: theme.colors.info,
  },
  text: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
});
