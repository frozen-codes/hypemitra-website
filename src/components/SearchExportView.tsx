import React, { useState } from 'react';
import { BrandDeal, DailyWorkEntry, User } from '../types';
import { formatCurrency } from '../utils/financialUtils';
import { Search, Download, FileText, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';

interface SearchExportViewProps {
  dailyWork: Record<string, DailyWorkEntry>;
  deals: BrandDeal[];
  onSelectDate: (dateStr: string) => void;
}

export const SearchExportView: React.FC<SearchExportViewProps> = ({
  dailyWork,
  deals,
  onSelectDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Search in daily work entries
  const matchingWorkEntries = Object.values(dailyWork).filter((entry) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesNotes = entry.notes?.toLowerCase().includes(term);
    const matchesTasks = entry.tasksCompleted?.some((t) => t.toLowerCase().includes(term));
    const matchesDate = entry.date.includes(term);
    const matchesDeals = entry.dealsHandled?.some((d) => d.brandName.toLowerCase().includes(term));
    return matchesNotes || matchesTasks || matchesDate || matchesDeals;
  });

  // Search in deals
  const matchingDeals = deals.filter((deal) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      deal.brandName.toLowerCase().includes(term) ||
      deal.campaignName.toLowerCase().includes(term) ||
      deal.status.toLowerCase().includes(term)
    );
  });

  // Export Daily Work CSV
  const handleExportWorkCSV = () => {
    const headers = [
      'Date',
      'Performance Rating',
      'Creators Contacted',
      'Creators Locked',
      'Deliverables Completed',
      'Submitted By',
      'Last Editor',
      'Notes',
    ];

    const rows = Object.values(dailyWork).map((e) => [
      `"${e.date}"`,
      `"${e.performanceRating}"`,
      e.creatorsContacted || 0,
      e.creatorsLocked || 0,
      e.deliverablesCompleted || 0,
      `"${e.submittedBy || ''}"`,
      `"${e.lastEditorName || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hypemitra_daily_work_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccessMsg('Daily Work Journal exported to CSV.');
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  // Export Deals CSV
  const handleExportDealsCSV = () => {
    const headers = [
      'Brand',
      'Campaign',
      'Status',
      'Deal Value (INR)',
      'Revenue Received (INR)',
      'Outstanding (INR)',
      'Creator Payments (INR)',
      'Other Expenses (INR)',
      'Net Profit (INR)',
      'Profit Margin %',
      'Creators Locked',
      'Deadline',
    ];

    const rows = deals.map((d) => [
      `"${d.brandName}"`,
      `"${d.campaignName}"`,
      `"${d.status}"`,
      d.dealValue || 0,
      d.brandRevenueReceived || 0,
      d.outstandingPayments || 0,
      d.creatorPayments || 0,
      d.additionalExpenses || 0,
      d.netProfit || 0,
      d.profitMargin || 0,
      d.creatorsLocked || 0,
      `"${d.deadline}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hypemitra_deals_finance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccessMsg('Finance & Deals data exported to CSV.');
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Search Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
            Search & CSV Export
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Full-text search across all work journal logs, brand campaigns, and one-click data downloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportWorkCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Work Journal CSV</span>
          </button>

          <button
            onClick={handleExportDealsCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Finance CSV</span>
          </button>
        </div>
      </div>

      {exportSuccessMsg && (
        <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Search Input Field */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords, brand names, creator deliverables, notes, or dates (YYYY-MM-DD)..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Results Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Work Journal Results */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 uppercase font-sans tracking-wider">
              Work Journal Logs ({matchingWorkEntries.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {matchingWorkEntries.map((e) => (
              <div
                key={e.date}
                onClick={() => onSelectDate(e.date)}
                className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold font-mono text-neutral-900">{e.date}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-md font-bold uppercase ${
                      e.performanceRating === 'green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : e.performanceRating === 'yellow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {e.performanceRating}
                  </span>
                </div>
                <p className="text-neutral-600 line-clamp-2 leading-relaxed">
                  {e.notes || (e.tasksCompleted && e.tasksCompleted[0]) || 'Daily log recorded.'}
                </p>
                <div className="text-[10px] text-neutral-400 mt-1.5 flex items-center gap-2">
                  <span>By {e.submittedBy || 'Shraddha Tiwari'}</span>
                  <span>·</span>
                  <span>{e.creatorsLocked} locked</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals Results */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 uppercase font-sans tracking-wider">
              Brand Deals ({matchingDeals.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {matchingDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-3 rounded-xl border border-neutral-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-neutral-900">{deal.brandName}</div>
                  <div className="text-neutral-500 text-[11px]">{deal.campaignName}</div>
                  <span
                    className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                      deal.status === 'locked'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {deal.status}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-neutral-900">{formatCurrency(deal.dealValue)}</div>
                  <div className="text-[11px] text-emerald-600">
                    Net: {formatCurrency(deal.netProfit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
