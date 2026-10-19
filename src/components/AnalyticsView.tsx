import React from 'react';
import { BrandDeal, DailyWorkEntry, User, WeeklyTarget } from '../types';
import { calculateFinancials, formatCurrency } from '../utils/financialUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface AnalyticsViewProps {
  deals: BrandDeal[];
  dailyWork: Record<string, DailyWorkEntry>;
  weeklyTargets: Record<string, WeeklyTarget>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  deals,
  dailyWork,
  weeklyTargets,
}) => {
  const summary = calculateFinancials(deals);

  // Deal-wise financial chart data
  const dealFinancialData = deals.map((d) => ({
    name: d.brandName,
    'Revenue Received': d.brandRevenueReceived,
    'Total Expenses': d.totalExpenses,
    'Net Profit': d.netProfit,
  }));

  // Creator Pipeline Data for Donut Chart
  const creatorData = [
    { name: 'Completed', value: summary.totalCreatorsCompleted, color: '#10B981' },
    { name: 'Pending Delivery', value: summary.totalCreatorsPending, color: '#F59E0B' },
    { name: 'Locked / Filming', value: Math.max(0, summary.totalCreatorsLocked - summary.totalCreatorsCompleted - summary.totalCreatorsPending), color: '#3B82F6' },
    { name: 'Declined', value: summary.totalCreatorsDeclined, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  // Calendar Performance Distribution
  const allEntries = Object.values(dailyWork);
  const greenDays = allEntries.filter((e) => e.performanceRating === 'green').length;
  const yellowDays = allEntries.filter((e) => e.performanceRating === 'yellow').length;
  const redDays = allEntries.filter((e) => e.performanceRating === 'red').length;

  // Completed Deals
  const completedDeals = deals.filter((d) => d.status === 'completed');
  const activeDeals = deals.filter((d) => d.status === 'in-progress');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Monthly Analytics & Profit Reports
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Detailed breakdown of net profit (Recognized Revenue − Total Expenses), deal margins, and creator activity.
        </p>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Recognized Revenue
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(summary.totalRecognizedRevenue)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Agreed committed: {formatCurrency(summary.totalAgreedValue)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Operational Costs
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {formatCurrency(summary.totalCreatorExpenses)} creators · {formatCurrency(summary.totalAdditionalExpenses)} other
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Net Profit
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(summary.netProfit)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Revenue minus all expenses
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Profit Margin %
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {summary.profitMargin}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {completedDeals.length} completed · {activeDeals.length} in progress
          </div>
        </div>
      </div>

      {/* Main Charts: Deal-wise Financials & Creator Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal-wise Comparison Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Deal-wise Revenue, Expenses & Net Profit
            </h3>
            <span className="text-xs text-neutral-400 font-mono">INR (₹)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealFinancialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Revenue Received" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total Expenses" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Profit" fill="#0F172A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Creator Pipeline Distribution */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Creator Pipeline Roster
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Status of all creator collaborations
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={creatorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {creatorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 text-xs pt-2 border-t border-neutral-100">
            {creatorData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-neutral-600">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-neutral-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Health & Outstanding Receivables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar Health Log */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Calendar Work Performance Health
          </h3>
          <p className="text-xs text-neutral-500">
            Recorded distribution of daily work performance ratings across all logged dates.
          </p>

          <div className="space-y-2.5 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-emerald-800">Target Achieved (Green)</span>
                <span className="font-mono font-bold">{greenDays} days</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${allEntries.length ? (greenDays / allEntries.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-amber-800">Average / Below Target (Yellow)</span>
                <span className="font-mono font-bold">{yellowDays} days</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${allEntries.length ? (yellowDays / allEntries.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-rose-800">Poor / Escalation (Red)</span>
                <span className="font-mono font-bold">{redDays} days</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${allEntries.length ? (redDays / allEntries.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables Ledger */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Pending Brand Receivables
            </h3>
            <span className="font-mono font-bold text-sm text-amber-700">
              {formatCurrency(summary.totalOutstanding)}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Remaining payments due upon milestone deliverables completion:
          </p>

          <div className="divide-y divide-neutral-100 text-xs">
            {deals
              .filter((d) => d.outstandingPayments > 0)
              .map((d) => (
                <div key={d.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900">{d.brandName}</span>
                    <span className="text-neutral-400 mx-1">·</span>
                    <span className="text-neutral-500">{d.campaignName}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatCurrency(d.outstandingPayments)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
