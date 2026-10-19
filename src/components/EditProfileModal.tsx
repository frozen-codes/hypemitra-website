import React, { useState } from 'react';
import { User } from '../types';
import { X, Save, User as UserIcon, Mail, Briefcase, Lock, CheckCircle2, AlertCircle, Camera } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onSaveProfile: (profileData: {
    id: string;
    name: string;
    title: string;
    email: string;
    avatar: string;
    newPassword?: string;
  }) => Promise<void>;
}

const PRESET_AVATARS = [
  { label: 'Executive Woman', url: '/src/assets/images/avatar_hr_sarah_1792391437426.jpg' },
  { label: 'Executive Director', url: '/src/assets/images/avatar_senior_david_1792391436855.jpg' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await onSaveProfile({
        id: currentUser.id,
        name: name.trim(),
        title: title.trim(),
        email: email.trim(),
        avatar: customAvatarUrl.trim() || avatar,
        newPassword: newPassword.trim() || undefined,
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-lg flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-4 h-4 text-neutral-600" />
            <h3 className="text-base font-bold text-neutral-900">
              Edit Account Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Selector Strip */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="relative">
              <img
                src={customAvatarUrl || avatar}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-300"
              />
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs border border-neutral-200">
                <Camera className="w-3 h-3 text-neutral-600" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider block">
                Profile Portrait
              </span>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                {PRESET_AVATARS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(p.url);
                      setCustomAvatarUrl('');
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border cursor-pointer ${
                      avatar === p.url && !customAvatarUrl
                        ? 'bg-white border-neutral-900 font-semibold shadow-2xs'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Role / Job Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Designation / Role Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HR & Talent Operations Lead"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Authorized Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. hr@agency.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Password Change Accordion */}
          <div className="pt-2 border-t border-neutral-200 space-y-3">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Security & Password (Optional)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Updating...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
