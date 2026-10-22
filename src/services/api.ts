import {
  AppDatabase,
  BrandDealRecord,
  ExpenseRecord,
  PerformanceDayEntry,
} from '../types';
import {
  INITIAL_PERFORMANCE,
  INITIAL_BRAND_DEALS,
  INITIAL_EXPENSES,
} from '../data/initialData';

const LOCAL_STORAGE_KEY = 'creator_performance_finance_db_v3';
const SYNC_QUEUE_KEY = 'creator_finance_sync_queue_v3';

export interface SyncQueueItem {
  id: string;
  type: 'save-performance' | 'save-brand-deal' | 'delete-brand-deal' | 'save-expense' | 'delete-expense';
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
    console.warn('Error reading sync queue:', e);
  }
  return [];
}

export function saveSyncQueue(queue: SyncQueueItem[]) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Error saving sync queue:', e);
  }
  notifySyncListeners();
}

export function addToSyncQueue(type: SyncQueueItem['type'], payload: any) {
  const queue = getSyncQueue();
  const filtered = queue.filter((item) => {
    if (type === 'save-performance' && item.type === 'save-performance') {
      return item.payload.date !== payload.date;
    }
    if (type === 'save-brand-deal' && item.type === 'save-brand-deal') {
      return item.payload.id !== payload.id;
    }
    if (type === 'save-expense' && item.type === 'save-expense') {
      return item.payload.id !== payload.id;
    }
    return true;
  });

  filtered.push({
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
  });
  saveSyncQueue(filtered);
}

function getLocalDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return {
    performance: INITIAL_PERFORMANCE,
    brandDeals: INITIAL_BRAND_DEALS,
    expenses: INITIAL_EXPENSES,
  };
}

function saveLocalDatabase(data: AppDatabase) {
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

  async fetchDatabase(): Promise<AppDatabase> {
    try {
      if (navigator.onLine) {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data: AppDatabase = await res.json();
          saveLocalDatabase(data);
          // Process any pending offline items
          this.flushSyncQueue().catch((e) => console.warn('Flush sync queue failed:', e));
          return data;
        }
      }
    } catch (err) {
      console.warn('API fetchDatabase failed, returning local cache:', err);
    }
    return getLocalDatabase();
  },

  async savePerformance(entry: PerformanceDayEntry): Promise<PerformanceDayEntry> {
    const current = getLocalDatabase();
    current.performance[entry.date] = entry;
    saveLocalDatabase(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        if (res.ok) {
          const json = await res.json();
          return json.entry;
        }
      } catch (err) {
        console.warn('Network savePerformance failed, queued for sync:', err);
        addToSyncQueue('save-performance', entry);
      }
    } else {
      addToSyncQueue('save-performance', entry);
    }
    return entry;
  },

  async saveBrandDeal(deal: Partial<BrandDealRecord>): Promise<BrandDealRecord> {
    const current = getLocalDatabase();
    const id = deal.id || `deal-${Date.now()}`;
    const fullDeal: BrandDealRecord = {
      id,
      brandName: deal.brandName || 'Untitled Brand',
      dealDate: deal.dealDate || new Date().toISOString().split('T')[0],
      totalDealAmount: Math.max(0, Number(deal.totalDealAmount) || 0),
      amountReceived: Math.max(0, Number(deal.amountReceived) || 0),
      paymentStatus: deal.paymentStatus || 'Pending',
      creators: Array.isArray(deal.creators) ? deal.creators : [],
      notes: deal.notes || '',
      createdAt: deal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const index = current.brandDeals.findIndex((d) => d.id === id);
    if (index >= 0) {
      current.brandDeals[index] = fullDeal;
    } else {
      current.brandDeals.unshift(fullDeal);
    }
    saveLocalDatabase(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/brand-deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullDeal),
        });
        if (res.ok) {
          const json = await res.json();
          return json.deal;
        }
      } catch (err) {
        console.warn('Network saveBrandDeal failed, queued for sync:', err);
        addToSyncQueue('save-brand-deal', fullDeal);
      }
    } else {
      addToSyncQueue('save-brand-deal', fullDeal);
    }
    return fullDeal;
  },

  async deleteBrandDeal(id: string): Promise<void> {
    const current = getLocalDatabase();
    current.brandDeals = current.brandDeals.filter((d) => d.id !== id);
    saveLocalDatabase(current);

    if (navigator.onLine) {
      try {
        await fetch(`/api/brand-deals/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Network deleteBrandDeal failed, queued for sync:', err);
        addToSyncQueue('delete-brand-deal', { id });
      }
    } else {
      addToSyncQueue('delete-brand-deal', { id });
    }
  },

  async saveExpense(expense: Partial<ExpenseRecord>): Promise<ExpenseRecord> {
    const current = getLocalDatabase();
    const id = expense.id || `exp-${Date.now()}`;
    const fullExpense: ExpenseRecord = {
      id,
      date: expense.date || new Date().toISOString().split('T')[0],
      description: expense.description || 'General Expense',
      amount: Math.max(0, Number(expense.amount) || 0),
      createdAt: expense.createdAt || new Date().toISOString(),
    };

    const index = current.expenses.findIndex((e) => e.id === id);
    if (index >= 0) {
      current.expenses[index] = fullExpense;
    } else {
      current.expenses.unshift(fullExpense);
    }
    saveLocalDatabase(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullExpense),
        });
        if (res.ok) {
          const json = await res.json();
          return json.expense;
        }
      } catch (err) {
        console.warn('Network saveExpense failed, queued for sync:', err);
        addToSyncQueue('save-expense', fullExpense);
      }
    } else {
      addToSyncQueue('save-expense', fullExpense);
    }
    return fullExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    const current = getLocalDatabase();
    current.expenses = current.expenses.filter((e) => e.id !== id);
    saveLocalDatabase(current);

    if (navigator.onLine) {
      try {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Network deleteExpense failed, queued for sync:', err);
        addToSyncQueue('delete-expense', { id });
      }
    } else {
      addToSyncQueue('delete-expense', { id });
    }
  },

  async resetData(): Promise<AppDatabase> {
    const initial: AppDatabase = {
      performance: INITIAL_PERFORMANCE,
      brandDeals: INITIAL_BRAND_DEALS,
      expenses: INITIAL_EXPENSES,
    };
    saveLocalDatabase(initial);
    try {
      if (navigator.onLine) {
        await fetch('/api/reset-data', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Server reset failed:', e);
    }
    return initial;
  },

  async syncPendingQueue(): Promise<void> {
    return this.flushSyncQueue();
  },

  async flushSyncQueue(): Promise<void> {
    if (!navigator.onLine || isCurrentlySyncing) return;
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    isCurrentlySyncing = true;
    notifySyncListeners();

    const remainingQueue: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'save-performance') {
          await fetch('/api/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'save-brand-deal') {
          await fetch('/api/brand-deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'delete-brand-deal') {
          await fetch(`/api/brand-deals/${item.payload.id}`, { method: 'DELETE' });
        } else if (item.type === 'save-expense') {
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'delete-expense') {
          await fetch(`/api/expenses/${item.payload.id}`, { method: 'DELETE' });
        }
      } catch (err) {
        console.warn(`Sync item ${item.id} failed, retaining in queue:`, err);
        remainingQueue.push(item);
      }
    }

    saveSyncQueue(remainingQueue);
    isCurrentlySyncing = false;
    notifySyncListeners();
  },
};
