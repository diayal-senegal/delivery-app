import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../services/api/auth.api';
import { authManager } from '../../services/auth/auth-manager.service';
import { Courier } from '../../types';
import { theme } from '../../theme/theme';

export default function ProfileScreen({ navigation }: any) {
  const [courier, setCourier] = useState<Courier | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    loadProfile();
    const interval = setInterval(checkAccountStatus, 60000); // Vérifier toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authApi.getMe();
      setCourier(data);
      setIsAvailable(data.availability === 'available');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    }
  };

  const checkAccountStatus = async () => {
    try {
      const { valid, reason } = await authManager.checkAccountStatus();
      if (!valid) {
        Alert.alert(
          'Compte inaccessible',
          reason || 'Votre compte n\'est plus accessible',
          [{ text: 'OK', onPress: handleForceLogout }]
        );
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const toggleAvailability = async (value: boolean) => {
    try {
      const newAvailability = value ? 'available' : 'offline';
      await authApi.setAvailability(newAvailability);
      setIsAvailable(value);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de changer la disponibilité');
    }
  };

  const handleForceLogout = async () => {
    await authManager.forceLogout();
    navigation.replace('AuthStack');
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: handleForceLogout,
        },
      ]
    );
  };

  if (!courier) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const getStatusBadge = () => {
    const statusConfig = {
      active: { color: theme.colors.success, label: '✓ Actif' },
      inactive: { color: theme.colors.textLight, label: '○ Inactif' },
      suspended: { color: theme.colors.warning, label: '⚠ Suspendu' },
      blocked: { color: theme.colors.danger, label: '✕ Bloqué' },
    };
    return statusConfig[courier.status || 'active'] || statusConfig.active;
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.primaryFull}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{courier.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{courier.name}</Text>
        <Text style={styles.phone}>{courier.phone}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
          <Text style={styles.statusText}>{statusBadge.label}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Disponible pour livraisons</Text>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#ddd', true: theme.colors.success }}
              thumbColor="#fff"
              disabled={courier.status !== 'active' && courier.status !== undefined}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>📊 Mes statistiques</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>⚙️ Paramètres</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>❓ Aide & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.logoutGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.logoutText}>🚪 Déconnexion</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
    color: '#fff',
  },
  phone: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statusBadge: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  logoutGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: theme.fontSize.md,
    color: '#fff',
    fontWeight: '800',
  },
});