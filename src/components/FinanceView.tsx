import React, { useState } from 'react';
import { BrandDeal, DealStatus, User, WeeklyTarget } from '../types';
import { formatCurrency } from '../utils/financialUtils';
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
} from 'lucide-react';

interface FinanceViewProps {
  currentUser: User;
  deals: BrandDeal[];
  weeklyTargets: Record<string, WeeklyTarget>;
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
  onBackToCalendar,
  onOpenCreateDeal,
  onEditDeal,
  onDeleteDeal,
  onSaveWeeklyTarget,
  onExportCSV,
}) => {
  // Current active week in screenshots is Oct 19 - Oct 25, 2026 (2026-W43)
  const [selectedWeekId, setSelectedWeekId] = useState('2026-W43');
  const [subTab, setSubTab] = useState<'deals' | 'closing' | 'reports'>('deals');
  const [dealFilter, setDealFilter] = useState<'all' | 'locked' | 'pending' | 'cancelled'>('all');
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const isSenior = currentUser.role === 'senior';
  const isHR = currentUser.role === 'hr';

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

  // Filter deals for this week or overall
  const weekDeals = deals.filter((d) => {
    // If deal has weekId, match; or match by deadline/updatedAt range
    if (d.weekId) return d.weekId === selectedWeekId;
    return d.deadline >= currentTarget.startDate && d.deadline <= currentTarget.endDate;
  });

  // Calculate locked revenue (only 'locked' status counts as noted in screenshot)
  const lockedDeals = weekDeals.filter((d) => d.status === 'locked');
  const pendingDeals = weekDeals.filter((d) => d.status === 'pending' || d.status === 'in-progress');
  const cancelledDeals = weekDeals.filter((d) => d.status === 'cancelled');

  const lockedRevenue = lockedDeals.reduce((sum, d) => sum + (d.brandRevenueReceived || d.dealValue || 0), 0);
  const totalCreatorPayouts = lockedDeals.reduce((sum, d) => sum + (d.creatorPayments || 0), 0);
  const totalOtherCosts = lockedDeals.reduce((sum, d) => sum + (d.additionalExpenses || 0), 0);
  const estimatedProfit = lockedRevenue - (totalCreatorPayouts + totalOtherCosts);

  const totalBrandsLocked = lockedDeals.length;
  const totalCreatorsLockedCount = lockedDeals.reduce((sum, d) => sum + (d.creatorsLocked || 0), 0);

  const targetAmount = currentTarget.targetRevenue || 650000;
  const achievementPercent = targetAmount > 0 ? Math.round((lockedRevenue / targetAmount) * 100) : 0;
  const toGoAmount = Math.max(0, targetAmount - lockedRevenue);

  const filteredDisplayDeals = weekDeals.filter((d) => {
    if (dealFilter === 'locked') return d.status === 'locked';
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

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Back to Calendar Navigation */}
      <div>
        <button
          onClick={onBackToCalendar}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Daily Calendar</span>
        </button>
      </div>

      {/* Main Finance Header Card (Matches Screenshot 4) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IndianRupee className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
                Finance & Deal Tracking
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Weekly financial targets, brand deliverables, creator payouts, and agency profit
              </p>
            </div>
          </div>
        </div>

        {/* Week Selector & Top Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-neutral-100">
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
                {selectedWeekId === '2026-W43' ? 'Oct 19 – Oct 25, 2026' : 'Oct 12 – Oct 18, 2026'}
              </span>
            </div>

            <button
              onClick={() => setSelectedWeekId(selectedWeekId === '2026-W42' ? '2026-W43' : '2026-W42')}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedWeekId('2026-W43')}
              className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer ml-1"
            >
              This Week
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

        {/* Inline Target Editor when active */}
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
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6 Financial Metric KPI Cards (Matches Screenshot 4) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Weekly Target */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              WEEKLY TARGET
            </span>
            <IndianRupee className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {formatCurrency(targetAmount)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Monday to Sunday
          </span>
        </div>

        {/* Locked Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              LOCKED REVENUE
            </span>
            <Briefcase className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {formatCurrency(lockedRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {lockedDeals.length} Deals ({pendingDeals.length} Pending)
          </span>
        </div>

        {/* Achievement */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 border-l-4 border-l-rose-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              ACHIEVEMENT
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-600 mt-2">
            {achievementPercent}%
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {formatCurrency(toGoAmount)} to go
          </span>
        </div>

        {/* Brands & Creators */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              BRANDS & CREATORS
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {totalBrandsLocked} / {totalCreatorsLockedCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Brands / Creators locked
          </span>
        </div>

        {/* Creator Payouts */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
            CREATOR PAYOUTS
          </span>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            {formatCurrency(totalCreatorPayouts)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            + {formatCurrency(totalOtherCosts)} other costs
          </span>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">
              ESTIMATED PROFIT
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-600 mt-2">
            {formatCurrency(estimatedProfit)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Locked — Payouts — Costs
          </span>
        </div>
      </div>

      {/* Target Progress Bar Card (Matches Screenshot 1) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
          <span>Weekly Target Achievement Progress:</span>
          <span className="font-mono">
            {formatCurrency(lockedRevenue)} of {formatCurrency(targetAmount)} ({achievementPercent}%)
          </span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              achievementPercent >= 100
                ? 'bg-emerald-500'
                : achievementPercent > 0
                ? 'bg-blue-600'
                : 'bg-neutral-300'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, achievementPercent))}%` }}
          />
        </div>
      </div>

      {/* Sub-tabs Navigation Strip (Matches Screenshot 1) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSubTab('deals')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'deals'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Weekly Deals ({weekDeals.length})
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
          Monthly & Yearly Financial Reports
        </button>
      </div>

      {/* TAB 1: WEEKLY DEALS */}
      {subTab === 'deals' && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDealFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'all'
                  ? 'bg-neutral-200 text-neutral-900 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All Deals ({weekDeals.length})
            </button>
            <button
              onClick={() => setDealFilter('locked')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'locked'
                  ? 'bg-neutral-200 text-neutral-900 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Locked ({lockedDeals.length})
            </button>
            <button
              onClick={() => setDealFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'pending'
                  ? 'bg-neutral-200 text-neutral-900 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Pending ({pendingDeals.length})
            </button>
            <button
              onClick={() => setDealFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                dealFilter === 'cancelled'
                  ? 'bg-neutral-200 text-neutral-900 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Cancelled ({cancelledDeals.length})
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 italic">
            Note: Only deals with 'Locked' status count towards weekly revenue.
          </p>

          {/* Deals Content or Empty State */}
          {filteredDisplayDeals.length > 0 ? (
            <div className="space-y-3">
              {filteredDisplayDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-300 transition-colors"
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
                    <div className="flex items-center gap-3 text-[11px] text-neutral-600 mt-2 font-mono">
                      <span>Creators: {deal.creatorsLocked} locked</span>
                      <span>·</span>
                      <span>Deadline: {deal.deadline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-sans">
                        Deal Value
                      </span>
                      <span className="text-base font-bold font-serif text-neutral-900">
                        {formatCurrency(deal.dealValue)}
                      </span>
                      <span className="text-[11px] text-emerald-600 block font-mono">
                        Profit: {formatCurrency(deal.netProfit)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
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
              ))}
            </div>
          ) : (
            /* Empty State matching Screenshot 1 */
            <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                <Briefcase className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                No brand deals found for this week ({selectedWeekId === '2026-W43' ? 'Oct 19 – Oct 25, 2026' : 'Oct 12 – Oct 18, 2026'}).
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

      {/* TAB 2: WEEKLY CLOSING & SATURDAY SUMMARY */}
      {subTab === 'closing' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4">
          <h3 className="text-base font-bold text-neutral-900 font-serif">
            Weekly Closing & Saturday Executive Summary
          </h3>
          <p className="text-xs text-neutral-500">
            Automated Saturday review reconciling all finalized deals, deliverables, and outstanding creator payments.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Total Revenue</span>
              <span className="text-lg font-bold font-serif text-neutral-900 mt-1 block">
                {formatCurrency(lockedRevenue)}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Creator Payouts</span>
              <span className="text-lg font-bold font-serif text-neutral-900 mt-1 block">
                {formatCurrency(totalCreatorPayouts)}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Net Agency Profit</span>
              <span className="text-lg font-bold font-serif text-emerald-600 mt-1 block">
                {formatCurrency(estimatedProfit)}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Locked Creators</span>
              <span className="text-lg font-bold font-serif text-neutral-900 mt-1 block">
                {totalCreatorsLockedCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY & YEARLY REPORTS */}
      {subTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4">
          <h3 className="text-base font-bold text-neutral-900 font-serif">
            Monthly & Yearly Financial Reports
          </h3>
          <p className="text-xs text-neutral-500">
            Portfolio summaries across all brand campaigns and creator roster engagements.
          </p>

          <div className="divide-y divide-neutral-100 text-xs">
            {deals.map((deal) => (
              <div key={deal.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900">{deal.brandName}</span>
                  <span className="text-neutral-400 mx-1.5">·</span>
                  <span className="text-neutral-600">{deal.campaignName}</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span>{formatCurrency(deal.dealValue)}</span>
                  <span className="font-bold text-emerald-600">
                    +{formatCurrency(deal.netProfit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
