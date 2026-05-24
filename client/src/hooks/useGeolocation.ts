/**
 * useGeolocation Hook
 * ขอพิกัด GPS แบบ real-time ผ่าน Geolocation API
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

export interface UseGeolocationReturn {
  position: GeoPosition | null;
  status: GeoStatus;
  errorMessage: string | null;
  requestLocation: () => void;
  reset: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timeoutIdRef.current !== null) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    // Clear any existing watchers
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timeoutIdRef.current !== null) clearTimeout(timeoutIdRef.current);

    let bestPosition: GeolocationPosition | null = null;

    const finishWatch = (finalPos: GeolocationPosition | null) => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      if (finalPos) {
        setPosition({
          latitude: finalPos.coords.latitude,
          longitude: finalPos.coords.longitude,
          accuracy: finalPos.coords.accuracy,
        });
        setStatus('success');
        setErrorMessage(null);
      } else {
        setStatus('error');
        setErrorMessage('ยังระบุตำแหน่งได้ไม่แม่นยำ กรุณาลองใหม่');
      }
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      // Keep track of the most accurate position received
      if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
        bestPosition = pos;
      }

      // If accuracy is good enough (<= 40 meters), stop watching and use it immediately
      if (pos.coords.accuracy <= 40) {
        finishWatch(bestPosition);
      }
      // Otherwise, we keep watching. The UI will show "loading" until the timeout hits.
    };

    const handleError = (err: GeolocationPositionError) => {
      // If we already have a reasonably good position, just use it rather than failing completely
      if (bestPosition) {
        finishWatch(bestPosition);
        return;
      }

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      switch (err.code) {
        case err.PERMISSION_DENIED:
          setStatus('denied');
          setErrorMessage('กรุณาเปิดตำแหน่งและอนุญาตให้ระบบเข้าถึงตำแหน่ง');
          break;
        case err.POSITION_UNAVAILABLE:
          setStatus('error');
          setErrorMessage('ไม่สามารถรับตำแหน่งได้ อาจอยู่ในที่อับสัญญาณ');
          break;
        case err.TIMEOUT:
          setStatus('error');
          setErrorMessage('ใช้เวลาระบุตำแหน่งนานเกินไป');
          break;
        default:
          setStatus('error');
          setErrorMessage('เกิดข้อผิดพลาดในการดึงตำแหน่ง');
      }
    };

    // Start watching position. Using maximumAge: 0 forces the device to get fresh data, bypassing cache.
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 12000,  // slightly longer than our custom 10s timeout to avoid race
        maximumAge: 0, 
      }
    );

    // Accept the best location found after 10 seconds even if accuracy threshold not met.
    // This fires before watchPosition's own 12s timeout, so we control the UX.
    timeoutIdRef.current = setTimeout(() => {
      if (bestPosition) {
        finishWatch(bestPosition);
      } else {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setStatus('error');
        setErrorMessage('ไม่สามารถระบุตำแหน่งได้ ลองไปที่โล่งแล้วกดใหม่');
      }
    }, 10000);

  }, []);

  const reset = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setPosition(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return { position, status, errorMessage, requestLocation, reset };
}
