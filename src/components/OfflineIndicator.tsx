import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { api } from '../services/api';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = api.subscribeSyncStatus((count, syncing) => {
      setPendingCount(count);
      setIsSyncing(syncing);
      if (count === 0 && !syncing && isOnline) {
        setJustSynced(true);
        const timer = setTimeout(() => setJustSynced(false), 3000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, [isOnline]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    await api.syncPendingQueue();
  };

  // If online, no pending changes, and didn't just sync, show nothing intrusive
  if (isOnline && pendingCount === 0 && !isSyncing && !justSynced) {
    return null;
  }

  // Just synced alert
  if (isOnline && justSynced) {
    return (
      <div className="fixed bottom-18 sm:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
        <span>All offline changes synced with server!</span>
      </div>
    );
  }

  // Online with pending items or syncing
  if (isOnline && (pendingCount > 0 || isSyncing)) {
    return (
      <div className="fixed bottom-18 sm:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-between sm:justify-start gap-3 rounded-xl bg-neutral-900 border border-neutral-700/80 px-4 py-2.5 text-xs font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing
              ? `Syncing ${pendingCount} offline ${pendingCount === 1 ? 'change' : 'changes'}...`
              : `${pendingCount} offline ${pendingCount === 1 ? 'change' : 'changes'} ready to sync`}
          </span>
        </div>
        {!isSyncing && (
          <button
            onClick={handleManualSync}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-2xs whitespace-nowrap cursor-pointer"
          >
            Sync Now
          </button>
        )}
      </div>
    );
  }

  // Offline mode banner
  return (
    <div className="fixed bottom-18 sm:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-between sm:justify-start gap-3 rounded-xl bg-amber-600 text-white px-4 py-2.5 text-xs font-medium shadow-2xl border border-amber-500/50 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
        <div>
          <span className="font-semibold">Offline Mode</span>
          <span className="opacity-90 ml-1.5 hidden sm:inline">
            — Working smoothly offline. All data is saved on this device.
          </span>
        </div>
      </div>
      {pendingCount > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-amber-700/70 text-2xs font-semibold text-amber-100">
          {pendingCount} saved locally
        </span>
      )}
    </div>
  );
};

// Header status badge
export const NetworkStatusBadge: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    return api.subscribeSyncStatus((count, syncing) => {
      setPendingCount(count);
      setIsSyncing(syncing);
    });
  }, []);

  const handleSync = () => {
    if (isOnline && !isSyncing && pendingCount > 0) {
      api.syncPendingQueue();
    }
  };

  if (!isOnline) {
    return (
      <div
        title="App is running offline. All changes will be saved locally and synced when you reconnect."
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-2xs font-semibold"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (pendingCount > 0 || isSyncing) {
    return (
      <button
        onClick={handleSync}
        disabled={isSyncing}
        title="Click to sync offline changes to server"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition text-2xs font-semibold"
      >
        <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
        <span>{isSyncing ? 'Syncing...' : `Sync (${pendingCount})`}</span>
      </button>
    );
  }

  return (
    <div
      title="App is connected and synced"
      className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-2xs font-medium"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>Online</span>
    </div>
  );
};
