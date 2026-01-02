import { tokenStore } from '../storage/token.store';
import { authApi } from '../api/auth.api';
import { Courier, UserRole, CourierStatus } from '../../types';

class AuthManager {
  private tokenExpiryTimer: NodeJS.Timeout | null = null;
  private currentCourier: Courier | null = null;

  async saveAuthData(token: string, refreshToken: string | undefined, expiresIn: number | undefined, courier: Courier): Promise<void> {
    await tokenStore.save(token, refreshToken);
    this.currentCourier = courier;
    if (expiresIn && refreshToken) {
      this.scheduleTokenRefresh(expiresIn);
    }
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.tokenExpiryTimer) clearTimeout(this.tokenExpiryTimer);
    
    const refreshTime = (expiresIn - 300) * 1000; // Refresh 5 min avant expiration
    this.tokenExpiryTimer = setTimeout(() => this.refreshToken(), refreshTime);
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await tokenStore.getRefreshToken();
      if (!refreshToken) return false;

      const { token, refreshToken: newRefreshToken, expiresIn } = await authApi.refreshToken(refreshToken);
      await tokenStore.save(token, newRefreshToken);
      this.scheduleTokenRefresh(expiresIn);
      return true;
    } catch (error) {
      console.error('Refresh token failed:', error);
      await this.forceLogout();
      return false;
    }
  }

  async validateCourierAccess(courier: Courier): Promise<{ valid: boolean; reason?: string }> {
    if (courier.role && courier.role.toUpperCase() !== 'COURIER') {
      return { valid: false, reason: 'Accès réservé aux coursiers uniquement' };
    }

    if (!courier.status) {
      return { valid: true };
    }

    if (courier.status === 'suspended') {
      return { valid: false, reason: 'Votre compte est suspendu. Contactez le support.' };
    }

    if (courier.status === 'blocked') {
      return { valid: false, reason: 'Votre compte est bloqué. Contactez le support.' };
    }

    if (courier.status === 'inactive') {
      return { valid: false, reason: 'Votre compte est inactif. Contactez le support.' };
    }

    return { valid: true };
  }

  async checkAccountStatus(): Promise<{ valid: boolean; reason?: string }> {
    try {
      const courier = await authApi.getMe();
      this.currentCourier = courier;
      return this.validateCourierAccess(courier);
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, reason: 'Session expirée' };
      }
      throw error;
    }
  }

  async forceLogout(): Promise<void> {
    if (this.tokenExpiryTimer) clearTimeout(this.tokenExpiryTimer);
    this.currentCourier = null;
    
    try {
      await authApi.logout();
    } catch (error) {
      console.log('Logout skipped');
    }
    
    await tokenStore.remove();
  }

  getCourier(): Courier | null {
    return this.currentCourier;
  }

  clearTimer(): void {
    if (this.tokenExpiryTimer) clearTimeout(this.tokenExpiryTimer);
  }
}

export const authManager = new AuthManager();
