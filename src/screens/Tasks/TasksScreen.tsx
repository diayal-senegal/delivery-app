import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { Delivery } from '../../types';
import { useLocation } from '../../hooks/useLocation';
import { useNotifications } from '../../hooks/useNotifications';
import { theme } from '../../theme/theme';

export default function TasksScreen({ navigation }: any) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'pending' | 'active'>('active');
  const { location, isTracking, hasPermission, startTracking, stopTracking, getCurrentLocation } = useLocation();
  const { showNotification } = useNotifications((notification) => {
    loadDeliveries();
  });

  useEffect(() => {
    loadDeliveries();
  }, [tab]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await deliveriesApi.getMyDeliveries(tab);
      console.log('📦 Livraisons reçues:', JSON.stringify(data, null, 2));
      setDeliveries(data);
    } catch (error: any) {
      console.error('Erreur chargement livraisons:', error);
      if (error.response?.status === 401) {
        // Token invalide - ne rien faire, l'app va redémarrer
        setDeliveries([]);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les livraisons');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTracking = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission requise',
        'L\'accès à la localisation est nécessaire pour le suivi des livraisons.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isTracking) {
      stopTracking();
      await showNotification(
        'Suivi arrêté',
        'Le suivi de votre position a été arrêté'
      );
    } else {
      await startTracking();
      await getCurrentLocation();
      await showNotification(
        'Suivi activé',
        'Votre position est maintenant suivie en temps réel'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return '#3498db';
      case 'ACCEPTED': return '#2ecc71';
      case 'REJECTED': return '#95a5a6';
      case 'PICKUP_PENDING': return '#f39c12';
      case 'PICKED_UP': return '#9b59b6';
      case 'EN_ROUTE': return '#e67e22';
      case 'ARRIVED': return '#16a085';
      case 'DELIVERED': return '#27ae60';
      case 'FAILED': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ASSIGNED: 'Assignée',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      PICKUP_PENDING: 'En attente',
      PICKED_UP: 'Récupérée',
      EN_ROUTE: 'En route',
      ARRIVED: 'Arrivé',
      DELIVERED: 'Livrée',
      FAILED: 'Échec',
    };
    return labels[status] || status;
  };

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>#{item.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>📍 Récupération</Text>
        <Text style={styles.address}>{item.pickupAddressText || 'Adresse non renseignée'}</Text>
        <Text style={styles.contact}>{item.pickupContactName || 'N/A'} • {item.pickupPhone || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>📦 Livraison</Text>
        <Text style={styles.address}>{item.dropoffAddressText || 'Adresse non renseignée'}</Text>
        <Text style={styles.contact}>{item.dropoffContactName || 'N/A'} • {item.dropoffPhone || 'N/A'}</Text>
      </View>

      {item.cashOnDeliveryAmount && item.cashOnDeliveryAmount > 0 && (
        <Text style={styles.cod}>💰 À encaisser: {item.cashOnDeliveryAmount} FCFA</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barre de statut avec géolocalisation */}
      <View style={styles.statusBar}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            {location ? `📍 Position: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : '📍 Position non disponible'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={toggleTracking}
        >
          <Text style={[styles.trackingButtonText, isTracking && styles.trackingButtonTextActive]}>
            {isTracking ? '🟢 Suivi ON' : '🔴 Suivi OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>En cours</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>À venir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDeliveries} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune livraison pour le moment</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusBar: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
  },
  trackingButton: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  trackingButtonActive: {
    backgroundColor: theme.colors.success,
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  trackingButtonTextActive: {
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  badgeText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  address: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  contact: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  cod: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: theme.spacing.sm,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
});