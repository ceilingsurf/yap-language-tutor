import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import offlineQueue from '../utils/offlineQueue';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineIndicator] Online');
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      console.log('[OfflineIndicator] Offline');
      setIsOnline(false);
    };

    const handleSyncStarted = () => {
      console.log('[OfflineIndicator] Sync started');
      setIsSyncing(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-sync-started', handleSyncStarted);

    // Update queue size periodically
    const interval = setInterval(() => {
      setQueueSize(offlineQueue.getQueueSize());
    }, 1000);

    // Initial queue size
    setQueueSize(offlineQueue.getQueueSize());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-sync-started', handleSyncStarted);
      clearInterval(interval);
    };
  }, []);

  const syncQueue = async () => {
    setIsSyncing(true);
    try {
      await offlineQueue.processQueue();
      setQueueSize(offlineQueue.getQueueSize());
    } catch (error) {
      console.error('[OfflineIndicator] Sync error:', error);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  if (isOnline && queueSize === 0) {
    return null; // Don't show anything when online and no pending requests
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Syncing...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Back Online</span>
              {queueSize > 0 && (
                <button
                  onClick={syncQueue}
                  className="text-xs underline hover:no-underline"
                >
                  Sync {queueSize} pending request{queueSize !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Offline Mode</span>
              {queueSize > 0 && (
                <span className="text-xs">
                  {queueSize} request{queueSize !== 1 ? 's' : ''} queued
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
