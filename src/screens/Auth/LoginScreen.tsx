import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { authApi } from '../../services/api/auth.api';
import { authManager } from '../../services/auth/auth-manager.service';
import { validatePhone, validatePassword, sanitizePhone } from '../../utils/validation';
import { rateLimiter } from '../../services/security/rate-limiter';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Erreur', 'Format de téléphone invalide. Utilisez le format sénégalais (+221XXXXXXXXX)');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const { allowed, remainingTime } = await rateLimiter.checkLoginAttempts();
    if (!allowed) {
      Alert.alert('Compte temporairement bloqué', `Trop de tentatives échouées. Réessayez dans ${remainingTime} secondes.`);
      return;
    }

    setLoading(true);

    try {
      let response;
      try {
        response = await authApi.login({ phone, password });
      } catch (firstError: any) {
        // Si échec, essayer avec le numéro sanitizé (sans +221)
        if (firstError.response?.status === 401) {
          const sanitizedPhone = sanitizePhone(phone);
          response = await authApi.login({ phone: sanitizedPhone, password });
        } else {
          throw firstError;
        }
      }

      const validation = await authManager.validateCourierAccess(response.courier);
      if (!validation.valid) {
        Alert.alert('Accès refusé', validation.reason || 'Accès non autorisé');
        setLoading(false);
        return;
      }

      await authManager.saveAuthData(
        response.token,
        response.refreshToken,
        response.expiresIn,
        response.courier
      );

      await rateLimiter.resetAttempts();
      navigation.replace('AppTabs');
    } catch (error: any) {
      const result = await rateLimiter.recordFailedAttempt();

      // Vérifier si le compte nécessite une activation
      if (error.response?.data?.requiresActivation) {
        Alert.alert(
          'Compte non activé',
          'Votre compte n\'a pas encore été activé. Veuillez entrer le code OTP reçu par SMS.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Activer', onPress: () => navigation.navigate('Activation', { phone }) }
          ]
        );
        setLoading(false);
        return;
      }

      if (result.locked) {
        Alert.alert('Compte bloqué', 'Trop de tentatives échouées. Votre compte est temporairement bloqué pour 5 minutes.');
      } else if (result.remainingAttempts !== undefined) {
        Alert.alert('Erreur de connexion', `Identifiants incorrects. ${result.remainingAttempts} tentative(s) restante(s).`);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/logo-diayal.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.pill}>
            <Text style={styles.pillText}>Espace Coursier</Text>
          </View>

          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Accédez à vos livraisons et à votre activité.</Text>
        </View>

        {/* Card */}
        <View style={styles.formCard}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Bienvenue 👋</Text>
            <Text style={styles.welcomeSubtext}>Connectez-vous pour commencer vos livraisons</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>📱 Téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+221 XX XXX XX XX"
              placeholderTextColor="#87928E"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="telephoneNumber"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔒 Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre mot de passe"
              placeholderTextColor="#87928E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>Diayal • Livraison</Text>
            <View style={styles.divider} />
          </View>
        </View>

        <Text style={styles.bottomHint}>
          Astuce : utilisez un mot de passe sûr — on préfère la sécurité aux surprises.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ACCENT = '#059473';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F7', // clair premium
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    paddingBottom: 18,
  },

  logoWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 12,
  },

  logo: {
    width: 84,
    height: 84,
  },

  pill: {
    backgroundColor: 'rgba(5, 148, 115, 0.10)',
    borderColor: 'rgba(5, 148, 115, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },

  pillText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: '900',
    color: '#0E1412',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#5C6B66',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },

  formCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 5,
  },

  welcomeSection: {
    marginBottom: 18,
  },

  welcomeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0E1412',
    marginBottom: 6,
  },

  welcomeSubtext: {
    fontSize: 13,
    color: '#5C6B66',
    lineHeight: 18,
  },

  inputContainer: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E1412',
    marginBottom: 8,
    marginLeft: 2,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0E1412',
  },

  primaryButton: {
    marginTop: 6,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },

  primaryButtonDisabled: {
    backgroundColor: '#7FAEA2',
    shadowOpacity: 0.08,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  footerText: {
    fontSize: 12,
    color: '#87928E',
    marginHorizontal: 10,
    fontWeight: '700',
  },

  bottomHint: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: '#87928E',
  },
});
