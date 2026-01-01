import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      Alert.alert(
        'Compte temporairement bloqué',
        `Trop de tentatives échouées. Réessayez dans ${remainingTime} secondes.`
      );
      return;
    }

    setLoading(true);
    try {
      // Essayer d'abord avec le numéro tel quel
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
      
      if (result.locked) {
        Alert.alert(
          'Compte bloqué',
          'Trop de tentatives échouées. Votre compte est temporairement bloqué pour 5 minutes.'
        );
      } else if (result.remainingAttempts !== undefined) {
        Alert.alert(
          'Erreur de connexion',
          `Identifiants incorrects. ${result.remainingAttempts} tentative(s) restante(s).`
        );
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
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/logo-diayal.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Diayal</Text>
            <Text style={styles.subtitle}>Livraison Express</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Bienvenue ! 👋</Text>
              <Text style={styles.welcomeSubtext}>Connectez-vous pour commencer vos livraisons</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>📱 Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="+221 XX XXX XX XX"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔒 Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre mot de passe"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#999', '#666'] : ['#667eea', '#764ba2']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? '⏳ Connexion...' : '🚀 Se connecter'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <View style={styles.divider} />
              <Text style={styles.footerText}>Espace Coursier</Text>
              <View style={styles.divider} />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 12,
    fontWeight: '600',
  },
});