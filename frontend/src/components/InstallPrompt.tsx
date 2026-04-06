/**
 * Install Prompt Component
 * Shows a banner prompting users to install the PWA
 */
import { useState, useEffect } from 'react';
import { setupInstallPrompt, isPWA, isInstallSupported } from '../utils/pwa';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installFn, setInstallFn] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Don't show if already installed or not supported
    if (isPWA() || !isInstallSupported()) {
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Setup install prompt
    setupInstallPrompt((promptFn) => {
      setInstallFn(() => promptFn);
      setShowPrompt(true);
    });
  }, []);

  const handleInstall = async () => {
    if (installFn) {
      await installFn();
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install Thermi-Nator</h3>
          <p className="text-sm text-blue-100 mb-3">
            Install the app for quick access and offline support. Works just like a native app!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-200 hover:text-white"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
