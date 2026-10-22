import { BrandDealRecord, CreatorRecord, ExpenseRecord } from '../types';

export interface BrandCalculations {
  totalDealAmount: number;
  totalCreatorLocking: number;
  totalCreatorPayouts: number;
  totalCreatorPaymentsMade: number;
  amountReceived: number;
  agencyGrossMargin: number;
  netCashPosition: number;
  brandReceivables: number;
  creatorPayables: number;
}

/**
 * Calculates financial metrics for an individual brand deal according to Master Prompt rules:
 * - Agency Gross Margin = Total Brand Deal Amount − Total Creator Payouts
 * - Net Cash Position = Total Brand Payments Received − Total Creator Payments Made
 * - Brand Receivables = Total Brand Deal Amount − Amount Received
 * - Creator Payables = Total Creator Payouts − Total Creator Payments Made
 */
export function calculateBrandDeal(deal: BrandDealRecord): BrandCalculations {
  const totalDealAmount = Math.max(0, Number(deal.totalDealAmount) || 0);
  const amountReceived = Math.max(0, Number(deal.amountReceived) || 0);

  let totalCreatorLocking = 0;
  let totalCreatorPayouts = 0;
  let totalCreatorPaymentsMade = 0;

  if (Array.isArray(deal.creators)) {
    deal.creators.forEach((c) => {
      totalCreatorLocking += Math.max(0, Number(c.lockingAmount) || 0);
      totalCreatorPayouts += Math.max(0, Number(c.payoutAmount) || 0);
      totalCreatorPaymentsMade += Math.max(0, Number(c.amountPaid) || 0);
    });
  }

  const agencyGrossMargin = totalDealAmount - totalCreatorPayouts;
  const netCashPosition = amountReceived - totalCreatorPaymentsMade;
  const brandReceivables = Math.max(0, totalDealAmount - amountReceived);
  const creatorPayables = Math.max(0, totalCreatorPayouts - totalCreatorPaymentsMade);

  return {
    totalDealAmount,
    totalCreatorLocking,
    totalCreatorPayouts,
    totalCreatorPaymentsMade,
    amountReceived,
    agencyGrossMargin,
    netCashPosition,
    brandReceivables,
    creatorPayables,
  };
}

export interface WeeklyFinancialSummary {
  startDate: string;
  endDate: string;
  totalLockingAmount: number;
  totalDealAmount: number;
  totalBrandPaymentsReceived: number;
  totalCreatorPayoutsDue: number;
  totalCreatorPaymentsMade: number;
  outstandingBrandReceivables: number;
  outstandingCreatorPayables: number;
  totalExpenses: number;
  agencyGrossMargin: number;
  netCashPosition: number;
  netProfit: number;
  dealsCount: number;
  creatorsCount: number;
}

/**
 * Generates weekly summary metrics from saved brand and creator financial records and weekly expenses
 */
export function calculateWeeklySummary(
  deals: BrandDealRecord[],
  expenses: ExpenseRecord[],
  startDate: string,
  endDate: string
): WeeklyFinancialSummary {
  const weeklyDeals = deals.filter(
    (d) => d.dealDate >= startDate && d.dealDate <= endDate
  );

  const weeklyExpenses = expenses.filter(
    (e) => e.date >= startDate && e.date <= endDate
  );

  let totalDealAmount = 0;
  let totalBrandPaymentsReceived = 0;
  let totalLockingAmount = 0;
  let totalCreatorPayoutsDue = 0;
  let totalCreatorPaymentsMade = 0;
  let creatorsCount = 0;

  weeklyDeals.forEach((d) => {
    const calc = calculateBrandDeal(d);
    totalDealAmount += calc.totalDealAmount;
    totalBrandPaymentsReceived += calc.amountReceived;
    totalLockingAmount += calc.totalCreatorLocking;
    totalCreatorPayoutsDue += calc.totalCreatorPayouts;
    totalCreatorPaymentsMade += calc.totalCreatorPaymentsMade;
    creatorsCount += d.creators?.length || 0;
  });

  const totalExpenses = weeklyExpenses.reduce(
    (sum, e) => sum + Math.max(0, Number(e.amount) || 0),
    0
  );

  const agencyGrossMargin = totalDealAmount - totalCreatorPayoutsDue;
  const netCashPosition = totalBrandPaymentsReceived - totalCreatorPaymentsMade;
  const outstandingBrandReceivables = Math.max(
    0,
    totalDealAmount - totalBrandPaymentsReceived
  );
  const outstandingCreatorPayables = Math.max(
    0,
    totalCreatorPayoutsDue - totalCreatorPaymentsMade
  );
  const netProfit = agencyGrossMargin - totalExpenses;

  return {
    startDate,
    endDate,
    totalLockingAmount,
    totalDealAmount,
    totalBrandPaymentsReceived,
    totalCreatorPayoutsDue,
    totalCreatorPaymentsMade,
    outstandingBrandReceivables,
    outstandingCreatorPayables,
    totalExpenses,
    agencyGrossMargin,
    netCashPosition,
    netProfit,
    dealsCount: weeklyDeals.length,
    creatorsCount,
  };
}

/**
 * Standard Indian Rupee (₹) currency formatter
 */
export function formatCurrency(amount: number | null | undefined): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
