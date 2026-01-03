import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { authApi } from '../../services/api/auth.api';
import { authManager } from '../../services/auth/auth-manager.service';
import { validateStrongPassword } from '../../utils/validation';
import { theme } from '../../theme/theme';

export default function SetPasswordScreen({ navigation, route }: any) {
  const { phone, tempToken } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validation = validateStrongPassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validation.valid) {
      Alert.alert('Mot de passe faible', validation.errors.join('\n'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.setPassword(phone, password, tempToken);
      
      await authManager.saveAuthData(
        response.token,
        response.refreshToken,
        response.expiresIn,
        response.courier
      );

      Alert.alert('Succès', 'Votre compte a été activé avec succès !', [
        { text: 'OK', onPress: () => navigation.replace('AppTabs') }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de définir le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Définir votre mot de passe</Text>
          <Text style={styles.subtitle}>Créez un mot de passe sécurisé</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔒 Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔒 Confirmer le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showPasswordText}>
              {showPassword ? '🙈 Masquer' : '👁️ Afficher'} le mot de passe
            </Text>
          </TouchableOpacity>

          {/* Indicateur de force du mot de passe */}
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthTitle}>Exigences du mot de passe :</Text>
            {[
              { label: 'Minimum 8 caractères', valid: password.length >= 8 },
              { label: 'Au moins 1 majuscule (A-Z)', valid: /[A-Z]/.test(password) },
              { label: 'Au moins 1 chiffre (0-9)', valid: /[0-9]/.test(password) },
              { label: 'Au moins 1 caractère spécial (!@#$%...)', valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password) },
            ].map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Text style={req.valid ? styles.checkValid : styles.checkInvalid}>
                  {req.valid ? '✓' : '○'}
                </Text>
                <Text style={[styles.requirementText, req.valid && styles.requirementValid]}>
                  {req.label}
                </Text>
              </View>
            ))}
          </View>

          {confirmPassword.length > 0 && (
            <View style={[styles.matchIndicator, passwordsMatch ? styles.matchValid : styles.matchInvalid]}>
              <Text style={styles.matchText}>
                {passwordsMatch ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (!validation.valid || !passwordsMatch || loading) && styles.buttonDisabled]}
            onPress={handleSetPassword}
            disabled={!validation.valid || !passwordsMatch || loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Activation...' : 'Activer mon compte'}
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
  showPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  showPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  strengthContainer: {
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  strengthTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  checkValid: {
    color: theme.colors.success,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginRight: theme.spacing.xs,
  },
  checkInvalid: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    marginRight: theme.spacing.xs,
  },
  requirementText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  requirementValid: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  matchIndicator: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  matchValid: {
    backgroundColor: '#d4edda',
  },
  matchInvalid: {
    backgroundColor: '#f8d7da',
  },
  matchText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
