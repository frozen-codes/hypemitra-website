import React, { useState } from 'react';
import { BrandDeal, User } from '../types';
import { calculateFinancials, formatCurrency } from '../utils/financialUtils';
import {
  Plus,
  Search,
  Briefcase,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface DealsViewProps {
  currentUser: User;
  deals: BrandDeal[];
  onOpenCreateDeal: () => void;
  onEditDeal: (deal: BrandDeal) => void;
  onDeleteDeal: (dealId: string) => Promise<void>;
}

export const DealsView: React.FC<DealsViewProps> = ({
  currentUser,
  deals,
  onOpenCreateDeal,
  onEditDeal,
  onDeleteDeal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isHR = currentUser.role === 'hr';

  // Overall financial summary
  const summary = calculateFinancials(deals);

  // Filtered deals
  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete brand deal "${name}"?`)) {
      setDeletingId(id);
      try {
        await onDeleteDeal(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <span className="text-blue-700 font-medium">In Progress</span>;
      case 'completed':
        return <span className="text-emerald-700 font-medium">Completed</span>;
      case 'lead':
        return <span className="text-purple-700 font-medium">Lead</span>;
      case 'on-hold':
        return <span className="text-amber-700 font-medium">On Hold</span>;
      default:
        return <span className="text-neutral-500 font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Brand Deals & Creator Tracking
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time tracking of deal values, recognized revenue, creator expenses, and profit margins.
          </p>
        </div>

        {isHR && (
          <button
            onClick={onOpenCreateDeal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand Deal</span>
          </button>
        )}
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Agreed Contract Value
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(summary.totalAgreedValue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Total portfolio commitments
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Recognized Revenue
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(summary.totalRecognizedRevenue)}
          </div>
          <div className="text-[11px] text-amber-700 font-mono mt-1">
            {formatCurrency(summary.totalOutstanding)} outstanding
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Expenses
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            {formatCurrency(summary.totalCreatorExpenses)} creator payouts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Net Profit & Margin
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(summary.netProfit)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 font-mono mt-1">
            {summary.profitMargin}% net margin
          </div>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brand or campaign..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        {/* Status segmented control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg w-full sm:w-auto overflow-x-auto">
          {['all', 'in-progress', 'completed', 'lead', 'on-hold'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {st === 'all'
                ? 'All Deals'
                : st === 'in-progress'
                ? 'In Progress'
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Deals High-Density Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Brand & Campaign</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Agreed Value</th>
                <th className="py-3 px-3 text-right">Revenue Recv.</th>
                <th className="py-3 px-3 text-right">Expenses</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-center">Margin</th>
                <th className="py-3 px-3 text-center">Creators (L/C/P)</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{deal.brandName}</div>
                      <div className="text-[11px] text-neutral-500">{deal.campaignName}</div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(deal.status)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-neutral-900">
                      {formatCurrency(deal.dealValue)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-emerald-600">
                      {formatCurrency(deal.brandRevenueReceived)}
                      {deal.outstandingPayments > 0 && (
                        <div className="text-[10px] text-amber-600 font-sans">
                          {formatCurrency(deal.outstandingPayments)} due
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-neutral-600">
                      {formatCurrency(deal.totalExpenses)}
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-mono font-bold ${
                        deal.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(deal.netProfit)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          deal.profitMargin >= 40
                            ? 'text-emerald-700'
                            : deal.profitMargin >= 20
                            ? 'text-neutral-800'
                            : 'text-amber-700'
                        }`}
                      >
                        {deal.profitMargin}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="text-neutral-900 font-medium" title="Locked">
                        {deal.creatorsLocked}
                      </span>
                      <span className="text-neutral-300 mx-1">/</span>
                      <span className="text-emerald-600 font-medium" title="Completed">
                        {deal.creatorsCompleted}
                      </span>
                      <span className="text-neutral-300 mx-1">/</span>
                      <span className="text-amber-600" title="Pending">
                        {deal.creatorsPending}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-neutral-600 whitespace-nowrap">
                      {deal.deadline}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditDeal(deal)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                          title="Edit deal details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isHR && (
                          <button
                            onClick={() => handleDelete(deal.id, deal.brandName)}
                            disabled={deletingId === deal.id}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete deal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-400 italic">
                    No brand deals match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
