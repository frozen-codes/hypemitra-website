import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Lock, Mail, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { user } = await api.login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'hr' | 'senior') => {
    if (role === 'hr') {
      setEmail('hr@agency.com');
      setPassword('hr123');
      setLoading(true);
      setError(null);
      try {
        const { user } = await api.login('hr@agency.com', 'hr123');
        onLoginSuccess(user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setEmail('senior@agency.com');
      setPassword('senior123');
      setLoading(true);
      setError(null);
      try {
        const { user } = await api.login('senior@agency.com', 'senior123');
        onLoginSuccess(user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-xs mb-3">
          <img
            src="/src/assets/images/hypemitra_logo_1792392184449.jpg"
            alt="hypeMitra"
            referrerPolicy="no-referrer"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-neutral-900">
          Work Tracking & Profit Portal
        </h2>
        <p className="mt-1 text-center text-xs text-neutral-500">
          Private Internal Portal for HR and Senior Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-xl sm:px-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Authorized Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@agency.com or senior@agency.com"
                  className="block w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Dedicated Two-User Credentials Card */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-xs font-medium text-neutral-500 mb-3 text-center">
              Quick access for authorized team members:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('hr')}
                disabled={loading}
                className="flex flex-col items-center p-3 text-left border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 w-full justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-900">HR Manager</span>
                </div>
                <span className="text-[11px] text-neutral-500">Shraddha Tiwari</span>
                <span className="text-[10px] text-neutral-400 font-mono mt-1">Daily logging & deals</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('senior')}
                disabled={loading}
                className="flex flex-col items-center p-3 text-left border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 w-full justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-neutral-900">Senior Director</span>
                </div>
                <span className="text-[11px] text-neutral-500">David Vance</span>
                <span className="text-[10px] text-neutral-400 font-mono mt-1">Review & targets</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Private internal agency tool · Shared permanent database
        </p>
      </div>
    </div>
  );
};
