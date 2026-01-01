import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env.config';

const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_UNTIL_KEY = 'lockout_until';

export const rateLimiter = {
  async checkLoginAttempts(): Promise<{ allowed: boolean; remainingTime?: number }> {
    const lockoutUntil = await AsyncStorage.getItem(LOCKOUT_UNTIL_KEY);
    
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil);
      const now = Date.now();
      
      if (now < lockoutTime) {
        return { allowed: false, remainingTime: Math.ceil((lockoutTime - now) / 1000) };
      } else {
        await this.resetAttempts();
      }
    }
    
    return { allowed: true };
  },

  async recordFailedAttempt(): Promise<{ locked: boolean; remainingAttempts?: number }> {
    const attemptsStr = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;
    const newAttempts = attempts + 1;

    if (newAttempts >= ENV.MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + ENV.LOGIN_LOCKOUT_DURATION;
      await AsyncStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutUntil.toString());
      await AsyncStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return { locked: true };
    }

    await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, newAttempts.toString());
    return { locked: false, remainingAttempts: ENV.MAX_LOGIN_ATTEMPTS - newAttempts };
  },

  async resetAttempts(): Promise<void> {
    await AsyncStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
  },
};
