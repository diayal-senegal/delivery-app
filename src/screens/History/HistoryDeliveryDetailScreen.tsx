import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Linking, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { Delivery } from '../../types';
import { theme } from '../../theme/theme';

export default function HistoryDeliveryDetailScreen({ route }: any) {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    loadDelivery();
  }, []);

  const loadDelivery = async () => {
    try {
      const data = await deliveriesApi.getDeliveryById(deliveryId);
      console.log('=== DELIVERY DATA AFTER FIX ===');
      console.log('feeAmount:', data.feeAmount);
      console.log('distanceKm:', data.distanceKm);
      console.log('pickupLat:', data.pickupLat);
      console.log('dropoffLat:', data.dropoffLat);
      console.log('pickedUpAt:', data.pickedUpAt);
      console.log('deliveredAt:', data.deliveredAt);
      console.log('==============================');
      setDelivery(data);
    } catch (error) {
      console.error('Erreur chargement livraison:', error);
      Alert.alert('Erreur', 'Impossible de charger la livraison');
    }
  };

  const calculateDuration = () => {
    if (!delivery?.pickedUpAt || !delivery?.deliveredAt) return null;
    const start = new Date(delivery.pickedUpAt).getTime();
    const end = new Date(delivery.deliveredAt).getTime();
    const minutes = Math.floor((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openMaps = () => {
    if (delivery?.pickupLat && delivery?.pickupLng && delivery?.dropoffLat && delivery?.dropoffLng) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&origin=${delivery.pickupLat},${delivery.pickupLng}&destination=${delivery.dropoffLat},${delivery.dropoffLng}`
      );
    }
  };

  if (!delivery) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    );
  }

  const hasCoordinates = delivery.pickupLat && delivery.pickupLng && delivery.dropoffLat && delivery.dropoffLng;
  const duration = calculateDuration();

  return (
    <ScrollView style={styles.container}>
      {hasCoordinates ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (delivery.pickupLat! + delivery.dropoffLat!) / 2,
              longitude: (delivery.pickupLng! + delivery.dropoffLng!) / 2,
              latitudeDelta: Math.abs(delivery.pickupLat! - delivery.dropoffLat!) * 2.5 || 0.1,
              longitudeDelta: Math.abs(delivery.pickupLng! - delivery.dropoffLng!) * 2.5 || 0.1,
            }}
          >
            <Marker
              coordinate={{ latitude: delivery.pickupLat!, longitude: delivery.pickupLng! }}
              title="Récupération"
              pinColor="blue"
            />
            <Marker
              coordinate={{ latitude: delivery.dropoffLat!, longitude: delivery.dropoffLng! }}
              title="Livraison"
              pinColor="green"
            />
            <Polyline
              coordinates={[
                { latitude: delivery.pickupLat!, longitude: delivery.pickupLng! },
                { latitude: delivery.dropoffLat!, longitude: delivery.dropoffLng! },
              ]}
              strokeColor="#6366f1"
              strokeWidth={4}
            />
          </MapView>
          <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
            <Text style={styles.mapButtonText}>🗺️ Ouvrir dans Google Maps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noMapCard}>
          <Text style={styles.noMapText}>📍 Coordonnées GPS non disponibles</Text>
        </View>
      )}

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Statistiques de la course</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {delivery.distanceKm ? `${delivery.distanceKm.toFixed(1)} km` : '-'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Durée</Text>
            <Text style={styles.statValue}>{duration || '-'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Récupération</Text>
            <Text style={styles.statValue}>{formatTime(delivery.pickedUpAt)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Livraison</Text>
            <Text style={styles.statValue}>{formatTime(delivery.deliveredAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>💰 Votre rémunération</Text>
        <Text style={styles.earningsAmount}>
          {delivery.courierEarnings || delivery.feeAmount || 0} FCFA
        </Text>
        {delivery.commissionAmount > 0 && (
          <View style={styles.commissionBreakdown}>
            <Text style={styles.breakdownText}>Frais livraison: {delivery.feeAmount} FCFA</Text>
            <Text style={styles.breakdownText}>Commission plateforme (5%): -{delivery.commissionAmount} FCFA</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Point de récupération</Text>
        <Text style={styles.name}>{delivery.pickupContactName}</Text>
        <Text style={styles.address}>{delivery.pickupAddressText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📦 Point de livraison</Text>
        <Text style={styles.name}>{delivery.dropoffContactName}</Text>
        <Text style={styles.address}>{delivery.dropoffAddressText}</Text>
      </View>



      {delivery.notes && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Notes</Text>
          <Text style={styles.notes}>{delivery.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  map: {
    width: '100%',
    height: 300,
  },
  mapContainer: {
    position: 'relative',
  },
  mapButton: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: '#fff',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.large,
  },
  mapButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  noMapCard: {
    backgroundColor: theme.colors.backgroundLight,
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  noMapText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  statsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  earningsCard: {
    backgroundColor: '#dcfce7',
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.success,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  earningsLabel: {
    fontSize: theme.fontSize.md,
    color: '#166534',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: '#166534',
  },
  commissionBreakdown: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#86efac',
    width: '100%',
  },
  breakdownText: {
    fontSize: theme.fontSize.sm,
    color: '#166534',
    marginBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  address: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  notes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
