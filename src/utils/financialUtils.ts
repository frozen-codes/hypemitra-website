import { BrandDeal, DailyWorkEntry, WeeklyTarget } from '../types';

export interface DealFinancialBreakdown {
  dealValue: number;
  brandRevenueReceived: number;
  outstandingPayments: number;
  creatorPayments: number;
  additionalExpenses: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  projectedProfit: number;
  projectedMargin: number;
}

/**
 * Calculates correct financial breakdown for an individual deal according to the core business formula:
 * Net Profit = Recognized Revenue − Total Expenses
 * Outstanding Payments = Agreed Deal Value − Recognized Revenue
 */
export function calculateDealFinancials(deal: Partial<BrandDeal>): DealFinancialBreakdown {
  const dealValue = Math.max(0, Number(deal.dealValue) || 0);
  const brandRevenueReceived = Math.max(0, Number(deal.brandRevenueReceived) || 0);
  const creatorPayments = Math.max(0, Number(deal.creatorPayments) || 0);
  const additionalExpenses = Math.max(0, Number(deal.additionalExpenses) || 0);

  // Total Expenses = Creator Payments + Additional Expenses
  const totalExpenses = creatorPayments + additionalExpenses;

  // Outstanding Payments = Agreed Deal Value − Brand Revenue Received
  const outstandingPayments = Math.max(0, dealValue - brandRevenueReceived);

  // Net Profit = Recognized Revenue (Cash Received) − Total Expenses
  const netProfit = brandRevenueReceived - totalExpenses;

  // Profit Margin (%) = (Net Profit / Recognized Revenue) * 100
  const profitMargin = brandRevenueReceived > 0
    ? Math.round(((netProfit / brandRevenueReceived) * 100) * 10) / 10
    : 0;

  // Projected Net Profit if 100% of agreed value is collected
  const projectedProfit = dealValue - totalExpenses;
  const projectedMargin = dealValue > 0
    ? Math.round(((projectedProfit / dealValue) * 100) * 10) / 10
    : 0;

  return {
    dealValue,
    brandRevenueReceived,
    outstandingPayments,
    creatorPayments,
    additionalExpenses,
    totalExpenses,
    netProfit,
    profitMargin,
    projectedProfit,
    projectedMargin,
  };
}

export interface AggregateFinancials {
  totalAgreedValue: number;
  totalRecognizedRevenue: number;
  totalOutstanding: number;
  totalCreatorExpenses: number;
  totalAdditionalExpenses: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  projectedProfit: number;
  totalCreatorsLocked: number;
  totalCreatorsCompleted: number;
  totalCreatorsPending: number;
  totalCreatorsDeclined: number;
  totalDealsCount: number;
  lockedDealsCount: number;
  completedDealsCount: number;
  pendingDealsCount: number;
  cancelledDealsCount: number;
}

/**
 * Calculates aggregate portfolio financials across all or filtered deals.
 * Strictly enforces: Net Profit = Total Recognized Revenue − Total Expenses
 */
export function calculateFinancials(
  deals: BrandDeal[],
  options?: { filterStatus?: string }
): AggregateFinancials {
  let totalAgreedValue = 0;
  let totalRecognizedRevenue = 0;
  let totalCreatorExpenses = 0;
  let totalAdditionalExpenses = 0;

  let totalCreatorsLocked = 0;
  let totalCreatorsCompleted = 0;
  let totalCreatorsPending = 0;
  let totalCreatorsDeclined = 0;

  let lockedDealsCount = 0;
  let completedDealsCount = 0;
  let pendingDealsCount = 0;
  let cancelledDealsCount = 0;

  for (const deal of deals) {
    if (deal.status === 'locked') lockedDealsCount++;
    else if (deal.status === 'completed') completedDealsCount++;
    else if (deal.status === 'pending' || deal.status === 'in-progress') pendingDealsCount++;
    else if (deal.status === 'cancelled') cancelledDealsCount++;

    // Optional status filter
    if (options?.filterStatus && options.filterStatus !== 'all') {
      if (options.filterStatus === 'locked' && deal.status !== 'locked') continue;
      if (options.filterStatus === 'completed' && deal.status !== 'completed') continue;
      if (options.filterStatus === 'pending' && deal.status !== 'pending' && deal.status !== 'in-progress') continue;
      if (options.filterStatus === 'cancelled' && deal.status !== 'cancelled') continue;
    }

    // Cancelled deals do not contribute to revenue or expenses unless explicitly filtered
    if (deal.status === 'cancelled' && (!options?.filterStatus || options.filterStatus === 'all')) {
      continue;
    }

    const calc = calculateDealFinancials(deal);
    totalAgreedValue += calc.dealValue;
    totalRecognizedRevenue += calc.brandRevenueReceived;
    totalCreatorExpenses += calc.creatorPayments;
    totalAdditionalExpenses += calc.additionalExpenses;

    totalCreatorsLocked += deal.creatorsLocked || 0;
    totalCreatorsCompleted += deal.creatorsCompleted || 0;
    totalCreatorsPending += deal.creatorsPending || 0;
    totalCreatorsDeclined += deal.creatorsDeclined || 0;
  }

  // Total Expenses = Total Creator Payments + Total Other Costs
  const totalExpenses = totalCreatorExpenses + totalAdditionalExpenses;

  // Net Profit = Recognized Revenue − Total Expenses
  const netProfit = totalRecognizedRevenue - totalExpenses;

  // Total Outstanding = Total Agreed Value − Total Recognized Revenue
  const totalOutstanding = Math.max(0, totalAgreedValue - totalRecognizedRevenue);

  // Profit Margin (%) = (Net Profit / Recognized Revenue) * 100
  const profitMargin = totalRecognizedRevenue > 0
    ? Math.round(((netProfit / totalRecognizedRevenue) * 100) * 10) / 10
    : 0;

  const projectedProfit = totalAgreedValue - totalExpenses;

  return {
    totalAgreedValue,
    totalRecognizedRevenue,
    totalOutstanding,
    totalCreatorExpenses,
    totalAdditionalExpenses,
    totalExpenses,
    netProfit,
    profitMargin,
    projectedProfit,
    totalCreatorsLocked,
    totalCreatorsCompleted,
    totalCreatorsPending,
    totalCreatorsDeclined,
    totalDealsCount: deals.length,
    lockedDealsCount,
    completedDealsCount,
    pendingDealsCount,
    cancelledDealsCount,
  };
}

/**
 * Calculates financial & deliverable summary for a specific calendar date
 */
export function calculateDateFinancials(
  dateStr: string,
  deals: BrandDeal[],
  dailyWorkEntry?: DailyWorkEntry | null
) {
  // Find deals handled on this day, or having deadline or created/updated on this day
  const handledIds = new Set(dailyWorkEntry?.dealsHandled?.map((d) => d.dealId) || []);

  const relevantDeals = deals.filter((d) => {
    if (handledIds.has(d.id)) return true;
    if (d.deadline === dateStr) return true;
    if (d.updatedAt && d.updatedAt.startsWith(dateStr)) return true;
    if (d.createdAt && d.createdAt.startsWith(dateStr)) return true;
    return false;
  });

  const financials = calculateFinancials(relevantDeals);

  return {
    relevantDeals,
    financials,
    creatorsContacted: dailyWorkEntry?.creatorsContacted || 0,
    creatorsLocked: dailyWorkEntry?.creatorsLocked || financials.totalCreatorsLocked,
    deliverablesCompleted: dailyWorkEntry?.deliverablesCompleted || 0,
    tasksCount: dailyWorkEntry?.tasksCompleted?.length || 0,
    performanceRating: dailyWorkEntry?.performanceRating || null,
  };
}

export function calculateWeeklyActuals(
  startDateStr: string,
  endDateStr: string,
  dailyWork: Record<string, DailyWorkEntry>,
  deals: BrandDeal[]
) {
  let creatorsContacted = 0;
  let creatorsLocked = 0;
  let deliverablesCompleted = 0;
  let greenDays = 0;
  let yellowDays = 0;
  let redDays = 0;
  let daysLogged = 0;

  // Filter daily work entries between start and end date
  Object.values(dailyWork).forEach((entry) => {
    if (entry.date >= startDateStr && entry.date <= endDateStr) {
      daysLogged++;
      creatorsContacted += entry.creatorsContacted || 0;
      creatorsLocked += entry.creatorsLocked || 0;
      deliverablesCompleted += entry.deliverablesCompleted || 0;

      if (entry.performanceRating === 'green') greenDays++;
      else if (entry.performanceRating === 'yellow') yellowDays++;
      else if (entry.performanceRating === 'red') redDays++;
    }
  });

  // Calculate revenue recognized and expenses for deals matching this week window
  const weekDeals = deals.filter((deal) => {
    if (deal.status === 'cancelled') return false;
    const dealDate = deal.updatedAt.split('T')[0];
    const isDeadlineInWeek = deal.deadline >= startDateStr && deal.deadline <= endDateStr;
    const isUpdatedInWeek = dealDate >= startDateStr && dealDate <= endDateStr;
    return isDeadlineInWeek || isUpdatedInWeek;
  });

  const summary = calculateFinancials(weekDeals);

  return {
    daysLogged,
    creatorsContacted,
    creatorsLocked,
    deliverablesCompleted,
    greenDays,
    yellowDays,
    redDays,
    recognizedRevenue: summary.totalRecognizedRevenue,
    expenses: summary.totalExpenses,
    netProfit: summary.netProfit,
    agreedValue: summary.totalAgreedValue,
    outstanding: summary.totalOutstanding,
    profitMargin: summary.profitMargin,
  };
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}
