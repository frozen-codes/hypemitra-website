import React, { useState } from 'react';
import { User } from '../types';
import {
  Calendar,
  IndianRupee,
  Search,
  ChevronDown,
  LogOut,
  ArrowLeftRight,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { NetworkStatusBadge } from './OfflineIndicator';

interface NavbarProps {
  currentUser: User;
  activeTab: 'calendar' | 'finance' | 'search';
  onSelectTab: (tab: 'calendar' | 'finance' | 'search') => void;
  onSwitchUser: () => void;
  onLogout: () => void;
  onOpenEditProfile: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onSwitchUser,
  onLogout,
  onOpenEditProfile,
  onResetData,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Initial letter for avatar circle (e.g. 'S' for Shraddha, 'D' for David)
  const initial = (currentUser.name && currentUser.name[0]) || 'S';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-3">
          {/* Brand Mark Lockup */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white font-black text-sm flex items-center justify-center tracking-tight shadow-xs">
              HM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-neutral-900 font-serif">
                  HypeMitra
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-neutral-100 text-neutral-600 rounded-md">
                  Work Journal
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">
                Daily Performance Calendar
              </p>
            </div>
          </div>

          {/* Right Action Icons: Network Status + PWA Install + User Avatar + Logout */}
          <div className="flex items-center gap-2.5">
            <NetworkStatusBadge />
            <PWAInstallButton variant="compact" />

            <button
              onClick={onOpenEditProfile}
              title={`Logged in as ${currentUser.name} (${currentUser.role.toUpperCase()}) - Click to edit profile`}
              className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center font-bold text-sm text-neutral-800 transition-colors cursor-pointer border border-neutral-200"
            >
              {initial}
            </button>

            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Row */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 relative">
          <button
            onClick={() => onSelectTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Calendar</span>
          </button>

          <button
            onClick={() => onSelectTab('finance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Finance</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search & CSV Export</span>
            <span className="sm:hidden">Search</span>
          </button>

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-100 whitespace-nowrap transition-colors cursor-pointer"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {moreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMoreMenuOpen(false)}
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onOpenEditProfile();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 flex items-center gap-2.5 text-neutral-700"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-400" />
                    <span>Edit Profile ({currentUser.name})</span>
                  </button>

                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onSwitchUser();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 flex items-center gap-2.5 text-neutral-700"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-neutral-400" />
                    <span>Switch to {currentUser.role === 'hr' ? 'Senior Director' : 'HR (Shraddha)'}</span>
                  </button>

                  <div className="border-t border-neutral-100 my-1" />

                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onResetData();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 flex items-center gap-2.5 text-neutral-500"
                  >
                    <RotateCcw className="w-4 h-4 text-neutral-400" />
                    <span>Reset to Seed Data</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
