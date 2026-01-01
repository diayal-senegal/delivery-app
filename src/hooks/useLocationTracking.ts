import { useState, useEffect } from 'react';
import { locationTrackerService } from '../services/location/location-tracker.service';

export const useLocationTracking = (deliveryId?: string) => {
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (locationTrackerService.isTracking()) {
        setDistance(locationTrackerService.getTotalDistance());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startTracking = async () => {
    if (!deliveryId) return;
    await locationTrackerService.startTracking(deliveryId);
    setIsTracking(true);
  };

  const stopTracking = async () => {
    await locationTrackerService.stopTracking();
    setIsTracking(false);
    setDistance(0);
  };

  return {
    isTracking,
    distance,
    startTracking,
    stopTracking,
    getHistory: () => locationTrackerService.getLocationHistory(),
  };
};
