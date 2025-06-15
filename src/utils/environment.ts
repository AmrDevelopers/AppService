// src/utils/environment.ts
export const isMobileApp = () => {
  return (window as any).Capacitor || 
         (window as any).cordova || 
         /Android|iPhone|iPad/i.test(navigator.userAgent);
};

export const isWeb = () => !isMobileApp();