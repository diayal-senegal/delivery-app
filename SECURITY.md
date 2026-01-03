# 🔐 Système de Sécurité - Diayal Delivery App

Documentation complète du système d'authentification et d'activation par OTP.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture de sécurité](#architecture-de-sécurité)
3. [Workflow d'activation](#workflow-dactivation)
4. [Authentification JWT](#authentification-jwt)
5. [Validation mot de passe](#validation-mot-de-passe)
6. [API Endpoints](#api-endpoints)
7. [Configuration](#configuration)
8. [Tests](#tests)
9. [Production](#production)

---

## 🎯 Vue d'ensemble

Le système implémente une sécurité à plusieurs niveaux :

- ✅ **Activation par OTP SMS** - Vérification du numéro de téléphone
- ✅ **Mot de passe robuste** - 8 caractères minimum avec complexité
- ✅ **JWT avec expiration** - Access token (1h) + Refresh token (7 jours)
- ✅ **Blacklist tokens** - Révocation lors de la déconnexion
- ✅ **Token versioning** - Invalidation globale possible
- ✅ **Rate limiting** - Protection contre brute force

---

## 🏗️ Architecture de sécurité

### Modèle Courier

```javascript
{
  // Informations de base
  name: String,
  email: String,
  phone: String,
  role: "courier",
  
  // Sécurité
  password: String (optionnel jusqu'à activation),
  passwordSet: Boolean,
  status: "pending_activation" | "active" | "inactive" | "suspended",
  
  // Activation OTP
  activationOTP: {
    code: String (6 chiffres),
    expiresAt: Date (24h),
    attempts: Number (max 3)
  },
  
  // JWT
  refreshToken: String,
  tokenVersion: Number,
  invalidatedTokens: [{ token, invalidatedAt }],
  
  // Dates
  activatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Workflow d'activation

### 1️⃣ Admin crée le coursier

```javascript
// Dashboard Admin
POST /admin/couriers
{
  "name": "Moussa Diop",
  "email": "moussa@example.com",
  "phone": "771234567",
  "vehicle": { "type": "scooter" }
}

// Backend génère automatiquement
{
  "status": "pending_activation",
  "passwordSet": false,
  "activationOTP": {
    "code": "847293",
    "expiresAt": "2025-01-25T10:00:00Z",
    "attempts": 0
  }
}

// SMS envoyé (en production)
"Bienvenue chez Diayal ! Votre code d'activation : 847293 (valide 24h)"
```

### 2️⃣ Coursier essaie de se connecter

```javascript
// App Mobile
POST /auth/login
{
  "phone": "771234567",
  "password": "test"
}

// Réponse 403
{
  "message": "Compte non activé",
  "requiresActivation": true,
  "phone": "771234567"
}

// → Redirection vers écran Activation
```

### 3️⃣ Vérification OTP

```javascript
// App Mobile
POST /auth/verify-otp
{
  "phone": "771234567",
  "otp": "847293"
}

// Réponse 200
{
  "message": "Code OTP vérifié",
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "courierId": "6958783c3936e974238b9158"
}

// → Redirection vers écran Définir mot de passe
```

### 4️⃣ Définition mot de passe

```javascript
// App Mobile
POST /auth/set-password
{
  "phone": "771234567",
  "password": "Secure@123",
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Validation backend
✓ Minimum 8 caractères
✓ Au moins 1 majuscule
✓ Au moins 1 chiffre
✓ Au moins 1 caractère spécial

// Réponse 200
{
  "message": "Compte activé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "courier": {
    "id": "6958783c3936e974238b9158",
    "name": "Moussa Diop",
    "phone": "771234567",
    "status": "active"
  }
}

// → Connexion automatique
```

---

## 🔑 Authentification JWT

### Structure des tokens

**Access Token (1h)**
```json
{
  "id": "6958783c3936e974238b9158",
  "type": "access",
  "version": 0,
  "iat": 1767407381,
  "exp": 1767410981
}
```

**Refresh Token (7 jours)**
```json
{
  "id": "6958783c3936e974238b9158",
  "type": "refresh",
  "version": 0,
  "iat": 1767407381,
  "exp": 1768012181
}
```

### Refresh automatique

```javascript
// App Mobile - authManager.service.ts
scheduleTokenRefresh(expiresIn) {
  const refreshTime = (expiresIn - 300) * 1000; // 5 min avant expiration
  setTimeout(() => this.refreshToken(), refreshTime);
}

// Backend
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Réponse
{
  "token": "nouveau_access_token",
  "refreshToken": "nouveau_refresh_token",
  "expiresIn": 3600
}
```

### Déconnexion avec blacklist

```javascript
// App Mobile
POST /auth/logout
Headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

// Backend ajoute le token à la blacklist
{
  invalidatedTokens: [
    { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", invalidatedAt: "2025-01-24T10:00:00Z" }
  ],
  refreshToken: null
}

// Nettoyage auto des tokens > 7 jours
```

---

## 🔒 Validation mot de passe

### Règles obligatoires

| Règle | Regex | Exemple |
|-------|-------|---------|
| Minimum 8 caractères | `.{8,}` | `Secure@123` ✓ |
| Au moins 1 majuscule | `[A-Z]` | `Secure@123` ✓ |
| Au moins 1 chiffre | `[0-9]` | `Secure@123` ✓ |
| Au moins 1 caractère spécial | `[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]` | `Secure@123` ✓ |

### Validation backend

```javascript
// utils/passwordValidator.js
validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) errors.push('Minimum 8 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins 1 majuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins 1 chiffre');
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push('Au moins 1 caractère spécial');
  }
  
  return { valid: errors.length === 0, errors };
}
```

### Validation mobile

```typescript
// utils/validation.ts
export const validateStrongPassword = (password: string) => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Minimum 8 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins 1 majuscule (A-Z)');
  if (!/[0-9]/.test(password)) errors.push('Au moins 1 chiffre (0-9)');
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push('Au moins 1 caractère spécial (!@#$%...)');
  }
  
  return { valid: errors.length === 0, errors };
};
```

---

## 🌐 API Endpoints

### Authentification

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/auth/login` | POST | ❌ | Connexion coursier |
| `/auth/refresh` | POST | ❌ | Renouveler tokens |
| `/auth/logout` | POST | ✅ | Déconnexion + blacklist |
| `/auth/verify-otp` | POST | ❌ | Vérifier code OTP |
| `/auth/set-password` | POST | ❌ | Définir mot de passe |
| `/auth/resend-otp` | POST | ❌ | Renvoyer code OTP |

### Exemples de requêtes

**Login**
```bash
curl -X POST http://localhost:5000/api/delivery/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"771234567","password":"Secure@123"}'
```

**Verify OTP**
```bash
curl -X POST http://localhost:5000/api/delivery/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"771234567","otp":"847293"}'
```

**Set Password**
```bash
curl -X POST http://localhost:5000/api/delivery/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"771234567","password":"Secure@123","tempToken":"..."}'
```

---

## ⚙️ Configuration

### Variables d'environnement

```bash
# Backend .env
JWT_SECRET=diayal-delivery-jwt-secret-2024-production
JWT_REFRESH_SECRET=diayal-delivery-refresh-secret-2024-production
NODE_ENV=development

# En production, utiliser des secrets forts
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### Durées de validité

```javascript
// utils/jwtHelper.js
const ACCESS_TOKEN_EXPIRY = '1h';   // 3600 secondes
const REFRESH_TOKEN_EXPIRY = '7d';  // 604800 secondes
```

### Limites OTP

```javascript
// controllers/delivery/deliveryController.js
const OTP_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures
const MAX_OTP_ATTEMPTS = 3;
const OTP_LENGTH = 6;
```

---

## 🧪 Tests

### Test en développement (sans SMS)

```javascript
// 1. Créer coursier dans MongoDB
db.couriers.insertOne({
  name: "Test OTP",
  email: "test@diayal.sn",
  phone: "770000001",
  status: "pending_activation",
  passwordSet: false
});

// 2. Renvoyer OTP
POST /auth/resend-otp { "phone": "770000001" }
// → Regarder logs backend: 📱 SMS OTP pour 770000001: 847293

// 3. Vérifier OTP
POST /auth/verify-otp { "phone": "770000001", "otp": "847293" }

// 4. Définir mot de passe
POST /auth/set-password { 
  "phone": "770000001", 
  "password": "Test@123",
  "tempToken": "..."
}
```

### Test avec Postman

1. Importer collection : `docs/postman/Diayal-Delivery-Auth.json`
2. Configurer environnement : `BASE_URL=http://localhost:5000/api/delivery`
3. Exécuter workflow : Login → Verify OTP → Set Password

---

## 🚀 Production

### Intégration SMS

**Option 1 : Orange API (Sénégal)**
```javascript
// services/sms/orangeSMS.js
async function sendOTP(phone, code) {
  const response = await axios.post('https://api.orange.com/smsmessaging/v1/outbound/tel:+221XXXXXXXX/requests', {
    outboundSMSMessageRequest: {
      address: `tel:+221${phone}`,
      senderAddress: 'tel:+221XXXXXXXX',
      outboundSMSTextMessage: {
        message: `Votre code Diayal : ${code} (valide 24h)`
      }
    }
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.ORANGE_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}
```

**Option 2 : Twilio**
```javascript
// services/sms/twilioSMS.js
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendOTP(phone, code) {
  await client.messages.create({
    body: `Votre code Diayal : ${code} (valide 24h)`,
    from: process.env.TWILIO_PHONE,
    to: `+221${phone}`
  });
}
```

### Sécurité production

```javascript
// 1. HTTPS obligatoire
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// 2. Rate limiting
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: 'Trop de tentatives de connexion'
});
app.use('/auth/login', loginLimiter);

// 3. Helmet pour headers sécurisés
const helmet = require('helmet');
app.use(helmet());

// 4. Secrets dans vault (AWS Secrets Manager, Azure Key Vault)
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const secrets = await secretsManager.getSecretValue({ SecretId: 'diayal/jwt' }).promise();
```

### Monitoring

```javascript
// Logs d'audit
logger.info('OTP_SENT', { phone, timestamp: new Date() });
logger.info('OTP_VERIFIED', { phone, courierId, timestamp: new Date() });
logger.info('PASSWORD_SET', { courierId, timestamp: new Date() });
logger.warn('OTP_FAILED_ATTEMPT', { phone, attempts, timestamp: new Date() });
logger.error('OTP_MAX_ATTEMPTS', { phone, timestamp: new Date() });
```

---

## 📊 Statistiques de sécurité

| Métrique | Valeur |
|----------|--------|
| Longueur minimale mot de passe | 8 caractères |
| Complexité mot de passe | 4 critères obligatoires |
| Durée validité access token | 1 heure |
| Durée validité refresh token | 7 jours |
| Durée validité OTP | 24 heures |
| Tentatives OTP max | 3 |
| Longueur OTP | 6 chiffres |
| Nettoyage blacklist | Automatique (>7j) |

---

## 🔗 Ressources

- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Orange API SMS](https://developer.orange.com/apis/sms-senegal/)
- [Twilio SMS API](https://www.twilio.com/docs/sms)

---

**Dernière mise à jour** : 24 janvier 2025  
**Version** : 1.0.0  
**Auteur** : Équipe Diayal
