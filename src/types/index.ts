export type PerformanceRating = 'green' | 'yellow' | 'red';

export interface TaskItem {
  id: string;
  text: string;
  completed?: boolean;
}

export interface PerformanceDayEntry {
  date: string; // YYYY-MM-DD
  performanceRating: PerformanceRating; // 'green' = Best Work, 'yellow' = Average Work, 'red' = Poor Work
  tasks: TaskItem[];
  updates: string;
  notes?: string;
  updatedAt?: string;
}

export type BrandPaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';
export type CreatorUploadingStatus = 'Pending' | 'Uploaded';
export type CreatorPaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface CreatorRecord {
  id: string;
  creatorName: string;
  lockingAmount: number; // Locking amount or agreed deal amount (₹)
  payoutAmount: number; // Creator payout amount (₹)
  uploadingStatus: CreatorUploadingStatus; // 'Pending' | 'Uploaded'
  paymentStatus: CreatorPaymentStatus; // 'Pending' | 'Partially Paid' | 'Paid'
  amountPaid: number; // Amount paid to the creator (₹)
}

export interface BrandDealRecord {
  id: string;
  brandName: string;
  dealDate: string; // YYYY-MM-DD
  totalDealAmount: number; // Total deal amount agreed with the brand (₹)
  amountReceived: number; // Amount received from the brand (₹)
  paymentStatus: BrandPaymentStatus; // 'Pending' | 'Partially Paid' | 'Paid'
  creators: CreatorRecord[]; // Multiple creators associated with the brand
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // (₹)
  createdAt?: string;
}

export interface AppDatabase {
  performance: Record<string, PerformanceDayEntry>;
  brandDeals: BrandDealRecord[];
  expenses: ExpenseRecord[];
}
