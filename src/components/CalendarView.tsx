import React, { useState } from 'react';
import { BrandDeal, DailyWorkEntry, PerformanceRating, User } from '../types';
import {
  getMonthMatrix,
  formatISODate,
  MONTH_NAMES,
} from '../utils/dateUtils';
import { formatCurrency } from '../utils/financialUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Lock,
  Edit3,
  ShieldCheck,
  Briefcase,
  Users,
  Check,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface CalendarViewProps {
  currentUser: User;
  dailyWork: Record<string, DailyWorkEntry>;
  deals?: BrandDeal[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenCreateOrEdit: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  dailyWork,
  deals = [],
  selectedDate,
  onSelectDate,
  onOpenCreateOrEdit,
}) => {
  // Reference date: October 2026
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 19));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthMatrix = getMonthMatrix(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 19));
    onSelectDate('2026-10-19');
  };

  // Calculate working days (Mon-Sat, excluding Sundays) in current month
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  let totalWorkingDays = 0;
  for (let day = 1; day <= lastDayOfMonth; day++) {
    const d = new Date(year, month, day);
    if (d.getDay() !== 0) {
      totalWorkingDays++;
    }
  }

  // Count month ratings among working days
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let loggedDaysCount = 0;

  for (let day = 1; day <= lastDayOfMonth; day++) {
    const d = new Date(year, month, day);
    if (d.getDay() === 0) continue; // Skip Sunday

    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const entry = dailyWork[dateStr];
    if (entry) {
      loggedDaysCount++;
      if (entry.performanceRating === 'green') greenCount++;
      else if (entry.performanceRating === 'yellow') yellowCount++;
      else if (entry.performanceRating === 'red') redCount++;
    }
  }

  const pendingNotesCount = Math.max(0, totalWorkingDays - loggedDaysCount);
  const completionPercent = totalWorkingDays > 0 ? Math.round((loggedDaysCount / totalWorkingDays) * 100) : 0;

  // Selected date details
  const selectedEntry = dailyWork[selectedDate] || null;
  const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(selYear, selMonth - 1, selDay);
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Find deals handled on this date or matching deadline
  const dateHandledDealIds = new Set(selectedEntry?.dealsHandled?.map((d) => d.dealId) || []);
  const dateDeals = deals.filter(
    (d) => dateHandledDealIds.has(d.id) || d.deadline === selectedDate
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Month Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-800">
            <CalendarIcon className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
              {MONTH_NAMES[month]} {year}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Permanent agency work journal · Click any date to view all daily details below
            </p>
          </div>
        </div>

        {/* Date Dropdowns & Month Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 cursor-pointer"
          >
            {MONTH_NAMES.map((mName, idx) => (
              <option key={mName} value={idx}>
                {mName}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 cursor-pointer"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Working Days */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
            WORKING DAYS
          </span>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {totalWorkingDays}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Excludes Sundays
          </span>
        </div>

        {/* Best (Green) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-500 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest block font-sans">
              BEST (GREEN)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-600 mt-2">
            {greenCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Exceeded targets
          </span>
        </div>

        {/* Medium (Yellow) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest block font-sans">
              MEDIUM (YELLOW)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-600 mt-2">
            {yellowCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Target met / minor blocker
          </span>
        </div>

        {/* Poor (Red) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 border-l-4 border-l-rose-500 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest block font-sans">
              POOR (RED)
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-600 mt-2">
            {redCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Missed milestones
          </span>
        </div>

        {/* Pending Notes */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              PENDING NOTES
            </span>
            <HelpCircle className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {pendingNotesCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Awaiting daily entry
          </span>
        </div>

        {/* Completion */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between col-span-1 md:col-span-2">
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
            COMPLETION
          </span>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {completionPercent}%
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-neutral-900 h-full rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Calendar Grid — Clean view showing ONLY date on each cell */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Days of Week Header */}
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

        {/* Days Matrix: ONLY DATE SHOWN ON CELLS */}
        <div className="divide-y divide-neutral-200">
          {monthMatrix.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-neutral-200">
              {week.map((date, dayIdx) => {
                const dateStr = formatISODate(date);
                const isCurrentMonth = date.getMonth() === month;
                const isSunday = dayIdx === 6;
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === '2026-10-19';
                const entry = dailyWork[dateStr];

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

                // Working day cell — ONLY DATE SHOWN, with subtle status color indicator
                let statusClasses = 'bg-white hover:bg-neutral-50 text-neutral-800';
                let indicatorColor = '';

                if (entry) {
                  if (entry.performanceRating === 'green') {
                    statusClasses = 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-950';
                    indicatorColor = 'bg-emerald-500 ring-2 ring-emerald-200';
                  } else if (entry.performanceRating === 'yellow') {
                    statusClasses = 'bg-amber-50/50 hover:bg-amber-100/60 text-amber-950';
                    indicatorColor = 'bg-amber-500 ring-2 ring-amber-200';
                  } else if (entry.performanceRating === 'red') {
                    statusClasses = 'bg-rose-50/50 hover:bg-rose-100/60 text-rose-950';
                    indicatorColor = 'bg-rose-500 ring-2 ring-rose-200';
                  }
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
                        : statusClasses
                    } ${
                      isSelected
                        ? 'ring-2 ring-neutral-900 bg-neutral-100/80 font-bold z-10 shadow-xs'
                        : ''
                    }`}
                  >
                    {/* Date Number */}
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

                      {/* Performance color indicator dot */}
                      {entry ? (
                        <span
                          className={`w-2 h-2 rounded-full ${indicatorColor}`}
                          title={`Performance: ${entry.performanceRating}`}
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

        {/* Legend bar */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/60 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-neutral-700">Indicators:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Green (Target Achieved)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Yellow (Average / Minor Blocker)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Red (Missed Milestones)</span>
            </div>
          </div>
          <div className="text-[11px] text-neutral-400">
            Click any date to see all details below
          </div>
        </div>
      </div>

      {/* FULL DAY DETAILS PANEL — Displays all details when a date is clicked */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all">
        {/* Panel Header */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              {selectedDateObj.getDate()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 font-serif">
                  {selectedDateFormatted}
                </h2>
                {selectedEntry && (
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md ${
                      selectedEntry.performanceRating === 'green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedEntry.performanceRating === 'yellow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedEntry.performanceRating === 'green'
                      ? 'Best (Target Achieved)'
                      : selectedEntry.performanceRating === 'yellow'
                      ? 'Medium Performance'
                      : 'Poor Performance'}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {selectedEntry
                  ? `Logged by ${selectedEntry.submittedBy || 'HR'}`
                  : 'No daily entry recorded yet for this date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCreateOrEdit(selectedDate)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{selectedEntry ? 'Edit Work Log' : 'Record Daily Work'}</span>
            </button>
          </div>
        </div>

        {/* Panel Content Body */}
        <div className="p-6 space-y-6">
          {/* Quantitative Metrics Bar for the Day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Creators Contacted
              </span>
              <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                {selectedEntry?.creatorsContacted || 0}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Outreach pipeline</span>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Creators Locked
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
                {selectedEntry?.creatorsLocked || 0}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Signed agreements</span>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Deliverables Done
              </span>
              <span className="text-xl font-bold font-mono text-blue-700 mt-1 block">
                {selectedEntry?.deliverablesCompleted || 0}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Approved drafts & reels</span>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Deals Handled
              </span>
              <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                {(selectedEntry?.dealsHandled?.length || 0) + dateDeals.length}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Active campaigns</span>
            </div>
          </div>

          {/* Daily Work Completed & Pending Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed Tasks */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Completed Work & Milestones
                </h3>
              </div>

              {selectedEntry?.tasksCompleted && selectedEntry.tasksCompleted.length > 0 ? (
                <ul className="space-y-2 text-xs text-neutral-700">
                  {selectedEntry.tasksCompleted.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{task.replace(/^[•\-*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  No individual task bullet points listed.
                </p>
              )}
            </div>

            {/* Pending Tasks */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Pending Tasks & Blockers
                </h3>
              </div>

              {selectedEntry?.tasksPending && selectedEntry.tasksPending.length > 0 ? (
                <ul className="space-y-2 text-xs text-neutral-700">
                  {selectedEntry.tasksPending.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{task.replace(/^[•\-*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  No pending blockers logged for this date.
                </p>
              )}
            </div>
          </div>

          {/* Detailed Notes and Activities Log */}
          {selectedEntry?.notes && (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-neutral-600" />
                <span>Daily Activity Log & Operation Notes</span>
              </div>
              <div className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed pl-6">
                {selectedEntry.notes}
              </div>
            </div>
          )}

          {/* Connected Brand Deals on this Date */}
          {((selectedEntry?.dealsHandled && selectedEntry.dealsHandled.length > 0) || dateDeals.length > 0) && (
            <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Brand Deals & Deliverables on this Date
                </h3>
              </div>

              <div className="divide-y divide-neutral-100">
                {selectedEntry?.dealsHandled?.map((dealH, idx) => {
                  const fullDeal = deals.find((d) => d.id === dealH.dealId);
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-neutral-900">{dealH.brandName}</span>
                        <span className="text-neutral-400 mx-1.5">·</span>
                        <span className="text-neutral-600">{dealH.campaignName}</span>
                        {dealH.updateSummary && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{dealH.updateSummary}</p>
                        )}
                      </div>
                      {fullDeal && (
                        <div className="text-right font-mono">
                          <span className="font-bold text-neutral-900 block">
                            {formatCurrency(fullDeal.dealValue)}
                          </span>
                          <span className="text-[10px] text-emerald-600 block">
                            Net Profit: {formatCurrency(fullDeal.netProfit)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {dateDeals.map((deal) => (
                  <div key={deal.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-900">{deal.brandName}</span>
                      <span className="text-neutral-400 mx-1.5">·</span>
                      <span className="text-neutral-600">{deal.campaignName}</span>
                      <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-neutral-100 text-neutral-600">
                        Deadline
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-neutral-900 block">
                        {formatCurrency(deal.dealValue)}
                      </span>
                      <span className="text-[10px] text-emerald-600 block">
                        Profit: {formatCurrency(deal.netProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Senior Review Section */}
          <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-700" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Senior Management Review & Approvals
                </h3>
              </div>
              {selectedEntry?.seniorReview?.status && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                    selectedEntry.seniorReview.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedEntry.seniorReview.status === 'action_required'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {selectedEntry.seniorReview.status.replace('_', ' ')}
                </span>
              )}
            </div>

            {selectedEntry?.seniorReview?.feedback ? (
              <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
                <p className="text-neutral-800 font-medium">"{selectedEntry.seniorReview.feedback}"</p>
                <p className="text-[11px] text-neutral-400">
                  Reviewed by {selectedEntry.seniorReview.reviewedBy || 'David Vance (Senior)'} ·{' '}
                  {selectedEntry.seniorReview.reviewedAt
                    ? new Date(selectedEntry.seniorReview.reviewedAt).toLocaleDateString()
                    : 'Recorded'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">
                Awaiting review from Senior Operations Director.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
