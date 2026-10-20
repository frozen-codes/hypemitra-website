import React, { useState, useEffect } from 'react';
import { User, DailyWorkEntry, BrandDeal, WeeklyTarget, AppDatabase } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { CalendarView } from './components/CalendarView';
import { DailyWorkDrawer } from './components/DailyWorkDrawer';
import { FinanceView } from './components/FinanceView';
import { SearchExportView } from './components/SearchExportView';
import { DealModal } from './components/DealModal';
import { EditProfileModal } from './components/EditProfileModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getStoredUser());
  const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'search'>('calendar');

  // Database state
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar selection & Drawer state
  const [selectedDate, setSelectedDate] = useState('2026-10-19');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialEdit, setDrawerInitialEdit] = useState(false);

  // Deal modal state
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<BrandDeal | null>(null);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch database on mount and whenever user logs in
  const loadData = async () => {
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
    loadData();
    // Poll every 15 seconds so both HR and Senior accounts see updates live
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    api.setStoredUser(user);
  };

  const handleLogout = () => {
    api.setStoredUser(null);
    setCurrentUser(null);
  };

  const handleSwitchUser = () => {
    if (!currentUser) return;
    if (currentUser.role === 'hr') {
      const seniorUser: User = {
        id: 'user-senior',
        name: 'David Vance',
        email: 'senior@hypemitra.com',
        role: 'senior',
        avatar: '/src/assets/images/avatar_senior_david_1792391436855.jpg',
        title: 'Senior Operations Director',
      };
      setCurrentUser(seniorUser);
      api.setStoredUser(seniorUser);
    } else {
      const hrUser: User = {
        id: 'user-hr',
        name: 'Shraddha Tiwari',
        email: 'hr@hypemitra.com',
        role: 'hr',
        avatar: '/src/assets/images/avatar_hr_sarah_1792391437426.jpg',
        title: 'HR & Operations Lead',
      };
      setCurrentUser(hrUser);
      api.setStoredUser(hrUser);
    }
  };

  // Date selection
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDrawerInitialEdit(false);
    setIsDrawerOpen(true);
  };

  const handleOpenCreateOrEdit = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDrawerInitialEdit(true);
    setIsDrawerOpen(true);
  };

  // Daily Work save
  const handleSaveDailyWork = async (entry: DailyWorkEntry) => {
    const saved = await api.saveDailyWork(entry);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyWork: {
          ...prev.dailyWork,
          [saved.date]: saved,
        },
      };
    });
  };

  // Senior review
  const handleSubmitSeniorReview = async (
    date: string,
    feedback: string,
    status: 'approved' | 'action_required' | 'acknowledged'
  ) => {
    if (!currentUser) return;
    const updated = await api.submitSeniorReview(date, feedback, status, currentUser.name);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyWork: {
          ...prev.dailyWork,
          [date]: updated,
        },
      };
    });
  };

  // Deal handlers
  const handleOpenCreateDeal = () => {
    setDealToEdit(null);
    setIsDealModalOpen(true);
  };

  const handleEditDeal = (deal: BrandDeal) => {
    setDealToEdit(deal);
    setIsDealModalOpen(true);
  };

  const handleSaveDeal = async (dealData: Partial<BrandDeal>) => {
    const saved = await api.saveDeal(dealData);
    setDb((prev) => {
      if (!prev) return prev;
      const existingIdx = prev.deals.findIndex((d) => d.id === saved.id);
      let newDeals = [...prev.deals];
      if (existingIdx >= 0) {
        newDeals[existingIdx] = saved;
      } else {
        newDeals.unshift(saved);
      }
      return { ...prev, deals: newDeals };
    });
  };

  const handleDeleteDeal = async (dealId: string) => {
    await api.deleteDeal(dealId);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        deals: prev.deals.filter((d) => d.id !== dealId),
      };
    });
  };

  // Weekly target handlers
  const handleSaveWeeklyTarget = async (target: WeeklyTarget) => {
    const saved = await api.saveWeeklyTarget(target);
    setDb((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weeklyTargets: {
          ...prev.weeklyTargets,
          [saved.id]: saved,
        },
      };
    });
  };

  const handleSaveProfile = async (profileData: {
    id: string;
    name: string;
    title: string;
    email: string;
    avatar: string;
    newPassword?: string;
  }) => {
    const updated = await api.updateProfile(profileData);
    setCurrentUser(updated);
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset database back to initial October 2026 agency demo data?')) {
      const reset = await api.resetData();
      setDb(reset);
    }
  };

  const handleExportCSV = () => {
    setActiveTab('search');
  };

  // If not logged in, render authentication view
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading state
  if (loading || !db) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
          <span className="text-xs text-neutral-500 font-medium">
            Loading HypeMitra Workspace...
          </span>
        </div>
      </div>
    );
  }

  const selectedDailyWorkEntry = db.dailyWork[selectedDate] || null;

  return (
    <div className="min-h-screen bg-neutral-100/60 flex flex-col text-neutral-900">
      {/* Top Header & Subnav */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onOpenEditProfile={() => setIsProfileModalOpen(true)}
        onResetData={handleResetDemoData}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full px-4 sm:px-6 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            currentUser={currentUser}
            dailyWork={db.dailyWork}
            deals={db.deals}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onOpenCreateOrEdit={handleOpenCreateOrEdit}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            currentUser={currentUser}
            deals={db.deals}
            weeklyTargets={db.weeklyTargets}
            dailyWork={db.dailyWork}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onOpenDailyDrawer={handleOpenCreateOrEdit}
            onBackToCalendar={() => setActiveTab('calendar')}
            onOpenCreateDeal={handleOpenCreateDeal}
            onEditDeal={handleEditDeal}
            onDeleteDeal={handleDeleteDeal}
            onSaveWeeklyTarget={handleSaveWeeklyTarget}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'search' && (
          <SearchExportView
            dailyWork={db.dailyWork}
            deals={db.deals}
            onSelectDate={handleSelectDate}
          />
        )}
      </main>

      {/* Daily Work Notes & Activities Modal / Drawer (Screenshot 5) */}
      {isDrawerOpen && (
        <DailyWorkDrawer
          dateStr={selectedDate}
          entry={selectedDailyWorkEntry}
          currentUser={currentUser}
          allDeals={db.deals}
          isEditingInitially={drawerInitialEdit}
          onClose={() => setIsDrawerOpen(false)}
          onSaveDailyWork={handleSaveDailyWork}
          onSubmitSeniorReview={handleSubmitSeniorReview}
        />
      )}

      {/* Record / Edit Deal Modal */}
      <DealModal
        deal={dealToEdit}
        isOpen={isDealModalOpen}
        currentUser={currentUser}
        onClose={() => {
          setIsDealModalOpen(false);
          setDealToEdit(null);
        }}
        onSave={handleSaveDeal}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      {/* Footer (Matches Screenshot 1) */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-12 text-center text-xs text-neutral-500 space-y-1.5">
        <div className="font-medium text-neutral-700">
          <strong>HypeMitra</strong> · Permanent Company Work Journal & Daily Performance Calendar
        </div>
        <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400">
          <span>Sunday Protected</span>
          <span>·</span>
          <span>Multi-Year Engine</span>
          <span>·</span>
          <span>PostgreSQL & Supabase Ready</span>
        </div>
      </footer>

      {/* Offline Connectivity & Sync Indicator */}
      <OfflineIndicator />
    </div>
  );
}
