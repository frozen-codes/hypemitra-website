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
  Smartphone,
  Info,
  HardDrive,
  Server,
  CheckCircle2,
  X,
  RefreshCw,
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
  const [showOfflineModal, setShowOfflineModal] = useState(false);

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

            {/* Right Tools: Network Status, PWA Install, Architecture Info, Reset */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <NetworkStatusBadge />
              <PWAInstallButton variant="compact" />
              <button
                type="button"
                onClick={() => setShowOfflineModal(true)}
                title="Mobile & Offline Architecture"
                className="p-1.5 sm:p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetData}
                title="Clear and reset to fresh start"
                className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Bar (hidden on mobile, uses bottom nav instead) */}
          <nav className="hidden sm:flex items-center gap-2 pt-1 overflow-x-auto pb-1">
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

      {/* Main Container - with bottom padding for mobile tab bar */}
      <main className="flex-1 w-full px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
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

      {/* Mobile Bottom Navigation Bar (Phone-First UX) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-1.5 flex items-center justify-around pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg">
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === 'performance' ? 'text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'performance' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'}`}>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="mt-1">Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === 'finance' ? 'text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'finance' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'}`}>
            <IndianRupee className="w-4 h-4" />
          </div>
          <span className="mt-1">Finance</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === 'reports' ? 'text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'}`}>
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="mt-1">Reports</span>
        </button>
      </nav>

      {/* Mobile & Offline Architecture Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm sm:text-base font-serif">
                    Offline Mobile App Architecture
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Standalone offline capability powered by HTML, CSS, JS & Node.js
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-neutral-600">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900">Zero Paid APIs & Zero API Keys</p>
                  <p className="mt-0.5 text-neutral-500">
                    This app requires no Gemini API keys, OpenAI keys, or external paid services. All computations, margin tracking, and report generation run locally on your device.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-3">
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900">Offline-First Local Storage</p>
                  <p className="mt-0.5 text-neutral-500">
                    When your device has no internet connection, all changes are written directly to local storage and queued. You can add brand deals, rate creator performance, and record expenses completely offline.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-3">
                <Server className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900">Node.js Express Backend</p>
                  <p className="mt-0.5 text-neutral-500">
                    The Node.js server maintains persistent JSON file storage in <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono text-[11px]">data/database.json</code>. Whenever connection is active, offline queue items sync automatically.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900">Installable Native Mobile PWA</p>
                  <p className="mt-0.5 text-neutral-500">
                    Equipped with Service Worker caching and Web App Manifest. Tap <strong>Install App</strong> on Android/Desktop or <strong>Share → Add to Home Screen</strong> on iPhone Safari to launch without a browser bar.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={async () => {
                  await api.syncPendingQueue();
                  await loadDatabase();
                  setShowOfflineModal(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync with Server</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
