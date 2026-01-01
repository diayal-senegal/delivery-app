import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { offlineService } from '../../services/offline/offline.service';
import { theme } from '../../theme/theme';

export default function AcceptDeliveryScreen({ route, navigation }: any) {
  const { delivery } = route.params;
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await deliveriesApi.acceptDelivery(delivery.id);
      Alert.alert('Mission acceptée', 'Vous pouvez maintenant commencer la livraison', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      await offlineService.queueAction({
        type: 'ACCEPT_DELIVERY',
        deliveryId: delivery.id,
        payload: {},
        timestamp: Date.now(),
      });
      await offlineService.updateDeliveryLocally(delivery.id, { status: 'ACCEPTED' });
      Alert.alert('Sauvegardé hors ligne', 'L\'action sera synchronisée automatiquement', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Raison requise', 'Veuillez indiquer pourquoi vous refusez cette mission');
      return;
    }

    setLoading(true);
    try {
      await deliveriesApi.rejectDelivery(delivery.id, rejectReason);
      Alert.alert('Mission refusée', 'La mission a été refusée', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      await offlineService.queueAction({
        type: 'REJECT_DELIVERY',
        deliveryId: delivery.id,
        payload: { reason: rejectReason },
        timestamp: Date.now(),
      });
      await offlineService.updateDeliveryLocally(delivery.id, { status: 'REJECTED' });
      Alert.alert('Sauvegardé hors ligne', 'L\'action sera synchronisée automatiquement', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mission #{delivery.id.slice(0, 8)}</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>📍 Récupération</Text>
          <Text style={styles.text}>{delivery.pickupAddressText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>📦 Livraison</Text>
          <Text style={styles.text}>{delivery.dropoffAddressText}</Text>
        </View>

        {delivery.distanceKm && (
          <View style={styles.section}>
            <Text style={styles.label}>📏 Distance</Text>
            <Text style={styles.text}>{delivery.distanceKm} km</Text>
          </View>
        )}

        {delivery.cashOnDeliveryAmount && delivery.cashOnDeliveryAmount > 0 && (
          <View style={[styles.section, styles.codSection]}>
            <Text style={styles.codLabel}>💰 À encaisser</Text>
            <Text style={styles.codAmount}>{delivery.cashOnDeliveryAmount} {delivery.feeCurrency}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.acceptButton, loading && styles.buttonDisabled]}
        onPress={handleAccept}
        disabled={loading}
      >
        <LinearGradient colors={theme.gradients.success} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>✓ Accepter la mission</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.rejectSection}>
        <Text style={styles.rejectTitle}>Refuser cette mission ?</Text>
        <TextInput
          style={styles.input}
          placeholder="Raison du refus..."
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
        />
        <TouchableOpacity 
          style={[styles.rejectButton, loading && styles.buttonDisabled]}
          onPress={handleReject}
          disabled={loading}
        >
          <Text style={styles.rejectButtonText}>✕ Refuser</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
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
  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  codSection: {
    backgroundColor: '#fff9e6',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  codLabel: {
    fontSize: theme.fontSize.sm,
    color: '#b45309',
    fontWeight: '600',
  },
  codAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: '#b45309',
  },
  acceptButton: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  rejectSection: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  rejectTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    minHeight: 80,
    marginBottom: theme.spacing.md,
  },
  rejectButton: {
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
});
