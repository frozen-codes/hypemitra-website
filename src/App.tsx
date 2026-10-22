import React, { useState, useEffect } from 'react';
import { AppDatabase, BrandDealRecord, ExpenseRecord, PerformanceDayEntry } from './types';
import { api } from './services/api';
import { CreatorPerformanceCalendar } from './components/CreatorPerformanceCalendar';
import { FinanceCalendar } from './components/FinanceCalendar';
import { WeeklyReportsView } from './components/WeeklyReportsView';
import { BrandDealModal } from './components/BrandDealModal';
import { NetworkStatusBadge, OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Calendar as CalendarIcon,
  IndianRupee,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const todayISO = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'performance' | 'finance' | 'reports'>('performance');
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const [db, setDb] = useState<AppDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  // Brand Deal modal state
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<BrandDealRecord | null>(null);
  const [modalDate, setModalDate] = useState(todayISO);

  const loadDatabase = async () => {
    try {
      const data = await api.fetchDatabase();
      setDb(data);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
    // Poll periodically to catch updates
    const interval = setInterval(loadDatabase, 15000);
    return () => clearInterval(interval);
  }, []);

  // Performance handlers
  const handleSavePerformance = async (entry: PerformanceDayEntry) => {
    const saved = await api.savePerformance(entry);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        performance: {
          ...prev.performance,
          [saved.date]: saved,
        },
      };
    });
  };

  // Brand deal handlers
  const handleOpenCreateDeal = (dateStr?: string) => {
    setDealToEdit(null);
    setModalDate(dateStr || selectedDate);
    setIsDealModalOpen(true);
  };

  const handleOpenEditDeal = (deal: BrandDealRecord) => {
    setDealToEdit(deal);
    setModalDate(deal.dealDate);
    setIsDealModalOpen(true);
  };

  const handleSaveDeal = async (dealData: Partial<BrandDealRecord>) => {
    const saved = await api.saveBrandDeal(dealData);
    setDb((prev) => {
      if (!prev) return prev;
      const idx = prev.brandDeals.findIndex((d) => d.id === saved.id);
      const newDeals = [...prev.brandDeals];
      if (idx >= 0) {
        newDeals[idx] = saved;
      } else {
        newDeals.unshift(saved);
      }
      return {
        ...prev,
        brandDeals: newDeals,
      };
    });
  };

  const handleDeleteDeal = async (id: string) => {
    await api.deleteBrandDeal(id);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        brandDeals: prev.brandDeals.filter((d) => d.id !== id),
      };
    });
  };

  // Expense handlers
  const handleSaveExpense = async (expenseData: Partial<ExpenseRecord>) => {
    const saved = await api.saveExpense(expenseData);
    setDb((prev) => {
      if (!prev) return prev;
      const idx = prev.expenses.findIndex((e) => e.id === saved.id);
      const newExp = [...prev.expenses];
      if (idx >= 0) {
        newExp[idx] = saved;
      } else {
        newExp.unshift(saved);
      }
      return {
        ...prev,
        expenses: newExp,
      };
    });
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      };
    });
  };

  const handleResetData = async () => {
    if (confirm('Reset database to original sample records?')) {
      const reset = await api.resetData();
      setDb(reset);
    }
  };

  if (loading && !db) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-neutral-500 mt-3 font-medium">
          Loading workspace...
        </p>
      </div>
    );
  }

  const currentDb = db || {
    performance: {},
    brandDeals: [],
    expenses: [],
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Primary Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white font-black text-xs flex items-center justify-center tracking-tight shadow-xs">
                HM
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-neutral-900 font-serif">
                  hypeMitra
                </span>
                <span className="text-xs text-neutral-400 font-medium ml-2 hidden sm:inline">
                  Creator Performance & Finance Management
                </span>
              </div>
            </div>

            {/* Right Tools: Network Status, PWA Install, Reset */}
            <div className="flex items-center gap-2">
              <NetworkStatusBadge />
              <PWAInstallButton variant="compact" />
              <button
                type="button"
                onClick={handleResetData}
                title="Reset to sample data"
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Bar: Exactly 3 Required Sections */}
          <nav className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'performance'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Creator Performance Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Finance Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Weekly Reports</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 py-6">
        {activeTab === 'performance' && (
          <CreatorPerformanceCalendar
            performance={currentDb.performance}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSavePerformance={handleSavePerformance}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceCalendar
            deals={currentDb.brandDeals}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenCreateDeal={handleOpenCreateDeal}
            onOpenEditDeal={handleOpenEditDeal}
          />
        )}

        {activeTab === 'reports' && (
          <WeeklyReportsView
            deals={currentDb.brandDeals}
            expenses={currentDb.expenses}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      {/* Brand Deal Modal */}
      <BrandDealModal
        isOpen={isDealModalOpen}
        initialDate={modalDate}
        dealToEdit={dealToEdit}
        onClose={() => setIsDealModalOpen(false)}
        onSaveDeal={handleSaveDeal}
        onDeleteDeal={handleDeleteDeal}
      />

      {/* Offline sync indicator */}
      <OfflineIndicator />
    </div>
  );
}
