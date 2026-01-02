import apiClient from './client';
import { LoginCredentials, AuthResponse, RefreshTokenResponse, Courier } from '../../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const endpoints = [
      '/auth/login',
      '/courier/auth/login',
      '/auth/courier/login', 
      '/couriers/login'
    ];
    
    let lastError: any;
    
    for (const endpoint of endpoints) {
      try {
        console.log('[AUTH] Tentative login:', endpoint, 'Phone:', credentials.phone);
        const { data } = await apiClient.post(endpoint, credentials);
        console.log('[AUTH] Login réussi sur:', endpoint);
        return data;
      } catch (error: any) {
        console.log('[AUTH] Échec sur:', endpoint, 'Status:', error.response?.status);
        lastError = error;
        if (error.response?.status === 401) {
          throw error;
        }
      }
    }
    
    throw lastError;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await apiClient.post('/courier/auth/refresh', { refreshToken });
    return data;
  },

  async getMe(): Promise<Courier> {
    const { data } = await apiClient.get('/courier/me');
    return data;
  },

  async setAvailability(availability: 'available' | 'busy' | 'offline'): Promise<void> {
    await apiClient.post('/courier/me/availability', { availability });
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.log('Logout API error:', error);
    }
  },
};