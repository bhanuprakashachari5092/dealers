import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useDistanceCalculator } from "./useDistanceCalculator";

export interface PreciseCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export function usePreciseLocation(dealerId?: string) {
  const [coords, setCoords] = useState<PreciseCoords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingForPrecise, setWaitingForPrecise] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | "unknown">("unknown");

  const { getDistance } = useDistanceCalculator();
  const lastUpdateTimestampRef = useRef<number>(0);
  const lastSavedCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = async () => {
    setIsLocating(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setError("Location permission was denied. Please enable location access in settings.");
        setIsLocating(false);
        return;
      }

      // Check current position first (quick initial check)
      try {
        const currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        handleLocationUpdate(currentLoc);
      } catch (initialErr) {
        console.warn("Initial location fetch failed, relying on watchPositionAsync...", initialErr);
        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown) {
            handleLocationUpdate(lastKnown);
          }
        } catch (fallbackErr) {
          // Ignore fallback errors
        }
      }

      // Watch position continuously
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Check updates every 5 seconds locally
          distanceInterval: 1, // Capture small movements to check if they exceed 10m
        },
        (locationData) => {
          handleLocationUpdate(locationData);
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resolve GPS coordinates.";
      console.warn("Failed to get location:", message);
      setError(message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleLocationUpdate = async (locationData: Location.LocationObject) => {
    const { latitude, longitude, accuracy } = locationData.coords;
    const timestamp = locationData.timestamp;

    // Filter by accuracy: must be <= 20 meters
    if (accuracy && accuracy > 20) {
      setWaitingForPrecise(true);
      setError("Waiting for precise GPS location (accuracy must be within 20 meters)...");
      return;
    }

    setWaitingForPrecise(false);
    setError(null);
    setCoords({ latitude, longitude, accuracy, timestamp });

    // Save to Firestore if dealerId is provided and movement/throttle criteria are met
    if (dealerId) {
      const now = Date.now();
      const elapsedSeconds = (now - lastUpdateTimestampRef.current) / 1000;

      // Throttle database writes: must wait at least 15 seconds
      if (lastSavedCoordsRef.current && elapsedSeconds < 15) {
        return;
      }

      // Movement threshold: must have moved more than 10 meters
      if (lastSavedCoordsRef.current) {
        const distanceMoved = getDistance(
          lastSavedCoordsRef.current.latitude,
          lastSavedCoordsRef.current.longitude,
          latitude,
          longitude
        );

        if (distanceMoved <= 10) {
          return;
        }
      }

      // Write to Firestore
      try {
        const dealerRef = doc(db, "dealers", dealerId);
        await updateDoc(dealerRef, {
          latitude,
          longitude,
          lastLocationUpdate: new Date().toISOString(),
        });
        console.log(
          `[PreciseLocation] Updated dealer coordinates (accuracy: ${accuracy}m, elapsed: ${elapsedSeconds}s):`,
          latitude,
          longitude
        );

        // Update references
        lastUpdateTimestampRef.current = now;
        lastSavedCoordsRef.current = { latitude, longitude };
      } catch (firestoreErr) {
        console.warn("Failed to update dealer coordinates in Firestore:", firestoreErr);
      }
    }
  };

  const stopTracking = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsLocating(false);
  };

  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [dealerId]);

  const retry = () => {
    startTracking();
  };

  return {
    coords,
    isLocating,
    error,
    waitingForPrecise,
    permissionStatus,
    retry,
    stopTracking,
    startTracking,
  };
}
