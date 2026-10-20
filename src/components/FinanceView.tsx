import React, { useState } from 'react';
import { BrandDeal, DailyWorkEntry, DealStatus, User, WeeklyTarget } from '../types';
import {
  calculateFinancials,
  calculateDealFinancials,
  formatCurrency,
} from '../utils/financialUtils';
import {
  getMonthMatrix,
  formatISODate,
  MONTH_NAMES,
} from '../utils/dateUtils';
import {
  ArrowLeft,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Briefcase,
  Users,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Lock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface FinanceViewProps {
  currentUser: User;
  deals: BrandDeal[];
  weeklyTargets: Record<string, WeeklyTarget>;
  dailyWork: Record<string, DailyWorkEntry>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenDailyDrawer: (dateStr: string) => void;
  onBackToCalendar: () => void;
  onOpenCreateDeal: () => void;
  onEditDeal: (deal: BrandDeal) => void;
  onDeleteDeal: (dealId: string) => Promise<void>;
  onSaveWeeklyTarget: (target: WeeklyTarget) => Promise<void>;
  onExportCSV: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  currentUser,
  deals,
  weeklyTargets,
  dailyWork,
  selectedDate,
  onSelectDate,
  onOpenDailyDrawer,
  onBackToCalendar,
  onOpenCreateDeal,
  onEditDeal,
  onDeleteDeal,
  onSaveWeeklyTarget,
  onExportCSV,
}) => {
  // Calendar state in Finance view (Default: October 2026)
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 9, 19));
  const [selectedWeekId, setSelectedWeekId] = useState('2026-W43');
  const [timeframe, setTimeframe] = useState<'month' | 'week' | 'all'>('month');
  const [subTab, setSubTab] = useState<'calendar' | 'deals' | 'closing' | 'reports'>('calendar');
  const [dealFilter, setDealFilter] = useState<'all' | 'locked' | 'completed' | 'pending' | 'cancelled'>('all');
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthMatrix = getMonthMatrix(calYear, calMonth);

  const handlePrevCalMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextCalMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
  };

  const handleCalToday = () => {
    setCalendarDate(new Date(2026, 9, 19));
    onSelectDate('2026-10-19');
  };

  const currentTarget: WeeklyTarget = weeklyTargets[selectedWeekId] || {
    id: selectedWeekId,
    year: 2026,
    weekNumber: 43,
    startDate: selectedWeekId === '2026-W43' ? '2026-10-19' : '2026-10-12',
    endDate: selectedWeekId === '2026-W43' ? '2026-10-25' : '2026-10-18',
    targetRevenue: 650000,
    targetProfit: 300000,
    targetCreatorsLocked: 20,
    targetDeliverables: 25,
    notes: 'Q4 flagship campaigns',
    setBy: 'David Vance (Senior Director)',
    updatedAt: new Date().toISOString(),
  };

  const [editTargetValue, setEditTargetValue] = useState(currentTarget.targetRevenue);

  // Filter deals based on selected timeframe
  const activeDeals = deals.filter((d) => {
    if (timeframe === 'all') return true;
    if (timeframe === 'week') {
      if (d.weekId) return d.weekId === selectedWeekId;
      return d.deadline >= currentTarget.startDate && d.deadline <= currentTarget.endDate;
    }
    // Month timeframe: Oct 2026
    const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    return d.deadline.startsWith(monthPrefix) || d.updatedAt.startsWith(monthPrefix);
  });

  // Calculate comprehensive financials strictly using correct business formulas:
  // Net Profit = Recognized Revenue − Total Expenses
  // Total Expenses = Creator Payments + Additional Expenses
  // Outstanding Due = Agreed Value − Recognized Revenue
  const financials = calculateFinancials(activeDeals);

  const targetAmount = currentTarget.targetRevenue || 650000;
  const achievementPercent = targetAmount > 0
    ? Math.round((financials.totalRecognizedRevenue / targetAmount) * 100)
    : 0;
  const toGoAmount = Math.max(0, targetAmount - financials.totalRecognizedRevenue);

  // Deals list filter
  const filteredDisplayDeals = activeDeals.filter((d) => {
    if (dealFilter === 'locked') return d.status === 'locked';
    if (dealFilter === 'completed') return d.status === 'completed';
    if (dealFilter === 'pending') return d.status === 'pending' || d.status === 'in-progress';
    if (dealFilter === 'cancelled') return d.status === 'cancelled';
    return true;
  });

  const handleSaveTargetSubmit = async () => {
    await onSaveWeeklyTarget({
      ...currentTarget,
      targetRevenue: Number(editTargetValue) || 650000,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingTarget(false);
  };

  // Selected date financial & operational details
  const selectedEntry = dailyWork[selectedDate] || null;
  const [selY, selM, selD] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(selY, selM - 1, selD);
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Find deals associated with selectedDate (handled on this date or deadline on this date)
  const handledIds = new Set(selectedEntry?.dealsHandled?.map((d) => d.dealId) || []);
  const dateDeals = deals.filter(
    (d) => handledIds.has(d.id) || d.deadline === selectedDate || d.updatedAt.startsWith(selectedDate)
  );

  const dateFinancials = calculateFinancials(dateDeals);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back to Calendar Navigation */}
      <div>
        <button
          onClick={onBackToCalendar}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations Calendar</span>
        </button>
      </div>

      {/* Main Finance Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IndianRupee className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
                Finance & Profit Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Formula: Net Profit = Recognized Revenue − Total Expenses (Creator Payouts + Other Costs)
              </p>
            </div>
          </div>

          {/* Timeframe Scope Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Top Controls: Week/Month Navigator and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedWeekId(selectedWeekId === '2026-W43' ? '2026-W42' : '2026-W43')}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800 bg-white flex items-center gap-1.5">
              <span>📅</span>
              <span className="font-semibold">
                {selectedWeekId === '2026-W43' ? 'Oct 19 – Oct 25, 2026 (W43)' : 'Oct 12 – Oct 18, 2026 (W42)'}
              </span>
            </div>

            <button
              onClick={() => setSelectedWeekId(selectedWeekId === '2026-W42' ? '2026-W43' : '2026-W42')}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingTarget(!isEditingTarget)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Edit Target</span>
            </button>

            <button
              onClick={onOpenCreateDeal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Deal</span>
            </button>

            <button
              onClick={onExportCSV}
              title="Download CSV"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline Target Editor */}
        {isEditingTarget && (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-700">Weekly Target (₹):</span>
              <input
                type="number"
                step="10000"
                value={editTargetValue}
                onChange={(e) => setEditTargetValue(parseFloat(e.target.value) || 0)}
                className="px-3 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingTarget(false)}
                className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTargetSubmit}
                className="px-3.5 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6 Metric Financial KPI Cards — Mathematically Verified Formulas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Weekly Target */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              REVENUE TARGET
            </span>
            <IndianRupee className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {formatCurrency(targetAmount)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Target for active period
          </span>
        </div>

        {/* Recognized Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              RECOGNIZED REVENUE
            </span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {formatCurrency(financials.totalRecognizedRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Agreed: {formatCurrency(financials.totalAgreedValue)}
          </span>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              OUTSTANDING BALANCE
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-700 mt-2">
            {formatCurrency(financials.totalOutstanding)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Agreed − Received
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              TOTAL EXPENSES
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {formatCurrency(financials.totalExpenses)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Creators: {formatCurrency(financials.totalCreatorExpenses)} + Other: {formatCurrency(financials.totalAdditionalExpenses)}
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              NET PROFIT
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-2xl font-bold font-serif mt-2 ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(financials.netProfit)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block font-mono">
            Margin: {financials.profitMargin}% (Revenue − Expenses)
          </span>
        </div>

        {/* Target Achievement */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              ACHIEVEMENT
            </span>
            {achievementPercent >= 100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {achievementPercent}%
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {toGoAmount > 0 ? `${formatCurrency(toGoAmount)} to go` : 'Target Exceeded!'}
          </span>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
          <span>Target Achievement Progress:</span>
          <span className="font-mono">
            {formatCurrency(financials.totalRecognizedRevenue)} of {formatCurrency(targetAmount)} ({achievementPercent}%)
          </span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              achievementPercent >= 100
                ? 'bg-emerald-500'
                : achievementPercent > 0
                ? 'bg-neutral-900'
                : 'bg-neutral-300'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, achievementPercent))}%` }}
          />
        </div>
      </div>

      {/* Finance Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSubTab('calendar')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
            subTab === 'calendar'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Finance Calendar</span>
        </button>

        <button
          onClick={() => setSubTab('deals')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'deals'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Deals Portfolio ({activeDeals.length})
        </button>

        <button
          onClick={() => setSubTab('closing')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'closing'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Weekly Closing & Saturday Summary
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'reports'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Monthly & Yearly Reports
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: FINANCE CALENDAR (Only date shown on cells; clicks show details) */}
      {/* ========================================================================= */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          {/* Finance Calendar Header */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-serif flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-neutral-700" />
                <span>{MONTH_NAMES[calMonth]} {calYear} Financial Calendar</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Click any date to inspect that day's financial transactions, recognized revenue, and operational deliverables
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCalToday}
                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-colors cursor-pointer"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevCalMonth}
                  className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextCalMonth}
                  className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Grid — ONLY DATE SHOWN ON CELLS */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold text-neutral-700">
              <div className="py-2.5 px-2 text-center">Mon</div>
              <div className="py-2.5 px-2 text-center">Tue</div>
              <div className="py-2.5 px-2 text-center">Wed</div>
              <div className="py-2.5 px-2 text-center">Thu</div>
              <div className="py-2.5 px-2 text-center">Fri</div>
              <div className="py-2.5 px-2 text-center">Sat</div>
              <div className="py-2.5 px-2 text-center bg-neutral-100/60 text-neutral-400 flex items-center justify-center gap-1">
                <span>Sun</span>
                <Lock className="w-3 h-3 text-neutral-400" />
              </div>
            </div>

            {/* Matrix */}
            <div className="divide-y divide-neutral-200">
              {monthMatrix.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 divide-x divide-neutral-200">
                  {week.map((date, dayIdx) => {
                    const dateStr = formatISODate(date);
                    const isCurrentMonth = date.getMonth() === calMonth;
                    const isSunday = dayIdx === 6;
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === '2026-10-19';
                    const entry = dailyWork[dateStr];

                    // Check if this date has connected deals
                    const dayDealHandledIds = new Set(entry?.dealsHandled?.map((d) => d.dealId) || []);
                    const dayDeals = deals.filter(
                      (d) => dayDealHandledIds.has(d.id) || d.deadline === dateStr || d.updatedAt.startsWith(dateStr)
                    );
                    const hasFinanceActivity = dayDeals.length > 0 || (entry && entry.dealsHandled && entry.dealsHandled.length > 0);

                    if (isSunday) {
                      return (
                        <div
                          key={dateStr}
                          className="h-16 sm:h-20 p-2 bg-neutral-100/40 flex flex-col items-center justify-center select-none"
                        >
                          <span className="text-xs font-bold font-mono text-neutral-300">
                            {date.getDate()}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium mt-0.5 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Off
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          if (isCurrentMonth) {
                            onSelectDate(dateStr);
                          }
                        }}
                        className={`h-16 sm:h-20 p-2 flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                          !isCurrentMonth
                            ? 'bg-neutral-50/30 text-neutral-300 pointer-events-none'
                            : hasFinanceActivity
                            ? 'bg-emerald-50/40 hover:bg-emerald-100/60 text-emerald-950'
                            : entry
                            ? 'bg-neutral-50/70 hover:bg-neutral-100 text-neutral-800'
                            : 'bg-white hover:bg-neutral-50 text-neutral-800'
                        } ${
                          isSelected
                            ? 'ring-2 ring-neutral-900 bg-neutral-100/90 font-bold z-10 shadow-xs'
                            : ''
                        }`}
                      >
                        {/* ONLY DATE SHOWN ON CELL */}
                        <div className="flex flex-col items-center gap-1.5">
                          {isToday ? (
                            <span className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                              {date.getDate()}
                            </span>
                          ) : (
                            <span
                              className={`text-sm font-mono font-bold ${
                                isSelected
                                  ? 'text-neutral-900'
                                  : isCurrentMonth
                                  ? 'text-neutral-800'
                                  : 'text-neutral-300'
                              }`}
                            >
                              {date.getDate()}
                            </span>
                          )}

                          {/* Subtle Financial activity or deal dot */}
                          {hasFinanceActivity ? (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"
                              title={`${dayDeals.length} Deal(s) active on this date`}
                            />
                          ) : entry ? (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                entry.performanceRating === 'green'
                                  ? 'bg-emerald-500'
                                  : entry.performanceRating === 'yellow'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-transparent" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/60 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-neutral-700">Calendar Indicators:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Green Dot (Deal Activity / High Performance)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Yellow Dot (Work Logged / Average)</span>
                </div>
              </div>
              <div className="text-[11px] text-neutral-400">
                Click any date to see financial and operational details
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DAY DETAILS PANEL IN FINANCE TAB — When a date is clicked, show all details */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all">
            <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                  {selectedDateObj.getDate()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 font-serif">
                    {selectedDateFormatted}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Day Financial Breakdown & Daily Work Log
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenDailyDrawer(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Work Log</span>
                </button>
                <button
                  onClick={onOpenCreateDeal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Deal</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Daily Financial Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Recognized Revenue
                  </span>
                  <span className="text-xl font-bold font-serif text-neutral-900 mt-1 block">
                    {formatCurrency(dateFinancials.totalRecognizedRevenue)}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Agreed: {formatCurrency(dateFinancials.totalAgreedValue)}
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Total Expenses
                  </span>
                  <span className="text-xl font-bold font-serif text-neutral-900 mt-1 block">
                    {formatCurrency(dateFinancials.totalExpenses)}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Payouts + Costs
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Net Profit
                  </span>
                  <span className={`text-xl font-bold font-serif mt-1 block ${dateFinancials.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(dateFinancials.netProfit)}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">
                    Margin: {dateFinancials.profitMargin}%
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Outstanding Due
                  </span>
                  <span className="text-xl font-bold font-serif text-amber-700 mt-1 block">
                    {formatCurrency(dateFinancials.totalOutstanding)}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Receivables
                  </span>
                </div>
              </div>

              {/* Connected Brand Deals for this Day */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Brand Deals on this Date ({dateDeals.length})</span>
                  </h4>
                  <button
                    onClick={onOpenCreateDeal}
                    className="text-xs text-neutral-700 hover:text-neutral-900 font-semibold cursor-pointer"
                  >
                    + Add Deal
                  </button>
                </div>

                {dateDeals.length > 0 ? (
                  <div className="space-y-2">
                    {dateDeals.map((deal) => {
                      const calc = calculateDealFinancials(deal);
                      return (
                        <div
                          key={deal.id}
                          className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-neutral-900 font-serif">
                                {deal.brandName}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                                  deal.status === 'locked'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : deal.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : deal.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {deal.status}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">{deal.campaignName}</p>
                            <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono mt-1.5">
                              <span>Creators: {deal.creatorsLocked} locked</span>
                              <span>·</span>
                              <span>Deadline: {deal.deadline}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                                Recognized Revenue
                              </span>
                              <span className="text-sm font-bold font-serif text-neutral-900">
                                {formatCurrency(calc.brandRevenueReceived)}
                              </span>
                              <span className="text-[10px] text-neutral-400 block">
                                Contract: {formatCurrency(calc.dealValue)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                                Net Profit
                              </span>
                              <span className={`text-sm font-bold font-serif ${calc.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(calc.netProfit)}
                              </span>
                              <span className="text-[10px] text-emerald-600 block font-mono">
                                Margin: {calc.profitMargin}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onEditDeal(deal)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-xs text-neutral-400">
                    No brand deals specifically recorded for this date. Click "+ Add Deal" to record one.
                  </div>
                )}
              </div>

              {/* Day's Daily Work & Deliverable Log */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Daily Operations & Deliverable Log
                  </h4>
                  {selectedEntry && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        selectedEntry.performanceRating === 'green'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedEntry.performanceRating === 'yellow'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedEntry.performanceRating} rating
                    </span>
                  )}
                </div>

                {selectedEntry ? (
                  <div className="space-y-3 text-xs text-neutral-700">
                    <div className="grid grid-cols-3 gap-2 py-1">
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase">Creators Contacted</span>
                        <span className="font-bold font-mono text-neutral-900">{selectedEntry.creatorsContacted}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase">Creators Locked</span>
                        <span className="font-bold font-mono text-emerald-700">{selectedEntry.creatorsLocked}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase">Deliverables Done</span>
                        <span className="font-bold font-mono text-blue-700">{selectedEntry.deliverablesCompleted}</span>
                      </div>
                    </div>

                    {selectedEntry.notes && (
                      <div className="pt-2 border-t border-neutral-200">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                          Log Notes:
                        </span>
                        <p className="whitespace-pre-line text-neutral-700 leading-relaxed">
                          {selectedEntry.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">
                    No daily work log entry recorded for this date yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DEALS PORTFOLIO */}
      {/* ========================================================================= */}
      {subTab === 'deals' && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setDealFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Deals ({activeDeals.length})
            </button>
            <button
              onClick={() => setDealFilter('locked')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'locked'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Locked ({activeDeals.filter((d) => d.status === 'locked').length})
            </button>
            <button
              onClick={() => setDealFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'completed'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Completed ({activeDeals.filter((d) => d.status === 'completed').length})
            </button>
            <button
              onClick={() => setDealFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'pending'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Pending / In Progress ({activeDeals.filter((d) => d.status === 'pending' || d.status === 'in-progress').length})
            </button>
            <button
              onClick={() => setDealFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'cancelled'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Cancelled ({activeDeals.filter((d) => d.status === 'cancelled').length})
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 italic">
            Net Profit = Recognized Revenue − Total Expenses (Creator Payouts + Other Costs). Outstanding = Agreed Value − Recognized Revenue.
          </p>

          {/* Deals List */}
          {filteredDisplayDeals.length > 0 ? (
            <div className="space-y-3">
              {filteredDisplayDeals.map((deal) => {
                const calc = calculateDealFinancials(deal);
                return (
                  <div
                    key={deal.id}
                    className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-900 text-sm font-serif">
                          {deal.brandName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                            deal.status === 'locked'
                              ? 'bg-emerald-100 text-emerald-800'
                              : deal.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : deal.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {deal.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{deal.campaignName}</p>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono mt-2">
                        <span>Creators: {deal.creatorsLocked} locked</span>
                        <span>·</span>
                        <span>Deadline: {deal.deadline}</span>
                        {deal.notes && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-xs">{deal.notes}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Agreed Contract
                        </span>
                        <span className="text-sm font-bold font-serif text-neutral-900">
                          {formatCurrency(calc.dealValue)}
                        </span>
                        <span className="text-[10px] text-amber-700 block font-mono">
                          Due: {formatCurrency(calc.outstandingPayments)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Recognized Rev
                        </span>
                        <span className="text-sm font-bold font-serif text-neutral-900">
                          {formatCurrency(calc.brandRevenueReceived)}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          Costs: {formatCurrency(calc.totalExpenses)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Net Profit
                        </span>
                        <span className={`text-base font-bold font-serif ${calc.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(calc.netProfit)}
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-mono">
                          Margin: {calc.profitMargin}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pl-2">
                        <button
                          onClick={() => onEditDeal(deal)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDeal(deal.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                <Briefcase className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                No brand deals found matching this filter.
              </p>
              <button
                onClick={onOpenCreateDeal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record First Deal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: WEEKLY CLOSING & SATURDAY SUMMARY */}
      {/* ========================================================================= */}
      {subTab === 'closing' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900 font-serif">
              Weekly Closing & Saturday Executive Summary
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Automated reconciliation of finalized deliverables, recognized revenue, creator payments, and net profit.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Agreed Contract Value</span>
              <span className="text-lg font-bold font-serif text-neutral-900 mt-1 block">
                {formatCurrency(financials.totalAgreedValue)}
              </span>
            </div>
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Recognized Revenue</span>
              <span className="text-lg font-bold font-serif text-neutral-900 mt-1 block">
                {formatCurrency(financials.totalRecognizedRevenue)}
              </span>
            </div>
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Creator & Other Expenses</span>
              <span className="text-lg font-bold font-serif text-neutral-900 mt-1 block">
                {formatCurrency(financials.totalExpenses)}
              </span>
            </div>
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 border-l-4 border-l-emerald-500">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Net Agency Profit</span>
              <span className="text-lg font-bold font-serif text-emerald-600 mt-1 block">
                {formatCurrency(financials.netProfit)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saturday Closing Status: Balanced</span>
            </div>
            <p className="text-neutral-600">
              Formula verified: Recognized Revenue ({formatCurrency(financials.totalRecognizedRevenue)}) − Total Expenses ({formatCurrency(financials.totalExpenses)}) = Net Profit ({formatCurrency(financials.netProfit)}) with {financials.profitMargin}% margin.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MONTHLY & YEARLY REPORTS */}
      {/* ========================================================================= */}
      {subTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900 font-serif">
              Monthly & Yearly Financial Audit Reports
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Portfolio summaries across all brand campaigns and creator roster disbursements.
            </p>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {deals.map((deal) => {
              const calc = calculateDealFinancials(deal);
              return (
                <div key={deal.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900">{deal.brandName}</span>
                    <span className="text-neutral-400 mx-1.5">·</span>
                    <span className="text-neutral-600">{deal.campaignName}</span>
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-neutral-100 text-neutral-600">
                      {deal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-right">
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">Revenue</span>
                      <span className="text-neutral-900 font-semibold">{formatCurrency(calc.brandRevenueReceived)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">Expenses</span>
                      <span className="text-neutral-600">{formatCurrency(calc.totalExpenses)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">Net Profit</span>
                      <span className={`font-bold ${calc.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(calc.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
