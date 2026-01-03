import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { authApi } from '../../services/api/auth.api';
import { validatePhone } from '../../utils/validation';
import { theme } from '../../theme/theme';

export default function ActivationScreen({ navigation, route }: any) {
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOTP = async () => {
    if (!phone || !otp) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Erreur', 'Format de téléphone invalide');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Erreur', 'Le code OTP doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOTP(phone, otp);
      navigation.navigate('SetPassword', {
        phone,
        tempToken: response.tempToken,
        courierId: response.courierId
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phone) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    setResending(true);
    try {
      await authApi.resendOTP(phone);
      Alert.alert('Succès', 'Un nouveau code OTP a été envoyé');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de renvoyer le code');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Activation du compte</Text>
          <Text style={styles.subtitle}>Entrez le code OTP reçu par SMS</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>📱 Téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+221 XX XXX XX XX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!route.params?.phone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔢 Code OTP (6 chiffres)</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResendOTP}
            disabled={resending}
          >
            <Text style={styles.secondaryButtonText}>
              {resending ? 'Envoi...' : 'Renvoyer le code'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  otpInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    color: theme.colors.text,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '800',
  },
  secondaryButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
