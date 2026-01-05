import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { Delivery, DeliveryStatus } from '../../types';
import { cameraService } from '../../services/camera/camera.service';
import { notificationService } from '../../services/notifications/notification.service';
import { offlineService } from '../../services/offline/offline.service';
import { useLocation } from '../../hooks/useLocation';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { theme } from '../../theme/theme';

export default function DeliveryDetailScreen({ route, navigation }: any) {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const { getCurrentLocation } = useLocation();
  const { isTracking, distance, startTracking, stopTracking } = useLocationTracking(deliveryId);

  useEffect(() => {
    loadDelivery();
  }, []);

  useEffect(() => {
    if (delivery?.status === 'EN_ROUTE' && !isTracking) {
      startTracking();
    } else if (delivery?.status === 'DELIVERED' && isTracking) {
      stopTracking();
    }
  }, [delivery?.status]);

  const loadDelivery = async () => {
    try {
      const data = await deliveriesApi.getDeliveryById(deliveryId);
      setDelivery(data);
    } catch (error) {
      console.error('Erreur chargement livraison:', error);
      Alert.alert('Erreur', 'Impossible de charger la livraison');
    }
  };

  const updateStatus = async (newStatus: DeliveryStatus) => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      
      try {
        await deliveriesApi.updateStatus(deliveryId, newStatus, location ? {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        } : undefined);
        
        await loadDelivery();
        await notificationService.notifyDeliveryUpdate(newStatus.toLowerCase());
        Alert.alert('Succès', 'Statut mis à jour');
      } catch (error) {
        // En cas d'erreur, sauvegarder l'action pour synchronisation ultérieure
        await offlineService.queueAction({
          type: 'status_update',
          deliveryId,
          data: {
            status: newStatus,
            location: location ? {
              lat: location.coords.latitude,
              lng: location.coords.longitude
            } : undefined
          },
          timestamp: new Date().toISOString()
        });
        
        // Mettre à jour localement
        if (delivery) {
          await offlineService.updateDeliveryLocally(deliveryId, { status: newStatus });
          setDelivery({ ...delivery, status: newStatus });
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setLoading(false);
    }
  };

  const takeDeliveryPhoto = () => {
    cameraService.showPhotoOptions((uri) => {
      setDeliveryPhoto(uri);
      Alert.alert('Photo ajoutée', 'La photo de livraison a été prise avec succès');
    });
  };

  const completeDelivery = async () => {
    navigation.navigate('ProofOfDelivery', {
      deliveryId: delivery?.id,
      onComplete: async (pod: any) => {
        await finalizeDelivery();
      }
    });
  };

  const finalizeDelivery = async () => {
    if (delivery?.validationType && delivery.validationType !== 'NONE') {
      navigation.navigate('DeliveryValidation', {
        deliveryId: delivery.id,
        onValidated: () => updateStatus('DELIVERED')
      });
    } else {
      await updateStatus('DELIVERED');
    }
  };

  const openMaps = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    } else if (address) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
    }
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (!delivery) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const getNextAction = () => {
    switch (delivery.status) {
      case 'ASSIGNED':
        return { 
          label: 'Accepter/Refuser', 
          action: () => navigation.navigate('AcceptDelivery', { delivery }),
          color: theme.gradients.primary
        };
      case 'ACCEPTED':
      case 'PICKUP_PENDING':
        return { 
          label: 'Marquer comme récupéré', 
          action: () => updateStatus('PICKED_UP'),
          color: theme.gradients.success
        };
      case 'PICKED_UP':
        return { 
          label: 'Commencer la livraison', 
          action: () => updateStatus('EN_ROUTE'),
          color: theme.gradients.success
        };
      case 'EN_ROUTE':
        return { 
          label: 'Marquer comme arrivé', 
          action: () => updateStatus('ARRIVED'),
          color: theme.gradients.success
        };
      case 'ARRIVED':
        return { 
          label: 'Marquer comme livré', 
          action: completeDelivery,
          color: theme.gradients.success
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  const canMarkAsFailed = ['ACCEPTED', 'PICKUP_PENDING', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'].includes(delivery.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Point de récupération</Text>
        <Text style={styles.name}>{delivery.pickupContactName}</Text>
        <Text style={styles.address}>{delivery.pickupAddressText}</Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => callPhone(delivery.pickupPhone)}
          >
            <Text style={styles.actionText}>📞 Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openMaps(delivery.pickupLat, delivery.pickupLng, delivery.pickupAddressText)}
          >
            <Text style={styles.actionText}>🗺️ Itinéraire</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📦 Point de livraison</Text>
        <Text style={styles.name}>{delivery.dropoffContactName}</Text>
        <Text style={styles.address}>{delivery.dropoffAddressText}</Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => callPhone(delivery.dropoffPhone)}
          >
            <Text style={styles.actionText}>📞 Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openMaps(delivery.dropoffLat, delivery.dropoffLng, delivery.dropoffAddressText)}
          >
            <Text style={styles.actionText}>🗺️ Itinéraire</Text>
          </TouchableOpacity>
        </View>
      </View>

      {delivery.cashOnDeliveryAmount && delivery.cashOnDeliveryAmount > 0 && (
        <View style={[styles.card, styles.codCard]}>
          <Text style={styles.codLabel}>💰 Montant à encaisser</Text>
          <Text style={styles.codAmount}>{delivery.cashOnDeliveryAmount} FCFA</Text>
        </View>
      )}

      {delivery.notes && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Notes</Text>
          <Text style={styles.notes}>{delivery.notes}</Text>
        </View>
      )}

      {delivery.validationType && delivery.validationType !== 'NONE' && (
        <View style={[styles.card, styles.validationCard]}>
          <Text style={styles.sectionTitle}>🔒 Validation requise</Text>
          <Text style={styles.validationText}>
            {delivery.validationType === 'QR' ? '📷 Scan QR Code' : '🔢 Code OTP'}
          </Text>
          <Text style={styles.validationSubtext}>
            Le client devra fournir un code de validation
          </Text>
        </View>
      )}

      {isTracking && (
        <View style={[styles.card, styles.trackingCard]}>
          <Text style={styles.sectionTitle}>📍 Suivi GPS actif</Text>
          <Text style={styles.trackingText}>
            Distance parcourue: {distance.toFixed(2)} km
          </Text>
          <Text style={styles.trackingSubtext}>
            Position envoyée toutes les 30 secondes
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📷 Photo de livraison</Text>
        <Text style={styles.statusDebug}>Statut actuel: {delivery.status}</Text>
        {deliveryPhoto ? (
          <View>
            <Image source={{ uri: deliveryPhoto }} style={styles.deliveryPhoto} />
            {!['DELIVERED', 'FAILED', 'CANCELED', 'REJECTED'].includes(delivery.status) && (
              <View style={styles.photoActions}>
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={takeDeliveryPhoto}
                >
                  <Text style={styles.retakeButtonText}>Reprendre</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => setDeliveryPhoto(null)}
                >
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.validateButton}
                  onPress={() => Alert.alert('Photo validée', 'La photo a été enregistrée avec succès !')}
                >
                  <Text style={styles.validateButtonText}>✓ OK</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          !['DELIVERED', 'FAILED', 'CANCELED', 'REJECTED'].includes(delivery.status) && (
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={takeDeliveryPhoto}
            >
              <Text style={styles.photoButtonText}>📷 Prendre une photo</Text>
            </TouchableOpacity>
          )
        )}
        {['DELIVERED', 'FAILED', 'CANCELED', 'REJECTED'].includes(delivery.status) && !deliveryPhoto && (
          <Text style={styles.noPhotoText}>Aucune photo disponible</Text>
        )}
      </View>

      {nextAction && (
        <TouchableOpacity 
          style={[styles.mainButton, loading && styles.buttonDisabled]}
          onPress={nextAction.action}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={nextAction.color}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.mainButtonText}>{nextAction.label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {canMarkAsFailed && (
        <TouchableOpacity 
          style={styles.failButton}
          onPress={() => navigation.navigate('DeliveryFailure', { deliveryId })}
        >
          <Text style={styles.failButtonText}>❌ Marquer comme échoué</Text>
        </TouchableOpacity>
      )}

      {!['DELIVERED', 'FAILED', 'CANCELED', 'REJECTED'].includes(delivery.status) && (
        <TouchableOpacity 
          style={styles.issueButton}
          onPress={() => navigation.navigate('DeliveryIssue', { deliveryId })}
        >
          <Text style={styles.issueButtonText}>⚠️ Signaler un problème</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.borderLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  codCard: {
    backgroundColor: '#fff9e6',
    borderColor: theme.colors.warning,
    borderWidth: 2,
  },
  codLabel: {
    fontSize: theme.fontSize.sm,
    color: '#b45309',
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  codAmount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: '#b45309',
  },
  notes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  validationCard: {
    backgroundColor: '#fff9e6',
    borderColor: theme.colors.warning,
    borderWidth: 2,
  },
  validationText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: theme.spacing.xs,
  },
  validationSubtext: {
    fontSize: theme.fontSize.sm,
    color: '#92400e',
  },
  trackingCard: {
    backgroundColor: '#e0f2fe',
    borderColor: theme.colors.info,
    borderWidth: 2,
  },
  trackingText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: theme.spacing.xs,
  },
  trackingSubtext: {
    fontSize: theme.fontSize.sm,
    color: '#075985',
  },
  statusDebug: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  deliveryPhoto: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retakeButton: {
    flex: 1,
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  retakeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.fontSize.sm,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.fontSize.sm,
  },
  validateButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.fontSize.sm,
  },
  photoButton: {
    backgroundColor: theme.colors.info,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  testButton: {
    backgroundColor: theme.colors.textLight,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  mainButton: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  buttonGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  failButton: {
    backgroundColor: theme.colors.danger,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  failButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  issueButton: {
    backgroundColor: theme.colors.danger,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  issueButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  noPhotoText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: theme.fontSize.sm,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.lg,
  },
});