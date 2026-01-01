import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { offlineService } from '../../services/offline/offline.service';
import { theme } from '../../theme/theme';

export default function DeliveryValidationScreen({ route, navigation }: any) {
  const { deliveryId, onValidated } = route.params;
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validateCode = async (code: string) => {
    setLoading(true);
    try {
      const result = await deliveriesApi.validateDeliveryCode(deliveryId, code);
      
      if (result.valid) {
        Alert.alert('Code valide', 'La livraison peut être confirmée', [
          { text: 'OK', onPress: () => {
            onValidated?.();
            navigation.goBack();
          }}
        ]);
      } else {
        Alert.alert('Code invalide', result.message || 'Le code ne correspond pas');
        setOtpCode('');
      }
    } catch (error) {
      await offlineService.queueAction({
        type: 'VALIDATE_CODE',
        deliveryId,
        payload: { code },
        timestamp: Date.now(),
      });
      Alert.alert('Sauvegardé hors ligne', 'La validation sera synchronisée automatiquement', [
        { text: 'OK', onPress: () => {
          onValidated?.();
          navigation.goBack();
        }}
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = () => {
    if (otpCode.length < 4) {
      Alert.alert('Code incomplet', 'Veuillez saisir au moins 4 chiffres');
      return;
    }
    validateCode(otpCode);
  };

  const skipValidation = () => {
    Alert.alert(
      'Continuer sans code ?',
      'La validation par code est recommandée. Voulez-vous continuer avec photo uniquement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => {
          onValidated?.();
          navigation.goBack();
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.otpContainer}>
        <Text style={styles.otpTitle}>Code de validation</Text>
        <Text style={styles.otpSubtitle}>Demandez le code au client</Text>
        
        <TextInput
          style={styles.otpInput}
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor="#ccc"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.validateButton, loading && styles.buttonDisabled]}
          onPress={handleOtpSubmit}
          disabled={loading}
        >
          <Text style={styles.validateButtonText}>
            {loading ? 'Validation...' : 'Valider le code'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={skipValidation}>
        <Text style={styles.skipButtonText}>Continuer sans code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  otpContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  otpSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
  },
  otpInput: {
    width: '100%',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    letterSpacing: 10,
  },
  validateButton: {
    width: '100%',
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
});
