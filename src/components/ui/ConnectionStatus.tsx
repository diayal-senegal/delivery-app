import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const fadeAnim = new Animated.Value(0);

  // Simulation pour Expo Go
  useEffect(() => {
    console.log('Statut de connexion simulé (toujours connecté)');
    onConnectionChange?.(true);
  }, []);

  // Ne rien afficher en mode simulation
  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 1000,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});