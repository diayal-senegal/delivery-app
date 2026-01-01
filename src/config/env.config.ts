export const ENV = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://192.168.1.119:5000/api/delivery',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  LOGIN_LOCKOUT_DURATION: parseInt(process.env.LOGIN_LOCKOUT_DURATION || '300000'),
  IS_DEV: __DEV__,
};
