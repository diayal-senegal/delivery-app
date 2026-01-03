import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { tokenStore } from '../../services/storage/token.store';
import { authManager } from '../../services/auth/auth-manager.service';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // IMPORTANT: Nettoyer les anciens tokens si l'URL a changé
      // Cette vérification force une reconnexion après changement d'URL
      const token = await tokenStore.get();
      
      if (token) {
        // Vérifier si le compte est valide avec la nouvelle URL
        try {
          const { valid } = await authManager.checkAccountStatus();
          
          setTimeout(() => {
            if (valid) {
              navigation.replace('AppTabs');
            } else {
              // Token invalide, nettoyer et aller au login
              tokenStore.remove();
              navigation.replace('AuthStack');
            }
          }, 1500);
        } catch (error) {
          // Erreur de validation (probablement 401), nettoyer
          await tokenStore.remove();
          setTimeout(() => {
            navigation.replace('AuthStack');
          }, 1500);
        }
      } else {
        setTimeout(() => {
          navigation.replace('AuthStack');
        }, 1500);
      }
    } catch (error) {
      // En cas d'erreur, nettoyer et aller au login
      await tokenStore.remove();
      setTimeout(() => {
        navigation.replace('AuthStack');
      }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/logo-diayal.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#e74c3c" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  loader: {
    marginTop: 20,
  },
});