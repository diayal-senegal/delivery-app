# Application Mobile de Livraison - Sénégal

Application React Native pour les coursiers du système de livraison au Sénégal.

## 🚀 Fonctionnalités

### ✅ Implémentées
- **Authentification** : Connexion sécurisée des coursiers
- **Gestion des tâches** : Liste des livraisons assignées et en cours
- **Suivi GPS** : Géolocalisation en temps réel avec permissions
- **Photos de livraison** : Capture et validation des preuves de livraison
- **Notifications** : Alertes locales et mises à jour de statut
- **Mode hors-ligne** : Synchronisation automatique des actions
- **Zones Sénégal** : Configuration pour Dakar et ses quartiers

### 📱 Écrans principaux
- **TasksScreen** : Liste des livraisons avec filtres (En cours/À venir)
- **DeliveryDetailScreen** : Détails complets avec actions (appel, navigation, photo)
- **DeliveryIssueScreen** : Signalement de problèmes
- **TestScreen** : Tests de validation des fonctionnalités

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
```

## 📦 Dépendances principales

- **React Native 0.81.5** : Framework mobile
- **Expo SDK 54** : Outils de développement
- **React Navigation 7** : Navigation entre écrans
- **Expo Location** : Géolocalisation
- **Expo Notifications** : Notifications push/locales
- **Expo Image Picker** : Capture de photos
- **Axios** : Client HTTP
- **AsyncStorage** : Stockage local

## 🗺️ Configuration Sénégal

### Zones de livraison supportées :
- Dakar Plateau
- Dakar Médina  
- Parcelles Assainies
- Liberté
- Grand Yoff
- Ouakam
- Pikine Centre
- Guédiawaye
- Rufisque

### Coordonnées de référence :
- **Latitude** : 14.6928°N
- **Longitude** : 17.4467°W

## 🔧 Services

### LocationService
- Suivi GPS en temps réel
- Permissions automatiques
- Mise à jour toutes les 30 secondes

### NotificationService  
- Notifications locales
- Alertes de changement de statut
- Configuration des canaux

### CameraService
- Capture photo/galerie
- Compression automatique
- Validation des images

### OfflineService
- Queue des actions hors-ligne
- Synchronisation automatique
- Persistance locale

## 🧪 Tests

Utilisez l'écran de test intégré pour valider :
- ✅ Géolocalisation et permissions
- ✅ Notifications locales
- ✅ Capture de photos
- ✅ Stockage hors-ligne

## 🔗 Intégration Backend

L'application se connecte à l'API backend via :
- **Base URL** : `http://localhost:3000/api` (dev)
- **Endpoints** : `/couriers/me/deliveries`, `/deliveries/{id}/status`
- **Authentification** : Token JWT stocké de manière sécurisée

## 📱 Statuts de livraison

1. **ASSIGNED** → Assignée au coursier
2. **PICKUP_PENDING** → En attente de récupération  
3. **PICKED_UP** → Récupérée
4. **IN_TRANSIT** → En transit
5. **DELIVERED** → Livrée (avec photo)
6. **FAILED** → Échec de livraison

## 🚨 Gestion d'erreurs

- Retry automatique des requêtes
- Mode hors-ligne avec synchronisation
- Alertes utilisateur explicites
- Logs détaillés pour le debug