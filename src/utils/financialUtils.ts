import { BrandDeal, DailyWorkEntry, WeeklyTarget } from '../types';

export function calculateFinancials(deals: BrandDeal[]) {
  let totalAgreedValue = 0;
  let totalRecognizedRevenue = 0;
  let totalOutstanding = 0;
  let totalCreatorExpenses = 0;
  let totalAdditionalExpenses = 0;

  let totalCreatorsLocked = 0;
  let totalCreatorsCompleted = 0;
  let totalCreatorsPending = 0;
  let totalCreatorsDeclined = 0;

  for (const deal of deals) {
    totalAgreedValue += deal.dealValue || 0;
    totalRecognizedRevenue += deal.brandRevenueReceived || 0;
    totalOutstanding += deal.outstandingPayments || 0;
    totalCreatorExpenses += deal.creatorPayments || 0;
    totalAdditionalExpenses += deal.additionalExpenses || 0;

    totalCreatorsLocked += deal.creatorsLocked || 0;
    totalCreatorsCompleted += deal.creatorsCompleted || 0;
    totalCreatorsPending += deal.creatorsPending || 0;
    totalCreatorsDeclined += deal.creatorsDeclined || 0;
  }

  const totalExpenses = totalCreatorExpenses + totalAdditionalExpenses;
  const netProfit = totalRecognizedRevenue - totalExpenses;
  const profitMargin = totalRecognizedRevenue > 0
    ? Math.round(((netProfit / totalRecognizedRevenue) * 100) * 10) / 10
    : 0;

  return {
    totalAgreedValue,
    totalRecognizedRevenue,
    totalOutstanding,
    totalCreatorExpenses,
    totalAdditionalExpenses,
    totalExpenses,
    netProfit,
    profitMargin,
    totalCreatorsLocked,
    totalCreatorsCompleted,
    totalCreatorsPending,
    totalCreatorsDeclined,
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

  // Calculate revenue recognized and profit for deals updated or active in this week
  // For deals whose deadline or updatedAt falls within this week
  let recognizedRevenue = 0;
  let expenses = 0;

  deals.forEach((deal) => {
    const dealDate = deal.updatedAt.split('T')[0];
    if (dealDate >= startDateStr && dealDate <= endDateStr) {
      recognizedRevenue += deal.brandRevenueReceived || 0;
      expenses += deal.totalExpenses || 0;
    }
  });

  // If no deals were updated in this specific window, use prorated proportion or fallback to actuals
  const netProfit = recognizedRevenue - expenses;

  return {
    daysLogged,
    creatorsContacted,
    creatorsLocked,
    deliverablesCompleted,
    greenDays,
    yellowDays,
    redDays,
    recognizedRevenue,
    expenses,
    netProfit,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
