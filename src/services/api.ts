import { AppDatabase, BrandDeal, DailyWorkEntry, User, WeeklyTarget } from '../types';
import { INITIAL_DAILY_WORK, INITIAL_DEALS, INITIAL_WEEKLY_TARGETS } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'agency_worktrack_db_v1';
const CURRENT_USER_KEY = 'agency_worktrack_user_v1';
const SYNC_QUEUE_KEY = 'agency_worktrack_sync_queue_v1';

export type SyncItemType =
  | 'save-daily-work'
  | 'submit-review'
  | 'save-deal'
  | 'delete-deal'
  | 'save-weekly-target'
  | 'update-profile';

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  payload: any;
  timestamp: number;
}

type SyncListener = (pendingCount: number, isSyncing: boolean) => void;
const syncListeners: Set<SyncListener> = new Set();
let isCurrentlySyncing = false;

function notifySyncListeners() {
  const count = getSyncQueue().length;
  syncListeners.forEach((listener) => {
    try {
      listener(count, isCurrentlySyncing);
    } catch (e) {
      console.error('Error notifying sync listener:', e);
    }
  });
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading sync queue from localStorage:', e);
  }
  return [];
}

export function saveSyncQueue(queue: SyncQueueItem[]) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Error writing sync queue to localStorage:', e);
  }
  notifySyncListeners();
}

export function addToSyncQueue(type: SyncItemType, payload: any) {
  const queue = getSyncQueue();
  // If editing same deal or same day's work, replace previous pending item with latest
  const filtered = queue.filter((item) => {
    if (type === 'save-daily-work' && item.type === 'save-daily-work') {
      return item.payload.date !== payload.date;
    }
    if (type === 'save-deal' && item.type === 'save-deal') {
      return item.payload.id !== payload.id;
    }
    if (type === 'save-weekly-target' && item.type === 'save-weekly-target') {
      return item.payload.id !== payload.id;
    }
    return true;
  });

  const newItem: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    payload,
    timestamp: Date.now(),
  };

  filtered.push(newItem);
  saveSyncQueue(filtered);
}

function getLocalFallback(): AppDatabase {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return {
    dailyWork: INITIAL_DAILY_WORK,
    deals: INITIAL_DEALS,
    weeklyTargets: INITIAL_WEEKLY_TARGETS,
  };
}

function saveLocalFallback(data: AppDatabase) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

export const api = {
  subscribeSyncStatus(listener: SyncListener): () => void {
    syncListeners.add(listener);
    listener(getSyncQueue().length, isCurrentlySyncing);
    return () => {
      syncListeners.delete(listener);
    };
  },

  getPendingSyncCount(): number {
    return getSyncQueue().length;
  },

  getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  },

  setStoredUser(user: User | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      if (navigator.onLine) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const data = await res.json();
          api.setStoredUser(data.user);
          return data;
        }
      }
    } catch (err: any) {
      console.warn('Login fetch failed, checking offline credentials:', err);
    }

    // Fallback for offline mode and standalone client-side execution
    const stored = api.getStoredUser();
    if (stored && stored.email.toLowerCase() === email.toLowerCase()) {
      return { user: stored, token: 'local-offline-token' };
    }

    if (email.toLowerCase().includes('hr') && password === 'hr123') {
      const hrUser: User = {
        id: 'user-hr',
        name: 'Shraddha Tiwari',
        email: 'hr@hypemitra.com',
        role: 'hr',
        avatar: '/src/assets/images/avatar_hr_sarah_1792391437426.jpg',
        title: 'HR & Operations Lead',
      };
      api.setStoredUser(hrUser);
      return { user: hrUser, token: 'local-hr-token' };
    } else if (email.toLowerCase().includes('senior') && password === 'senior123') {
      const seniorUser: User = {
        id: 'user-senior',
        name: 'David Vance',
        email: 'senior@agency.com',
        role: 'senior',
        avatar: '/src/assets/images/avatar_senior_david_1792391436855.jpg',
        title: 'Senior Operations Director',
      };
      api.setStoredUser(seniorUser);
      return { user: seniorUser, token: 'local-senior-token' };
    }
    throw new Error('Invalid email or password');
  },

  async updateProfile(profileData: {
    id: string;
    name: string;
    title: string;
    email: string;
    avatar: string;
    newPassword?: string;
  }): Promise<User> {
    const updatedUser: User = {
      id: profileData.id,
      name: profileData.name,
      title: profileData.title,
      email: profileData.email,
      role: profileData.id === 'user-hr' ? 'hr' : 'senior',
      avatar: profileData.avatar,
    };

    api.setStoredUser(updatedUser);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });
        if (res.ok) {
          const data = await res.json();
          api.setStoredUser(data.user);
          return data.user;
        }
      } catch (e) {
        console.warn('API updateProfile failed, queuing for sync:', e);
        addToSyncQueue('update-profile', profileData);
      }
    } else {
      addToSyncQueue('update-profile', profileData);
    }

    return updatedUser;
  },

  async fetchDatabase(): Promise<AppDatabase> {
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const serverDb: AppDatabase = await res.json();
          // If we have pending offline items in the sync queue, trigger background sync
          const queue = getSyncQueue();
          if (queue.length > 0) {
            // Trigger sync in background
            setTimeout(() => {
              api.syncPendingQueue();
            }, 100);
            return getLocalFallback();
          }
          saveLocalFallback(serverDb);
          return serverDb;
        }
      } catch (e) {
        console.warn('API fetchDatabase failed, using cached offline data:', e);
      }
    }
    return getLocalFallback();
  },

  async saveDailyWork(entry: DailyWorkEntry): Promise<DailyWorkEntry> {
    // 1. Immediately persist to local storage for instant responsiveness
    const current = getLocalFallback();
    current.dailyWork[entry.date] = entry;
    saveLocalFallback(current);

    // 2. If online, try sending to server
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/daily-work', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        if (res.ok) {
          const json = await res.json();
          return json.entry;
        }
      } catch (e) {
        console.warn('API saveDailyWork failed, queued for offline sync:', e);
        addToSyncQueue('save-daily-work', entry);
      }
    } else {
      addToSyncQueue('save-daily-work', entry);
    }

    return entry;
  },

  async submitSeniorReview(
    date: string,
    feedback: string,
    status: 'approved' | 'action_required' | 'acknowledged',
    reviewerName: string
  ): Promise<DailyWorkEntry> {
    const current = getLocalFallback();
    const entry = current.dailyWork[date] || {
      date,
      tasksCompleted: [],
      tasksPending: [],
      notes: '',
      creatorsContacted: 0,
      creatorsLocked: 0,
      deliverablesCompleted: 0,
      performanceRating: 'yellow',
      dealsHandled: [],
      submittedBy: 'HR',
      submittedAt: new Date().toISOString(),
    };
    entry.seniorReview = {
      reviewed: true,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      feedback,
      status,
    };
    current.dailyWork[date] = entry;
    saveLocalFallback(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/daily-work/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, feedback, status, reviewerName }),
        });
        if (res.ok) {
          const json = await res.json();
          return json.entry;
        }
      } catch (e) {
        console.warn('API submitSeniorReview failed, queued for offline sync:', e);
        addToSyncQueue('submit-review', { date, feedback, status, reviewerName });
      }
    } else {
      addToSyncQueue('submit-review', { date, feedback, status, reviewerName });
    }

    return entry;
  },

  async saveDeal(deal: Partial<BrandDeal>): Promise<BrandDeal> {
    const current = getLocalFallback();
    const dealValue = Number(deal.dealValue) || 0;
    const brandRevenueReceived = Number(deal.brandRevenueReceived) || 0;
    const outstandingPayments = Math.max(0, dealValue - brandRevenueReceived);
    const creatorPayments = Number(deal.creatorPayments) || 0;
    const additionalExpenses = Number(deal.additionalExpenses) || 0;
    const totalExpenses = creatorPayments + additionalExpenses;
    const netProfit = brandRevenueReceived - totalExpenses;
    const profitMargin =
      brandRevenueReceived > 0
        ? Math.round((netProfit / brandRevenueReceived) * 100 * 100) / 100
        : 0;

    const saved: BrandDeal = {
      id: deal.id || `deal-${Date.now()}`,
      brandName: deal.brandName || 'Untitled Brand',
      campaignName: deal.campaignName || 'Campaign',
      dealValue,
      brandRevenueReceived,
      outstandingPayments,
      creatorPayments,
      additionalExpenses,
      totalExpenses,
      netProfit,
      profitMargin,
      creatorsLocked: Number(deal.creatorsLocked) || 0,
      creatorsCompleted: Number(deal.creatorsCompleted) || 0,
      creatorsPending: Number(deal.creatorsPending) || 0,
      creatorsDeclined: Number(deal.creatorsDeclined) || 0,
      deadline: deal.deadline || new Date().toISOString().split('T')[0],
      status: deal.status || 'in-progress',
      notes: deal.notes || '',
      createdAt: deal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = current.deals.findIndex((d) => d.id === saved.id);
    if (idx >= 0) {
      current.deals[idx] = saved;
    } else {
      current.deals.unshift(saved);
    }
    saveLocalFallback(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deal),
        });
        if (res.ok) {
          const json = await res.json();
          return json.deal;
        }
      } catch (e) {
        console.warn('API saveDeal failed, queued for offline sync:', e);
        addToSyncQueue('save-deal', saved);
      }
    } else {
      addToSyncQueue('save-deal', saved);
    }

    return saved;
  },

  async deleteDeal(dealId: string): Promise<boolean> {
    const current = getLocalFallback();
    current.deals = current.deals.filter((d) => d.id !== dealId);
    saveLocalFallback(current);

    if (navigator.onLine) {
      try {
        const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (e) {
        console.warn('API deleteDeal failed, queued for offline sync:', e);
        addToSyncQueue('delete-deal', { dealId });
      }
    } else {
      addToSyncQueue('delete-deal', { dealId });
    }

    return true;
  },

  async saveWeeklyTarget(target: WeeklyTarget): Promise<WeeklyTarget> {
    const current = getLocalFallback();
    current.weeklyTargets[target.id] = target;
    saveLocalFallback(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/weekly-targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target),
        });
        if (res.ok) {
          const json = await res.json();
          return json.target;
        }
      } catch (e) {
        console.warn('API saveWeeklyTarget failed, queued for offline sync:', e);
        addToSyncQueue('save-weekly-target', target);
      }
    } else {
      addToSyncQueue('save-weekly-target', target);
    }

    return target;
  },

  async resetData(): Promise<AppDatabase> {
    const resetDb: AppDatabase = {
      dailyWork: INITIAL_DAILY_WORK,
      deals: INITIAL_DEALS,
      weeklyTargets: INITIAL_WEEKLY_TARGETS,
    };
    saveLocalFallback(resetDb);
    saveSyncQueue([]);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/reset-data', { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          saveLocalFallback(json.db);
          return json.db;
        }
      } catch (e) {
        console.warn('API resetData server sync failed:', e);
      }
    }

    return resetDb;
  },

  async syncPendingQueue(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine || isCurrentlySyncing) {
      return { synced: 0, failed: 0 };
    }

    const queue = getSyncQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    isCurrentlySyncing = true;
    notifySyncListeners();

    let synced = 0;
    let failed = 0;
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'save-daily-work') {
          const res = await fetch('/api/daily-work', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) throw new Error('Failed to sync daily work');
        } else if (item.type === 'submit-review') {
          const res = await fetch('/api/daily-work/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) throw new Error('Failed to sync review');
        } else if (item.type === 'save-deal') {
          const res = await fetch('/api/deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) throw new Error('Failed to sync deal');
        } else if (item.type === 'delete-deal') {
          const res = await fetch(`/api/deals/${item.payload.dealId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to delete deal');
        } else if (item.type === 'save-weekly-target') {
          const res = await fetch('/api/weekly-targets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) throw new Error('Failed to sync target');
        } else if (item.type === 'update-profile') {
          const res = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) throw new Error('Failed to sync profile');
        }
        synced++;
      } catch (err) {
        console.warn('Failed syncing queue item:', item, err);
        failed++;
        remainingQueue.push(item);
      }
    }

    isCurrentlySyncing = false;
    saveSyncQueue(remainingQueue);

    return { synced, failed };
  },
};

// Automatic listener when internet returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('App is back online. Syncing pending offline modifications...');
    api.syncPendingQueue();
  });
}
