import React, { useState } from 'react';
import { BrandDealRecord } from '../types';
import { getMonthMatrix, formatISODate, MONTH_NAMES } from '../utils/dateUtils';
import { calculateBrandDeal, formatCurrency } from '../utils/financialUtils';
import {
  IndianRupee,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  Users,
  Edit2,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

interface FinanceCalendarProps {
  deals: BrandDealRecord[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenCreateDeal: (dateStr: string) => void;
  onOpenEditDeal: (deal: BrandDealRecord) => void;
}

export const FinanceCalendar: React.FC<FinanceCalendarProps> = ({
  deals,
  selectedDate,
  onSelectDate,
  onOpenCreateDeal,
  onOpenEditDeal,
}) => {
  // Month state defaults to current date
  const [currentDate, setCurrentDate] = useState(() => new Date());

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
    const now = new Date();
    setCurrentDate(now);
    onSelectDate(formatISODate(now));
  };

  // Group deals by date
  const dealsByDate: Record<string, BrandDealRecord[]> = {};
  deals.forEach((deal) => {
    if (!dealsByDate[deal.dealDate]) {
      dealsByDate[deal.dealDate] = [];
    }
    dealsByDate[deal.dealDate].push(deal);
  });

  // Selected date deals
  const selectedDateDeals = dealsByDate[selectedDate] || [];

  const [selY, selM, selD] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(selY, selM - 1, selD);
  const selectedFormatted = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Month Navigation & Finance Calendar Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <IndianRupee className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 font-serif">
              Finance Calendar
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track brand deals, agreed contract values, creator payouts, and automatic agency margins by date
            </p>
          </div>
        </div>

        {/* Date Selector controls */}
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
            {[-2, -1, 0, 1, 2].map((offset) => {
              const y = new Date().getFullYear() + offset;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
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
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Finance Calendar Grid */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold text-neutral-700">
          <div className="py-2.5 px-2 text-center">Mon</div>
          <div className="py-2.5 px-2 text-center">Tue</div>
          <div className="py-2.5 px-2 text-center">Wed</div>
          <div className="py-2.5 px-2 text-center">Thu</div>
          <div className="py-2.5 px-2 text-center">Fri</div>
          <div className="py-2.5 px-2 text-center">Sat</div>
          <div className="py-2.5 px-2 text-center">Sun</div>
        </div>

        {/* Days Matrix */}
        <div className="divide-y divide-neutral-200">
          {monthMatrix.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-neutral-200">
              {week.map((date) => {
                const dateStr = formatISODate(date);
                const isCurrentMonth = date.getMonth() === month;
                const isSelected = selectedDate === dateStr;
                const dayDeals = dealsByDate[dateStr] || [];

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      if (isCurrentMonth) {
                        onSelectDate(dateStr);
                      }
                    }}
                    className={`min-h-[76px] sm:min-h-[88px] p-2 flex flex-col justify-between transition-all cursor-pointer relative text-left ${
                      !isCurrentMonth
                        ? 'bg-neutral-50/40 text-neutral-300 pointer-events-none'
                        : isSelected
                        ? 'ring-2 ring-neutral-900 bg-neutral-100/90 font-bold z-10'
                        : 'bg-white hover:bg-neutral-50/90 text-neutral-800'
                    }`}
                  >
                    {/* Date Number and deals badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono ${
                          isSelected
                            ? 'font-bold text-neutral-900'
                            : isCurrentMonth
                            ? 'font-semibold text-neutral-700'
                            : 'text-neutral-300'
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {dayDeals.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-neutral-900 text-white">
                          {dayDeals.length} {dayDeals.length === 1 ? 'deal' : 'deals'}
                        </span>
                      )}
                    </div>

                    {/* Brand Name Preview tags */}
                    <div className="w-full space-y-1 mt-1 overflow-hidden">
                      {dayDeals.slice(0, 2).map((d) => (
                        <div
                          key={d.id}
                          className="truncate text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium"
                          title={`${d.brandName} (${formatCurrency(d.totalDealAmount)})`}
                        >
                          {d.brandName}
                        </div>
                      ))}
                      {dayDeals.length > 2 && (
                        <span className="text-[9px] text-neutral-400 font-medium block">
                          +{dayDeals.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend bar */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/70 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-800">Finance Calendar:</span>
            <span>Click any date to view brands or add new brand deals on that day</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Total active brand deals: {deals.length}
          </div>
        </div>
      </div>

      {/* Selected Date View: Displays all brand deals for that date + Add Brand Option */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Date View Header with "Add Brand" option */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              {selectedDateObj.getDate()}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 font-serif">
                {selectedFormatted}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {selectedDateDeals.length} {selectedDateDeals.length === 1 ? 'brand deal' : 'brand deals'} scheduled on this date
              </p>
            </div>
          </div>

          {/* Add Brand Option inside the selected date's view */}
          <button
            type="button"
            onClick={() => onOpenCreateDeal(selectedDate)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Brand</span>
          </button>
        </div>

        {/* Brand Deals List for this Date */}
        <div className="p-6">
          {selectedDateDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateDeals.map((deal) => {
                const calc = calculateBrandDeal(deal);
                return (
                  <div
                    key={deal.id}
                    onClick={() => onOpenEditDeal(deal)}
                    className="p-5 rounded-2xl border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/60 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    {/* Brand Card Top Row */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-neutral-900 text-base font-serif group-hover:text-neutral-950 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-neutral-600" />
                            <span>{deal.brandName}</span>
                          </h3>
                          {deal.notes && (
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                              {deal.notes}
                            </p>
                          )}
                        </div>

                        {/* Brand Payment Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            deal.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : deal.paymentStatus === 'Partially Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {deal.paymentStatus}
                        </span>
                      </div>

                      {/* Creators Count Badge */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{deal.creators?.length || 0} {(deal.creators?.length || 0) === 1 ? 'Creator' : 'Creators'}</span>
                        </span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          Locking: {formatCurrency(calc.totalCreatorLocking)}
                        </span>
                      </div>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100 text-xs font-mono">
                      <div className="bg-neutral-50 p-2 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Total Deal Amount
                        </span>
                        <span className="font-bold text-neutral-900 mt-0.5 block">
                          {formatCurrency(calc.totalDealAmount)}
                        </span>
                      </div>

                      <div className="bg-neutral-50 p-2 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Amount Received
                        </span>
                        <span className="font-bold text-emerald-800 mt-0.5 block">
                          {formatCurrency(calc.amountReceived)}
                        </span>
                      </div>

                      <div className="bg-neutral-50 p-2 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Creator Payouts Due
                        </span>
                        <span className="font-bold text-neutral-900 mt-0.5 block">
                          {formatCurrency(calc.totalCreatorPayouts)}
                        </span>
                      </div>

                      <div className="bg-neutral-900 text-white p-2 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                          Agency Gross Margin
                        </span>
                        <span className="font-bold text-emerald-300 mt-0.5 block">
                          {formatCurrency(calc.agencyGrossMargin)}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Click to open complete details */}
                    <div className="flex items-center justify-between text-xs pt-1 text-neutral-500 font-medium">
                      <span>Click to view & edit complete details</span>
                      <span className="inline-flex items-center gap-1 text-neutral-900 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-700">
                No brand deals recorded on {selectedFormatted}
              </p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Click the "Add Brand" button above to record a brand deal, assign creators, and track payments on this date.
              </p>
              <button
                type="button"
                onClick={() => onOpenCreateDeal(selectedDate)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Brand for this Date</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
