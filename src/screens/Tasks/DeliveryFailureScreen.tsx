import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { FailureReason } from '../../types';
import { useLocation } from '../../hooks/useLocation';
import { theme } from '../../theme/theme';

const FAILURE_REASONS: { value: FailureReason; label: string; icon: string }[] = [
  { value: 'CUSTOMER_ABSENT', label: 'Client absent', icon: '🚫' },
  { value: 'ADDRESS_NOT_FOUND', label: 'Adresse introuvable', icon: '🗺️' },
  { value: 'PHONE_UNREACHABLE', label: 'Téléphone injoignable', icon: '📵' },
  { value: 'CUSTOMER_REFUSED', label: 'Client a refusé', icon: '❌' },
  { value: 'DAMAGED_PACKAGE', label: 'Colis endommagé', icon: '📦' },
  { value: 'OTHER', label: 'Autre raison', icon: '⚠️' },
];

export default function DeliveryFailureScreen({ route, navigation }: any) {
  const { deliveryId } = route.params;
  const [selectedReason, setSelectedReason] = useState<FailureReason | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { getCurrentLocation } = useLocation();

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Raison requise', 'Veuillez sélectionner une raison d\'échec');
      return;
    }

    if (selectedReason === 'OTHER' && !comment.trim()) {
      Alert.alert('Commentaire requis', 'Veuillez préciser la raison');
      return;
    }

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      await deliveriesApi.markAsFailed(
        deliveryId,
        selectedReason,
        comment || undefined,
        location ? { lat: location.coords.latitude, lng: location.coords.longitude } : undefined
      );
      
      Alert.alert('Échec signalé', 'L\'échec de livraison a été enregistré', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'échec');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Échec de livraison</Text>
        <Text style={styles.subtitle}>Sélectionnez la raison de l'échec</Text>
      </View>

      <View style={styles.reasonsContainer}>
        {FAILURE_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.value}
            style={[
              styles.reasonButton,
              selectedReason === reason.value && styles.reasonButtonSelected,
            ]}
            onPress={() => setSelectedReason(reason.value)}
          >
            <Text style={styles.reasonIcon}>{reason.icon}</Text>
            <Text style={[
              styles.reasonText,
              selectedReason === reason.value && styles.reasonTextSelected,
            ]}>
              {reason.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.label}>Commentaire {selectedReason === 'OTHER' && '(requis)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Ajoutez des détails..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Enregistrement...' : 'Confirmer l\'échec'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  reasonsContainer: {
    padding: theme.spacing.md,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  reasonIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  reasonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  reasonTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  commentSection: {
    padding: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.danger,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
