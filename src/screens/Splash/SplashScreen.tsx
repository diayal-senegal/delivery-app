import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { tokenStore } from '../../services/storage/token.store';
import { authManager } from '../../services/auth/auth-manager.service';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await tokenStore.get();
      
      if (token) {
        try {
          const { valid } = await authManager.checkAccountStatus();
          
          setTimeout(() => {
            if (valid) {
              navigation.replace('AppTabs');
            } else {
              tokenStore.remove();
              navigation.replace('AuthStack');
            }
          }, 2000);
        } catch (error) {
          await tokenStore.remove();
          setTimeout(() => {
            navigation.replace('AuthStack');
          }, 2000);
        }
      } else {
        setTimeout(() => {
          navigation.replace('AuthStack');
        }, 2000);
      }
    } catch (error) {
      await tokenStore.remove();
      setTimeout(() => {
        navigation.replace('AuthStack');
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/1.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      <View style={styles.brandContainer}>
        <Text style={styles.brandName}>Diayal</Text>
        <Text style={styles.brandTagline}>Livraison rapide et fiable</Text>
      </View>
    </View>
  );
}

const ACCENT = '#059473';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 320,
    height: 200,
    marginBottom: 30,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0E1412',
    marginBottom: 8,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 15,
    color: '#5C6B66',
    fontWeight: '600',
  },
});