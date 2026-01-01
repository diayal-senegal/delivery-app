export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://your-api.com/api',
  TIMEOUT: 10000,
};

export const LOCATION_CONFIG = {
  ACCURACY: 'high' as const,
  UPDATE_INTERVAL: 30000, // 30 secondes
  DISTANCE_FILTER: 10, // 10 mètres
};

export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'delivery-updates',
  CHANNEL_NAME: 'Mises à jour de livraison',
};

export const DELIVERY_ZONES = [
  'Dakar Plateau',
  'Dakar Médina',
  'Parcelles Assainies',
  'Liberté',
  'Grand Yoff',
  'Ouakam',
  'Pikine Centre',
  'Guédiawaye',
  'Rufisque',
];

export const DAKAR_COORDINATES = {
  latitude: 14.6928,
  longitude: -17.4467,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};