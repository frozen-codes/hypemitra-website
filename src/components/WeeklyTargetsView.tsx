import React, { useState } from 'react';
import { BrandDeal, DailyWorkEntry, User, WeeklyTarget } from '../types';
import { calculateWeeklyActuals, formatCurrency } from '../utils/financialUtils';
import {
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Save,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface WeeklyTargetsViewProps {
  currentUser: User;
  weeklyTargets: Record<string, WeeklyTarget>;
  dailyWork: Record<string, DailyWorkEntry>;
  deals: BrandDeal[];
  onSaveWeeklyTarget: (target: WeeklyTarget) => Promise<void>;
}

export const WeeklyTargetsView: React.FC<WeeklyTargetsViewProps> = ({
  currentUser,
  weeklyTargets,
  dailyWork,
  deals,
  onSaveWeeklyTarget,
}) => {
  // Current active week in October 2026
  const availableWeeks = ['2026-W41', '2026-W42', '2026-W43', '2026-W44'];
  const [selectedWeekId, setSelectedWeekId] = useState('2026-W42');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const isSenior = currentUser.role === 'senior';

  const currentTarget: WeeklyTarget = weeklyTargets[selectedWeekId] || {
    id: selectedWeekId,
    year: 2026,
    weekNumber: parseInt(selectedWeekId.split('-W')[1]) || 42,
    startDate: selectedWeekId === '2026-W41' ? '2026-10-05' : selectedWeekId === '2026-W42' ? '2026-10-12' : selectedWeekId === '2026-W43' ? '2026-10-19' : '2026-10-26',
    endDate: selectedWeekId === '2026-W41' ? '2026-10-11' : selectedWeekId === '2026-W42' ? '2026-10-18' : selectedWeekId === '2026-W43' ? '2026-10-25' : '2026-11-01',
    targetRevenue: 55000,
    targetProfit: 25000,
    targetCreatorsLocked: 16,
    targetDeliverables: 20,
    notes: 'Standard operations week goals',
    setBy: 'David Vance (Senior Director)',
    updatedAt: new Date().toISOString(),
  };

  // Target editable state
  const [targetRevenue, setTargetRevenue] = useState(currentTarget.targetRevenue);
  const [targetProfit, setTargetProfit] = useState(currentTarget.targetProfit);
  const [targetCreatorsLocked, setTargetCreatorsLocked] = useState(currentTarget.targetCreatorsLocked);
  const [targetDeliverables, setTargetDeliverables] = useState(currentTarget.targetDeliverables);
  const [targetNotes, setTargetNotes] = useState(currentTarget.notes);

  // Sync state when week changes
  const handleSelectWeek = (weekId: string) => {
    setSelectedWeekId(weekId);
    setIsEditing(false);
    const t = weeklyTargets[weekId] || currentTarget;
    setTargetRevenue(t.targetRevenue);
    setTargetProfit(t.targetProfit);
    setTargetCreatorsLocked(t.targetCreatorsLocked);
    setTargetDeliverables(t.targetDeliverables);
    setTargetNotes(t.notes);
  };

  // Calculate actuals
  const actuals = calculateWeeklyActuals(
    currentTarget.startDate,
    currentTarget.endDate,
    dailyWork,
    deals
  );

  const revenuePercent = targetRevenue > 0 ? Math.round((actuals.recognizedRevenue / targetRevenue) * 100) : 0;
  const profitPercent = targetProfit > 0 ? Math.round((actuals.netProfit / targetProfit) * 100) : 0;
  const creatorsPercent = targetCreatorsLocked > 0 ? Math.round((actuals.creatorsLocked / targetCreatorsLocked) * 100) : 0;
  const deliverablesPercent = targetDeliverables > 0 ? Math.round((actuals.deliverablesCompleted / targetDeliverables) * 100) : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: WeeklyTarget = {
        ...currentTarget,
        targetRevenue: Number(targetRevenue) || 0,
        targetProfit: Number(targetProfit) || 0,
        targetCreatorsLocked: Number(targetCreatorsLocked) || 0,
        targetDeliverables: Number(targetDeliverables) || 0,
        notes: targetNotes,
        setBy: currentUser.name,
        updatedAt: new Date().toISOString(),
      };
      await onSaveWeeklyTarget(updated);
      setIsEditing(false);
      setSaveMsg('Weekly targets updated and saved.');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusText = (pct: number) => {
    if (pct >= 100) return { label: 'Target Exceeded', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 75) return { label: 'On Track', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 50) return { label: 'Pacing Behind', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Critical Gap', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Week Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Weekly Targets & Performance
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono">
              {currentTarget.startDate} to {currentTarget.endDate}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Compare actual weekly agency delivery, revenue, and creator milestones against configured leadership goals.
          </p>
        </div>

        {/* Week Switcher & Senior Edit Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg">
            {availableWeeks.map((wId) => (
              <button
                key={wId}
                onClick={() => handleSelectWeek(wId)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                  selectedWeekId === wId
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {wId}
              </button>
            ))}
          </div>

          {isSenior && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Configure Targets</span>
            </button>
          )}
        </div>
      </div>

      {saveMsg && (
        <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Senior Target Editor Panel (when editing is active) */}
      {isEditing && (
        <div className="bg-white p-5 rounded-xl border-2 border-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Senior Target Configuration: {selectedWeekId}
              </h3>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Target Revenue (₹)
              </label>
              <input
                type="number"
                step="10000"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Target Profit (₹)
              </label>
              <input
                type="number"
                step="10000"
                value={targetProfit}
                onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Target Creators Locked
              </label>
              <input
                type="number"
                value={targetCreatorsLocked}
                onChange={(e) => setTargetCreatorsLocked(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Target Deliverables
              </label>
              <input
                type="number"
                value={targetDeliverables}
                onChange={(e) => setTargetDeliverables(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Senior Directives & Weekly Focus Notes
            </label>
            <textarea
              rows={2}
              value={targetNotes}
              onChange={(e) => setTargetNotes(e.target.value)}
              placeholder="State key priorities, deals to close, risk mitigation instructions..."
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Apply Weekly Targets'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Target Comparison 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Recognized Revenue
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusText(revenuePercent).color}`}>
                {getStatusText(revenuePercent).label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-neutral-900">
                {formatCurrency(actuals.recognizedRevenue)}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                / {formatCurrency(targetRevenue)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mb-1">
              <span>Progress</span>
              <span>{revenuePercent}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  revenuePercent >= 100
                    ? 'bg-emerald-500'
                    : revenuePercent >= 75
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, revenuePercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Weekly Net Profit
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusText(profitPercent).color}`}>
                {getStatusText(profitPercent).label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600">
                {formatCurrency(actuals.netProfit)}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                / {formatCurrency(targetProfit)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mb-1">
              <span>Progress</span>
              <span>{profitPercent}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  profitPercent >= 100
                    ? 'bg-emerald-500'
                    : profitPercent >= 75
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, profitPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Creators Locked Card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Creators Locked
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusText(creatorsPercent).color}`}>
                {getStatusText(creatorsPercent).label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-neutral-900">
                {actuals.creatorsLocked}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                / {targetCreatorsLocked} target
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mb-1">
              <span>Progress</span>
              <span>{creatorsPercent}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  creatorsPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, creatorsPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Deliverables Card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Deliverables Completed
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusText(deliverablesPercent).color}`}>
                {getStatusText(deliverablesPercent).label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-neutral-900">
                {actuals.deliverablesCompleted}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                / {targetDeliverables} target
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mb-1">
              <span>Progress</span>
              <span>{deliverablesPercent}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  deliverablesPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, deliverablesPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Week Daily Breakdown & Quality Log */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quality Distribution */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Calendar Quality Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Target Achieved Days</span>
              </div>
              <span className="font-bold font-mono">{actuals.greenDays} days</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Below Target Days</span>
              </div>
              <span className="font-bold font-mono">{actuals.yellowDays} days</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 text-rose-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Poor Performance Days</span>
              </div>
              <span className="font-bold font-mono">{actuals.redDays} days</span>
            </div>
          </div>
        </div>

        {/* Senior Notes / Direction */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Senior Leadership Directive for Week
            </h3>
            <span className="text-[11px] text-neutral-500">
              Set by {currentTarget.setBy}
            </span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 leading-relaxed min-h-[80px]">
            {currentTarget.notes || 'No custom notes set for this weekly target.'}
          </div>
        </div>
      </div>
    </div>
  );
};
