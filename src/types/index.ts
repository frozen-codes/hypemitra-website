export type UserRole = 'hr' | 'senior';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
}

export type PerformanceRating = 'green' | 'yellow' | 'red';

export interface DealHandledSummary {
  dealId: string;
  brandName: string;
  campaignName: string;
  updateSummary: string;
}

export interface SeniorReview {
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  feedback?: string;
  status?: 'approved' | 'action_required' | 'acknowledged';
}

export interface DailyWorkEntry {
  date: string; // YYYY-MM-DD
  tasksCompleted: string[];
  tasksPending: string[];
  notes: string;
  creatorsContacted: number;
  creatorsLocked: number;
  deliverablesCompleted: number;
  performanceRating: PerformanceRating;
  dealsHandled: DealHandledSummary[];
  submittedBy: string; // created_by_name
  submittedAt: string;
  lastEditorName?: string;
  lastModifiedAt?: string;
  seniorReview?: SeniorReview;
}

export type DealStatus = 'locked' | 'in-progress' | 'pending' | 'completed' | 'on-hold' | 'cancelled';

export interface BrandDeal {
  id: string;
  brandName: string;
  campaignName: string;
  dealValue: number; // Agreed contract value (₹)
  brandRevenueReceived: number; // Actual recognized revenue received (₹)
  outstandingPayments: number; // dealValue - brandRevenueReceived (₹)
  creatorPayments: number; // Expenses to creators (₹)
  additionalExpenses: number; // Logistics, tools, taxes (₹)
  totalExpenses: number; // creatorPayments + additionalExpenses
  netProfit: number; // brandRevenueReceived - totalExpenses
  profitMargin: number; // (netProfit / brandRevenueReceived) * 100
  creatorsLocked: number;
  creatorsCompleted: number;
  creatorsPending: number;
  creatorsDeclined: number;
  deadline: string; // YYYY-MM-DD
  status: DealStatus;
  notes: string;
  weekId?: string; // e.g. 2026-W43
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyTarget {
  id: string; // e.g. 2026-W43
  year: number;
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetRevenue: number;
  targetProfit: number;
  targetCreatorsLocked: number;
  targetDeliverables: number;
  notes: string;
  setBy: string;
  updatedAt: string;
}

export interface AppDatabase {
  dailyWork: Record<string, DailyWorkEntry>;
  deals: BrandDeal[];
  weeklyTargets: Record<string, WeeklyTarget>;
}
