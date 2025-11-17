import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PWAInstallPrompt = () => {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Don't show prompt if already installed
    if (standalone) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after a delay (don't show immediately)
      setTimeout(() => {
        // Check if user has dismissed it before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show custom prompt after delay
    if (ios && !standalone) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className={`rounded-lg shadow-2xl border p-4 animate-slide-up ${
        isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>Install App</h3>
              <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>Add to home screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={isDark ? 'text-dark-text-secondary hover:text-dark-text' : 'text-gray-400 hover:text-gray-600'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isIOS ? (
          <div className={`text-sm space-y-2 ${isDark ? 'text-dark-text' : 'text-gray-700'}`}>
            <p>To install this app on your iPhone:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Tap the Share button (
                <svg className="inline h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                ) in Safari
              </li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm ${isDark ? 'text-dark-text' : 'text-gray-700'}`}>
              Install the app for a better experience with offline support and quick access.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className={`px-4 py-2 text-sm font-medium ${
                  isDark ? 'text-dark-text-secondary hover:text-dark-text' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
