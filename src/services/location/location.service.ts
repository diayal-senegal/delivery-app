import * as Location from 'expo-location';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de localisation refusée');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erreur permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      console.error('Erreur localisation:', error);
      return null;
    }
  }

  async startTracking(): Promise<void> {
    if (this.isTracking) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    this.isTracking = true;
    console.log('Suivi GPS activé (mode simulation)');
  }

  stopTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
    console.log('Suivi GPS désactivé');
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();