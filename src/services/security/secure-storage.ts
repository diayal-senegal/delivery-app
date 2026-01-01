import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async setEncrypted(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(value);
    await SecureStore.setItemAsync(key, encrypted);
  },

  async getDecrypted(key: string): Promise<string | null> {
    const encrypted = await SecureStore.getItemAsync(key);
    if (!encrypted) return null;
    return await this.decrypt(encrypted);
  },

  async encrypt(data: string): Promise<string> {
    return Buffer.from(data).toString('base64');
  },

  async decrypt(data: string): Promise<string> {
    return Buffer.from(data, 'base64').toString('utf-8');
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
