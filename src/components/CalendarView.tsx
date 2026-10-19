import React, { useState } from 'react';
import { DailyWorkEntry, PerformanceRating, User } from '../types';
import {
  getMonthMatrix,
  formatISODate,
  MONTH_NAMES,
} from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface CalendarViewProps {
  currentUser: User;
  dailyWork: Record<string, DailyWorkEntry>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenCreateOrEdit: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  dailyWork,
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
      // Not Sunday
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

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Month Header Card (Matches Screenshot 2) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-700">
            <CalendarIcon className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
              {MONTH_NAMES[month]} {year}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Permanent agency work journal · Monday to Saturday working days
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

      {/* 6 Metric Cards Grid (Matches Screenshot 2) */}
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

      {/* Calendar Grid (Matches Screenshot 3) */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/60 text-xs font-semibold text-neutral-700">
          <div className="py-3 px-2 text-center">Mon</div>
          <div className="py-3 px-2 text-center">Tue</div>
          <div className="py-3 px-2 text-center">Wed</div>
          <div className="py-3 px-2 text-center">Thu</div>
          <div className="py-3 px-2 text-center">Fri</div>
          <div className="py-3 px-2 text-center">Sat</div>
          <div className="py-3 px-2 text-center bg-neutral-100/60 text-neutral-400 flex items-center justify-center gap-1">
            <span>Sun (Off)</span>
            <Lock className="w-3 h-3 text-neutral-400" />
          </div>
        </div>

        {/* Days Matrix */}
        <div className="divide-y divide-neutral-200">
          {monthMatrix.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-neutral-200">
              {week.map((date, dayIdx) => {
                const dateStr = formatISODate(date);
                const isCurrentMonth = date.getMonth() === month;
                const isSunday = dayIdx === 6; // Last column is Sunday
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === '2026-10-19';
                const entry = dailyWork[dateStr];

                if (isSunday) {
                  // Shaded weekly off column (Matches Screenshot 3)
                  return (
                    <div
                      key={dateStr}
                      className="min-h-[110px] sm:min-h-[120px] p-2 bg-neutral-100/40 flex flex-col justify-between select-none"
                    >
                      <div className="flex items-center gap-1 text-neutral-400 text-xs font-mono">
                        <span>{date.getDate()}</span>
                        <span className="text-[10px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Off
                        </span>
                      </div>
                      <div className="text-center text-xs text-neutral-400 italic">
                        Weekly Off
                      </div>
                      <div />
                    </div>
                  );
                }

                // Working day (Monday to Saturday)
                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      if (isCurrentMonth) {
                        onSelectDate(dateStr);
                      }
                    }}
                    className={`min-h-[110px] sm:min-h-[125px] p-2.5 flex flex-col justify-between transition-colors cursor-pointer relative ${
                      !isCurrentMonth
                        ? 'bg-neutral-50/30 text-neutral-300 pointer-events-none'
                        : entry?.performanceRating === 'green'
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                        : entry?.performanceRating === 'yellow'
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : entry?.performanceRating === 'red'
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'bg-white hover:bg-neutral-50'
                    } ${isSelected ? 'ring-2 ring-neutral-900 ring-inset z-10' : ''}`}
                  >
                    {/* Top Date Header */}
                    <div className="flex items-start justify-between">
                      {isToday ? (
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {date.getDate()}
                        </div>
                      ) : (
                        <span className={`text-xs font-bold font-mono ${isCurrentMonth ? 'text-neutral-900' : 'text-neutral-300'}`}>
                          {date.getDate()}
                        </span>
                      )}

                      {/* Performance dot badge */}
                      {entry && (
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            entry.performanceRating === 'green'
                              ? 'bg-emerald-500'
                              : entry.performanceRating === 'yellow'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      )}
                    </div>

                    {/* Middle Content */}
                    <div className="my-1">
                      {entry ? (
                        <div className="space-y-0.5 text-left">
                          <p className="text-[11px] font-medium text-neutral-800 line-clamp-2 leading-tight">
                            {entry.tasksCompleted && entry.tasksCompleted[0]
                              ? entry.tasksCompleted[0]
                              : entry.notes
                              ? entry.notes.slice(0, 45) + '...'
                              : 'Work log recorded'}
                          </p>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {entry.creatorsLocked} locked · {entry.deliverablesCompleted} deliv.
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400 italic">
                          Click to log work...
                        </div>
                      )}
                    </div>

                    {/* Bottom Status label */}
                    <div className="text-[10px] text-neutral-400">
                      {entry ? (
                        <span className="font-medium text-neutral-700 capitalize">
                          {entry.performanceRating === 'green'
                            ? 'Target met'
                            : entry.performanceRating === 'yellow'
                            ? 'Minor blocker'
                            : 'Missed target'}
                        </span>
                      ) : (
                        <span>No update</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
