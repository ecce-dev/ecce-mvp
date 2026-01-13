'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isPWA: boolean;
}

const getDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') {
    return 'desktop'; // Default for SSR
  }

  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1256) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

const checkIsPWA = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // Default for SSR
  }

  // Check if running as PWA
  // Method 1: Check if standalone mode (iOS)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Method 2: Check if running in fullscreen mode (Android)
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  
  // Method 3: Check if navigator.standalone exists (iOS Safari)
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // Method 4: Check if document.referrer is empty and window.location is not the same as the referrer
  // This is a common pattern for PWAs
  const isPWAReferrer = window.matchMedia('(display-mode: minimal-ui)').matches;
  
  return isStandalone || isFullscreen || isIOSStandalone || isPWAReferrer;
};

export function useDevice(): DeviceInfo {
  // Start with hydration-safe defaults that match SSR
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceType: 'desktop',
    isMobile: false,
    isPWA: false,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const deviceType = getDeviceType();
      setDeviceInfo({
        deviceType,
        isMobile: deviceType === 'mobile' || deviceType === 'tablet',
        isPWA: checkIsPWA(),
      });
    };

    // Set initial values after mount (client-side only)
    updateDeviceInfo();

    // Listen for window resize events
    window.addEventListener('resize', updateDeviceInfo);

    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

