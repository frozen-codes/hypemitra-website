import { AppDatabase, BrandDeal, DailyWorkEntry, User, WeeklyTarget } from '../types';
import { INITIAL_DAILY_WORK, INITIAL_DEALS, INITIAL_WEEKLY_TARGETS } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'agency_worktrack_db_v1';
const CURRENT_USER_KEY = 'agency_worktrack_user_v1';

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

  async login(email: string, password: string):Promise<{ user: User; token: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }
      const data = await res.json();
      api.setStoredUser(data.user);
      return data;
    } catch (err: any) {
      // Fallback for standalone/local client-side preview
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
      throw new Error(err.message || 'Invalid email or password');
    }
  },

  async updateProfile(profileData: {
    id: string;
    name: string;
    title: string;
    email: string;
    avatar: string;
    newPassword?: string;
  }): Promise<User> {
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
      console.warn('API updateProfile failed, updating local state:', e);
    }

    const updatedUser: User = {
      id: profileData.id,
      name: profileData.name,
      title: profileData.title,
      email: profileData.email,
      role: profileData.id === 'user-hr' ? 'hr' : 'senior',
      avatar: profileData.avatar,
    };
    api.setStoredUser(updatedUser);
    return updatedUser;
  },

  async fetchDatabase(): Promise<AppDatabase> {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        saveLocalFallback(data);
        return data;
      }
    } catch (e) {
      console.warn('API fetchDatabase failed, using fallback:', e);
    }
    return getLocalFallback();
  },

  async saveDailyWork(entry: DailyWorkEntry): Promise<DailyWorkEntry> {
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
      console.warn('API saveDailyWork failed, updating local state:', e);
    }

    const current = getLocalFallback();
    current.dailyWork[entry.date] = entry;
    saveLocalFallback(current);
    return entry;
  },

  async submitSeniorReview(date: string, feedback: string, status: 'approved' | 'action_required' | 'acknowledged', reviewerName: string): Promise<DailyWorkEntry> {
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
      console.warn('API submitSeniorReview failed, updating local state:', e);
    }

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
    return entry;
  },

  async saveDeal(deal: Partial<BrandDeal>): Promise<BrandDeal> {
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
      console.warn('API saveDeal failed, updating local state:', e);
    }

    const current = getLocalFallback();
    const dealValue = Number(deal.dealValue) || 0;
    const brandRevenueReceived = Number(deal.brandRevenueReceived) || 0;
    const outstandingPayments = Math.max(0, dealValue - brandRevenueReceived);
    const creatorPayments = Number(deal.creatorPayments) || 0;
    const additionalExpenses = Number(deal.additionalExpenses) || 0;
    const totalExpenses = creatorPayments + additionalExpenses;
    const netProfit = brandRevenueReceived - totalExpenses;
    const profitMargin = brandRevenueReceived > 0 
      ? Math.round(((netProfit / brandRevenueReceived) * 100) * 100) / 100 
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
    return saved;
  },

  async deleteDeal(dealId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (e) {
      console.warn('API deleteDeal failed, updating local state:', e);
    }
    const current = getLocalFallback();
    current.deals = current.deals.filter((d) => d.id !== dealId);
    saveLocalFallback(current);
    return true;
  },

  async saveWeeklyTarget(target: WeeklyTarget): Promise<WeeklyTarget> {
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
      console.warn('API saveWeeklyTarget failed, updating local state:', e);
    }
    const current = getLocalFallback();
    current.weeklyTargets[target.id] = target;
    saveLocalFallback(current);
    return target;
  },

  async resetData(): Promise<AppDatabase> {
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        saveLocalFallback(json.db);
        return json.db;
      }
    } catch (e) {
      console.warn('API resetData failed, resetting local state:', e);
    }
    const resetDb: AppDatabase = {
      dailyWork: INITIAL_DAILY_WORK,
      deals: INITIAL_DEALS,
      weeklyTargets: INITIAL_WEEKLY_TARGETS,
    };
    saveLocalFallback(resetDb);
    return resetDb;
  },
};
