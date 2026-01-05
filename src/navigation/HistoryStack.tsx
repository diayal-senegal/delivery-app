import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/History/HistoryScreen';
import HistoryDeliveryDetailScreen from '../screens/History/HistoryDeliveryDetailScreen';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#e74c3c' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="HistoryList" 
        component={HistoryScreen}
        options={{ title: 'Historique' }}
      />
      <Stack.Screen 
        name="HistoryDeliveryDetail" 
        component={HistoryDeliveryDetailScreen}
        options={{ title: 'Détail livraison' }}
      />
    </Stack.Navigator>
  );
}