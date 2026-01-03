import apiClient from './client';
import { LoginCredentials, AuthResponse, RefreshTokenResponse, Courier } from '../../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const endpoints = [
      '/auth/login'
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
        
        // Si 403 avec requiresActivation, propager l'erreur
        if (error.response?.status === 403 && error.response?.data?.requiresActivation) {
          throw error;
        }
        
        if (error.response?.status === 401) {
          throw error;
        }
      }
    }
    
    throw lastError;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
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

  async verifyOTP(phone: string, otp: string): Promise<{ message: string; tempToken: string; courierId: string }> {
    const { data } = await apiClient.post('/auth/verify-otp', { phone, otp });
    return data;
  },

  async setPassword(phone: string, password: string, tempToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/set-password', { phone, password, tempToken });
    return data;
  },

  async resendOTP(phone: string): Promise<{ message: string; otp?: string }> {
    const { data } = await apiClient.post('/auth/resend-otp', { phone });
    return data;
  },
};