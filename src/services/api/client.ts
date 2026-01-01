import axios from 'axios';
import { tokenStore } from '../storage/token.store';
import { authManager } from '../auth/auth-manager.service';
import { ENV } from '../../config/env.config';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (ENV.IS_DEV) {
      console.log('[API] Request URL:', config.baseURL + config.url);
      console.log('[API] Request:', config.method?.toUpperCase(), config.url, token ? 'Token: ' + token.substring(0, 10) + '...' : 'No token');
    }
    return config;
  },
  (error) => {
    if (ENV.IS_DEV) {
      console.error('[API] Request error');
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (ENV.IS_DEV) {
      console.error('[API] Response error:', error.response?.status);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = await tokenStore.getRefreshToken();
      
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;

        try {
          const success = await authManager.refreshToken();
          if (success) {
            const newToken = await tokenStore.get();
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          } else {
            processQueue(error, null);
            await tokenStore.remove();
            await tokenStore.removeRefreshToken();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          await tokenStore.remove();
          await tokenStore.removeRefreshToken();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Pas de refresh token, nettoyer et rejeter
        await tokenStore.remove();
        await tokenStore.removeRefreshToken();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      await tokenStore.remove();
    }

    return Promise.reject(error);
  }
);

export default apiClient;