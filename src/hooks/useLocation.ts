import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { locationService } from '../services/location/location.service';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permission = await locationService.requestPermissions();
    setHasPermission(permission);
    setLoading(false);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    const currentLocation = await locationService.getCurrentLocation();
    setLocation(currentLocation);
    setLoading(false);
    return currentLocation;
  };

  const startTracking = async () => {
    if (!hasPermission) {
      await checkPermissions();
      if (!hasPermission) return;
    }

    await locationService.startTracking();
    setIsTracking(true);
  };

  const stopTracking = () => {
    locationService.stopTracking();
    setIsTracking(false);
  };

  return {
    location,
    isTracking,
    hasPermission,
    loading,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
};