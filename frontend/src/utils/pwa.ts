/**
 * PWA Utilities - Service Worker Registration and Install Prompt
 */

let deferredPrompt: any = null;

/**
 * Register service worker
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Setup install prompt handler
 */
export function setupInstallPrompt(
  onInstallAvailable: (prompt: () => Promise<void>) => void
): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default install prompt
    e.preventDefault();
    deferredPrompt = e;

    // Notify that install is available
    onInstallAvailable(async () => {
      if (!deferredPrompt) return;

      // Show install prompt
      deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);

      // Clear the prompt
      deferredPrompt = null;
    });
  });

  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if install is supported
 */
export function isInstallSupported(): boolean {
  return 'beforeinstallprompt' in window || (window.navigator as any).standalone !== undefined;
}
