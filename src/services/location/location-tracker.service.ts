import * as Location from 'expo-location';
import apiClient from '../api/client';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

class LocationTrackerService {
  private trackingInterval: NodeJS.Timeout | null = null;
  private currentDeliveryId: string | null = null;
  private locationHistory: LocationPoint[] = [];
  private readonly UPDATE_INTERVAL = 30000; // 30 secondes

  async startTracking(deliveryId: string): Promise<void> {
    this.currentDeliveryId = deliveryId;
    this.locationHistory = [];

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    await this.sendLocationUpdate();

    this.trackingInterval = setInterval(async () => {
      await this.sendLocationUpdate();
    }, this.UPDATE_INTERVAL);
  }

  async stopTracking(): Promise<void> {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.currentDeliveryId = null;
  }

  private async sendLocationUpdate(): Promise<void> {
    if (!this.currentDeliveryId) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const point: LocationPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
        accuracy: location.coords.accuracy || undefined,
      };

      this.locationHistory.push(point);

      await apiClient.post(`/courier/deliveries/${this.currentDeliveryId}/location`, {
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp,
        accuracy: point.accuracy,
      });
    } catch (error) {
      console.error('Erreur envoi position:', error);
    }
  }

  getLocationHistory(): LocationPoint[] {
    return [...this.locationHistory];
  }

  getTotalDistance(): number {
    if (this.locationHistory.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < this.locationHistory.length; i++) {
      total += this.calculateDistance(
        this.locationHistory[i - 1],
        this.locationHistory[i]
      );
    }
    return total;
  }

  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) *
      Math.cos(this.toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  isTracking(): boolean {
    return this.trackingInterval !== null;
  }

  getCurrentDeliveryId(): string | null {
    return this.currentDeliveryId;
  }
}

export const locationTrackerService = new LocationTrackerService();
