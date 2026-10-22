import React, { useState, useMemo } from 'react';
import { BrandDealRecord, ExpenseRecord } from '../types';
import { calculateBrandDeal, calculateWeeklySummary, formatCurrency } from '../utils/financialUtils';
import { formatISODate, parseISODate, getISOWeekId } from '../utils/dateUtils';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface WeeklyReportsViewProps {
  deals: BrandDealRecord[];
  expenses: ExpenseRecord[];
  onSaveExpense: (expense: Partial<ExpenseRecord>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const WeeklyReportsView: React.FC<WeeklyReportsViewProps> = ({
  deals,
  expenses,
  onSaveExpense,
  onDeleteExpense,
}) => {
  // Dynamically compute available Monday–Sunday weeks based on current date + existing records
  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, { id: string; label: string; start: string; end: string }>();

    const addWeekForDate = (dateObj: Date) => {
      const monday = new Date(dateObj);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const start = formatISODate(monday);
      const end = formatISODate(sunday);
      const id = getISOWeekId(monday);

      const formatShort = (dt: Date) =>
        dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const yearStr = sunday.getFullYear();

      const label = `${formatShort(monday)} – ${formatShort(sunday)}, ${yearStr}`;

      weekMap.set(start, { id, label, start, end });
    };

    // Include 4 past weeks, current week, and next 2 weeks
    const today = new Date();
    for (let offset = -4; offset <= 2; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset * 7);
      addWeekForDate(d);
    }

    // Include any weeks that have recorded deals or expenses
    deals.forEach((d) => {
      if (d.dealDate) {
        addWeekForDate(parseISODate(d.dealDate));
      }
    });
    expenses.forEach((e) => {
      if (e.date) {
        addWeekForDate(parseISODate(e.date));
      }
    });

    return Array.from(weekMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [deals, expenses]);

  // Determine current week's start
  const currentWeekMondayStr = useMemo(() => {
    const monday = new Date();
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    return formatISODate(monday);
  }, []);

  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(currentWeekMondayStr);

  const currentWeek =
    availableWeeks.find((w) => w.start === selectedWeekStart) ||
    availableWeeks.find((w) => w.start === currentWeekMondayStr) ||
    availableWeeks[0];

  // Expense form state
  const [expenseDate, setExpenseDate] = useState(currentWeek.start);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | string>('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Compute Weekly Summary metrics according to Master Prompt rules
  const summary = calculateWeeklySummary(
    deals,
    expenses,
    currentWeek.start,
    currentWeek.end
  );

  // Filter brand deals and expenses for selected week
  const weekDeals = deals.filter(
    (d) => d.dealDate >= currentWeek.start && d.dealDate <= currentWeek.end
  );
  const weekExpenses = expenses.filter(
    (e) => e.date >= currentWeek.start && e.date <= currentWeek.end
  );

  // Flattened detailed report rows (one row per creator under each brand, or one row for brand if no creators)
  interface DetailedRow {
    dealDate: string;
    brandName: string;
    creatorName: string;
    totalDealAmount: number;
    creatorLocking: number;
    creatorPayout: number;
    brandPaymentStatus: string;
    creatorUploadingStatus: string;
    creatorPaymentStatus: string;
    amountReceived: number;
    amountPaid: number;
  }

  const detailedRows: DetailedRow[] = [];
  weekDeals.forEach((deal) => {
    if (deal.creators && deal.creators.length > 0) {
      deal.creators.forEach((creator) => {
        detailedRows.push({
          dealDate: deal.dealDate,
          brandName: deal.brandName,
          creatorName: creator.creatorName,
          totalDealAmount: deal.totalDealAmount,
          creatorLocking: creator.lockingAmount,
          creatorPayout: creator.payoutAmount,
          brandPaymentStatus: deal.paymentStatus,
          creatorUploadingStatus: creator.uploadingStatus,
          creatorPaymentStatus: creator.paymentStatus,
          amountReceived: deal.amountReceived,
          amountPaid: creator.amountPaid,
        });
      });
    } else {
      detailedRows.push({
        dealDate: deal.dealDate,
        brandName: deal.brandName,
        creatorName: '—',
        totalDealAmount: deal.totalDealAmount,
        creatorLocking: 0,
        creatorPayout: 0,
        brandPaymentStatus: deal.paymentStatus,
        creatorUploadingStatus: '—',
        creatorPaymentStatus: '—',
        amountReceived: deal.amountReceived,
        amountPaid: 0,
      });
    }
  });

  // Handle Add Expense
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;

    setIsAddingExpense(true);
    try {
      await onSaveExpense({
        date: expenseDate,
        description: expenseDesc.trim(),
        amount: Math.max(0, Number(expenseAmount) || 0),
      });
      setExpenseDesc('');
      setExpenseAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Helper to escape CSV values
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Export 1: Weekly Summary CSV
  const handleExportSummaryCSV = () => {
    const headers = [
      'Reporting Week',
      'Start Date (Monday)',
      'End Date (Sunday)',
      'Total Locking Amount (INR)',
      'Total Deal Amount (INR)',
      'Total Brand Payments Received (INR)',
      'Total Creator Payouts Due (INR)',
      'Total Creator Payments Made (INR)',
      'Outstanding Brand Receivables (INR)',
      'Outstanding Creator Payables (INR)',
      'Total Expenses (INR)',
      'Agency Gross Margin (INR)',
      'Net Cash Position (INR)',
      'Net Profit (INR)',
    ];

    const values = [
      escapeCSV(currentWeek.id),
      escapeCSV(currentWeek.start),
      escapeCSV(currentWeek.end),
      summary.totalLockingAmount,
      summary.totalDealAmount,
      summary.totalBrandPaymentsReceived,
      summary.totalCreatorPayoutsDue,
      summary.totalCreatorPaymentsMade,
      summary.outstandingBrandReceivables,
      summary.outstandingCreatorPayables,
      summary.totalExpenses,
      summary.agencyGrossMargin,
      summary.netCashPosition,
      summary.netProfit,
    ];

    const csvContent = '\uFEFF' + [headers.join(','), values.join(',')].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weekly_summary_${currentWeek.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported Weekly Summary for ${currentWeek.id}`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Export 2: Detailed Tabular Report CSV
  const handleExportDetailedCSV = () => {
    const headers = [
      'Deal Date',
      'Brand Name',
      'Creator Name',
      'Total Brand Deal Amount (INR)',
      'Creator Locking Amount (INR)',
      'Creator Payout Amount (INR)',
      'Brand Payment Status',
      'Creator Uploading Status',
      'Creator Payment Status',
      'Amount Received from Brand (INR)',
      'Amount Paid to Creator (INR)',
    ];

    const rows = detailedRows.map((r) => [
      escapeCSV(r.dealDate),
      escapeCSV(r.brandName),
      escapeCSV(r.creatorName),
      r.totalDealAmount,
      r.creatorLocking,
      r.creatorPayout,
      escapeCSV(r.brandPaymentStatus),
      escapeCSV(r.creatorUploadingStatus),
      escapeCSV(r.creatorPaymentStatus),
      r.amountReceived,
      r.amountPaid,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weekly_detailed_report_${currentWeek.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported Detailed Tabular Report for ${currentWeek.id}`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Week Selector */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 font-serif">
              Weekly Reports & CSV Export
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comprehensive Monday–Sunday financial statements, expense tracking, and tabular records
            </p>
          </div>
        </div>

        {/* Week Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-neutral-600 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span>Select Week:</span>
          </label>
          <select
            value={currentWeek.start}
            onChange={(e) => {
              setSelectedWeekStart(e.target.value);
              setExpenseDate(e.target.value);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 cursor-pointer shadow-xs"
          >
            {availableWeeks.map((w) => (
              <option key={w.start} value={w.start}>
                {w.id}: {w.label} {w.start === currentWeekMondayStr ? '(Current Week)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Banner */}
      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Section 1: Weekly Summary (11 Required Metrics) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-sans">
              Weekly Summary: {currentWeek.id} ({currentWeek.label})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              All 10 core financial metrics automatically computed from recorded brand deals and creator disbursements
            </p>
          </div>

          {/* Export Weekly Summary CSV Button */}
          <button
            type="button"
            onClick={handleExportSummaryCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Weekly Summary CSV</span>
          </button>
        </div>

        {/* 11 KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* 1. Total Deal Amount */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              1. Total Deal Amount
            </span>
            <span className="text-base font-bold text-neutral-900 mt-1 block">
              {formatCurrency(summary.totalDealAmount)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Agreed brand contracts
            </span>
          </div>

          {/* 2. Total Creator Locking */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              2. Total Locking Amount
            </span>
            <span className="text-base font-bold text-neutral-900 mt-1 block">
              {formatCurrency(summary.totalLockingAmount)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Agreed creator locks
            </span>
          </div>

          {/* 3. Total Creator Payouts Due */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              3. Total Creator Payouts Due
            </span>
            <span className="text-base font-bold text-neutral-900 mt-1 block">
              {formatCurrency(summary.totalCreatorPayoutsDue)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Total payable to talent
            </span>
          </div>

          {/* 4. Brand Payments Received */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              4. Brand Payments Received
            </span>
            <span className="text-base font-bold text-emerald-800 mt-1 block">
              {formatCurrency(summary.totalBrandPaymentsReceived)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Actual cash collected
            </span>
          </div>

          {/* 5. Creator Payments Made */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              5. Creator Payments Made
            </span>
            <span className="text-base font-bold text-blue-800 mt-1 block">
              {formatCurrency(summary.totalCreatorPaymentsMade)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Disbursed to creators
            </span>
          </div>

          {/* 6. Outstanding Brand Receivables */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              6. Outstanding Brand Receivables
            </span>
            <span className="text-base font-bold text-amber-700 mt-1 block">
              {formatCurrency(summary.outstandingBrandReceivables)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Deal Amount − Received
            </span>
          </div>

          {/* 7. Outstanding Creator Payables */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              7. Outstanding Creator Payables
            </span>
            <span className="text-base font-bold text-rose-700 mt-1 block">
              {formatCurrency(summary.outstandingCreatorPayables)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Payouts Due − Paid
            </span>
          </div>

          {/* 8. Total Expenses */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">
              8. Total Recorded Expenses
            </span>
            <span className="text-base font-bold text-neutral-800 mt-1 block">
              {formatCurrency(summary.totalExpenses)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Operational costs
            </span>
          </div>

          {/* 9. Agency Gross Margin (Highlighted) */}
          <div className="bg-neutral-900 text-white p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
              9. Agency Gross Margin
            </span>
            <span className="text-lg font-bold text-emerald-300 mt-1 block">
              {formatCurrency(summary.agencyGrossMargin)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Deal Amount − Creator Payouts
            </span>
          </div>

          {/* 10. Net Cash Position (Highlighted) */}
          <div className="bg-neutral-900 text-white p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-sans">
              10. Net Cash Position
            </span>
            <span
              className={`text-lg font-bold mt-1 block ${
                summary.netCashPosition >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {formatCurrency(summary.netCashPosition)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Brand Received − Creator Paid
            </span>
          </div>

          {/* 11. Net Profit (Highlighted) */}
          <div className="bg-neutral-900 text-white p-3.5 rounded-xl shadow-xs col-span-2 sm:col-span-1 lg:col-span-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
              11. Net Profit (Margin − Expenses)
            </span>
            <span
              className={`text-xl font-bold mt-1 block ${
                summary.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {formatCurrency(summary.netProfit)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block font-sans">
              Formula: Agency Gross Margin ({formatCurrency(summary.agencyGrossMargin)}) − Expenses ({formatCurrency(summary.totalExpenses)})
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Expense Tracking for the Week */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Receipt className="w-4 h-4 text-neutral-700" />
              <span>Expense Tracking for this Week</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Record operational and production expenses to deduct from Agency Gross Margin
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-800">
            Total Week Expenses: {formatCurrency(summary.totalExpenses)}
          </span>
        </div>

        {/* Minimal Add Expense Form */}
        <form onSubmit={handleAddExpenseSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono w-full sm:w-36"
          />
          <input
            type="text"
            required
            placeholder="Expense description (e.g. Studio lighting rental, courier for brand kits)..."
            value={expenseDesc}
            onChange={(e) => setExpenseDesc(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 flex-1"
          />
          <input
            type="number"
            min="0"
            step="100"
            required
            placeholder="Amount (₹)"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono font-bold w-full sm:w-32"
          />
          <button
            type="submit"
            disabled={isAddingExpense}
            className="inline-flex items-center justify-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </form>

        {/* Expenses List */}
        {weekExpenses.length > 0 ? (
          <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100 text-xs">
            {weekExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 bg-neutral-50/50 hover:bg-neutral-50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-neutral-500 text-[11px] shrink-0">
                    {exp.date}
                  </span>
                  <span className="font-medium text-neutral-800">{exp.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-neutral-900">
                    {formatCurrency(exp.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                    title="Remove expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 italic py-1">
            No expenses recorded for this week yet. Enter expenses above to calculate Net Profit.
          </p>
        )}
      </div>

      {/* Section 3: Weekly Detailed Report (Tabular) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <FileSpreadsheet className="w-4 h-4 text-neutral-700" />
              <span>Weekly Detailed Tabular Report ({detailedRows.length} records)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Granular brand- and creator-level breakdown with deliverables, uploading status, and payment states
            </p>
          </div>

          {/* Export Detailed Report CSV Button */}
          <button
            type="button"
            onClick={handleExportDetailedCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Detailed Report CSV</span>
          </button>
        </div>

        {/* Detailed Table */}
        {detailedRows.length > 0 ? (
          <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold text-neutral-600 uppercase">
                    <th className="py-2.5 px-3">Deal Date</th>
                    <th className="py-2.5 px-3">Brand Name</th>
                    <th className="py-2.5 px-3">Creator Name</th>
                    <th className="py-2.5 px-2.5 font-mono text-right">Brand Deal (₹)</th>
                    <th className="py-2.5 px-2.5 font-mono text-right">Locking (₹)</th>
                    <th className="py-2.5 px-2.5 font-mono text-right">Payout (₹)</th>
                    <th className="py-2.5 px-2.5 text-center">Brand Payment</th>
                    <th className="py-2.5 px-2.5 text-center">Uploading Status</th>
                    <th className="py-2.5 px-2.5 text-center">Creator Payment</th>
                    <th className="py-2.5 px-2.5 font-mono text-right">Received (₹)</th>
                    <th className="py-2.5 px-3 font-mono text-right">Paid to Creator (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {detailedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/70">
                      <td className="py-2.5 px-3 font-mono text-neutral-600 whitespace-nowrap">
                        {row.dealDate}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-neutral-900 font-serif">
                        {row.brandName}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-neutral-800">
                        {row.creatorName}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono font-bold text-neutral-900 text-right">
                        {formatCurrency(row.totalDealAmount)}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-neutral-700 text-right">
                        {row.creatorLocking > 0 ? formatCurrency(row.creatorLocking) : '—'}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono font-semibold text-neutral-900 text-right">
                        {row.creatorPayout > 0 ? formatCurrency(row.creatorPayout) : '—'}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            row.brandPaymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.brandPaymentStatus === 'Partially Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.brandPaymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        {row.creatorUploadingStatus !== '—' ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.creatorUploadingStatus === 'Uploaded'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {row.creatorUploadingStatus}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        {row.creatorPaymentStatus !== '—' ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              row.creatorPaymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.creatorPaymentStatus === 'Partially Paid'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {row.creatorPaymentStatus}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono font-bold text-emerald-800 text-right">
                        {formatCurrency(row.amountReceived)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-800 text-right">
                        {formatCurrency(row.amountPaid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400 italic py-4 text-center">
            No brand deals or creators recorded for {currentWeek.id} ({currentWeek.label}).
          </p>
        )}
      </div>
    </div>
  );
};
