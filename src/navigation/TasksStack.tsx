import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TasksScreen from '../screens/Tasks/TasksScreen';
import DeliveryDetailScreen from '../screens/Tasks/DeliveryDetailScreen';
import DeliveryIssueScreen from '../screens/Tasks/DeliveryIssueScreen';
import AcceptDeliveryScreen from '../screens/Tasks/AcceptDeliveryScreen';
import DeliveryFailureScreen from '../screens/Tasks/DeliveryFailureScreen';
import DeliveryValidationScreen from '../screens/Tasks/DeliveryValidationScreen';
import ProofOfDeliveryScreen from '../screens/Tasks/ProofOfDeliveryScreen';
import TestScreen from '../screens/Test/TestScreen';

const Stack = createNativeStackNavigator();

export default function TasksStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#e74c3c' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="TasksList" 
        component={TasksScreen}
        options={{ title: 'Mes livraisons' }}
      />
      <Stack.Screen 
        name="DeliveryDetail" 
        component={DeliveryDetailScreen}
        options={{ title: 'Détail livraison' }}
      />
      <Stack.Screen 
        name="AcceptDelivery" 
        component={AcceptDeliveryScreen}
        options={{ title: 'Accepter la mission' }}
      />
      <Stack.Screen 
        name="DeliveryValidation" 
        component={DeliveryValidationScreen}
        options={{ title: 'Validation livraison' }}
      />
      <Stack.Screen 
        name="ProofOfDelivery" 
        component={ProofOfDeliveryScreen}
        options={{ title: 'Preuve de livraison' }}
      />
      <Stack.Screen 
        name="DeliveryFailure" 
        component={DeliveryFailureScreen}
        options={{ title: 'Échec de livraison' }}
      />
      <Stack.Screen 
        name="DeliveryIssue" 
        component={DeliveryIssueScreen}
        options={{ title: 'Signaler un problème' }}
      />
      <Stack.Screen 
        name="Test" 
        component={TestScreen}
        options={{ title: 'Tests fonctionnalités' }}
      />
    </Stack.Navigator>
  );
}