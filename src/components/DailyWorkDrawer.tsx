import React, { useState, useEffect } from 'react';
import { BrandDeal, DailyWorkEntry, PerformanceRating, User } from '../types';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  Calendar as CalendarIcon,
  User as UserIcon,
} from 'lucide-react';

interface DailyWorkDrawerProps {
  dateStr: string;
  entry: DailyWorkEntry | null;
  currentUser: User;
  allDeals: BrandDeal[];
  isEditingInitially?: boolean;
  onClose: () => void;
  onSaveDailyWork: (entry: DailyWorkEntry) => Promise<void>;
  onSubmitSeniorReview: (
    date: string,
    feedback: string,
    status: 'approved' | 'action_required' | 'acknowledged'
  ) => Promise<void>;
}

export const DailyWorkDrawer: React.FC<DailyWorkDrawerProps> = ({
  dateStr,
  entry,
  currentUser,
  allDeals,
  isEditingInitially = true,
  onClose,
  onSaveDailyWork,
  onSubmitSeniorReview,
}) => {
  const isSenior = currentUser.role === 'senior';
  const isHR = currentUser.role === 'hr';

  // Productivity rating
  const [performanceRating, setPerformanceRating] =
    useState<PerformanceRating>(entry?.performanceRating || 'green');

  // Notes text
  const [notes, setNotes] = useState(
    entry?.notes ||
      '• Outreach: 20 creators contacted across Instagram & YouTube.\n\n• Deliverables: Reviewed and approved 6 video drafts for brand campaign.\n\n• Contracts & Commercials: Finalized barter & paid agreements.'
  );

  // Quantitative Metrics
  const [creatorsContacted, setCreatorsContacted] = useState(
    entry?.creatorsContacted || 20
  );
  const [creatorsLocked, setCreatorsLocked] = useState(
    entry?.creatorsLocked || 4
  );
  const [deliverablesCompleted, setDeliverablesCompleted] = useState(
    entry?.deliverablesCompleted || 6
  );

  // Connected Deals
  const [dealsHandled, setDealsHandled] = useState(entry?.dealsHandled || []);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [dealNote, setDealNote] = useState('');

  // Senior review
  const [reviewFeedback, setReviewFeedback] = useState(
    entry?.seniorReview?.feedback || ''
  );
  const [reviewStatus, setReviewStatus] = useState<
    'approved' | 'action_required' | 'acknowledged'
  >(entry?.seniorReview?.status || 'approved');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setPerformanceRating(entry.performanceRating || 'green');
      setNotes(entry.notes || '');
      setCreatorsContacted(entry.creatorsContacted || 0);
      setCreatorsLocked(entry.creatorsLocked || 0);
      setDeliverablesCompleted(entry.deliverablesCompleted || 0);
      setDealsHandled(entry.dealsHandled || []);
      setReviewFeedback(entry.seniorReview?.feedback || '');
      setReviewStatus(entry.seniorReview?.status || 'approved');
    }
  }, [dateStr, entry]);

  // Quick Add templates (Matches Screenshot 5)
  const handleQuickAdd = (type: 'outreach' | 'deliverables' | 'contracts') => {
    let snippet = '';
    if (type === 'outreach') {
      snippet = '\n• Outreach: 15 creators contacted across Instagram & YouTube.';
    } else if (type === 'deliverables') {
      snippet = '\n• Deliverables: Reviewed and approved video drafts for brand campaign.';
    } else if (type === 'contracts') {
      snippet = '\n• Contracts: Finalized commercial terms & creator agreement signatures.';
    }
    setNotes((prev) => (prev ? prev.trim() + '\n' + snippet : snippet.trim()));
  };

  const handleAddDeal = () => {
    if (!selectedDealId) return;
    const deal = allDeals.find((d) => d.id === selectedDealId);
    if (!deal) return;
    setDealsHandled([
      ...dealsHandled,
      {
        dealId: deal.id,
        brandName: deal.brandName,
        campaignName: deal.campaignName,
        updateSummary: dealNote.trim() || 'Daily milestone achieved',
      },
    ]);
    setSelectedDealId('');
    setDealNote('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const record: DailyWorkEntry = {
      date: dateStr,
      tasksCompleted: notes.split('\n').filter((l) => l.trim().startsWith('•')),
      tasksPending: [],
      notes,
      creatorsContacted: Number(creatorsContacted) || 0,
      creatorsLocked: Number(creatorsLocked) || 0,
      deliverablesCompleted: Number(deliverablesCompleted) || 0,
      performanceRating,
      dealsHandled,
      submittedBy: currentUser.name || 'Shraddha Tiwari',
      submittedAt: entry?.submittedAt || new Date().toISOString(),
      lastEditorName: currentUser.name || 'Shraddha Tiwari',
      lastModifiedAt: new Date().toISOString(),
      seniorReview: entry?.seniorReview,
    };

    try {
      await onSaveDailyWork(record);
      setSaveSuccessMsg('Work record saved successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReview = async () => {
    setIsSaving(true);
    try {
      await onSubmitSeniorReview(dateStr, reviewFeedback, reviewStatus);
      setSaveSuccessMsg('Senior review recorded.');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Date formatted
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);
  const dateFormatted = parsedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-neutral-600" />
            <h2 className="text-base font-bold text-neutral-900 font-serif">
              {dateFormatted}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="bg-emerald-50 px-5 py-2.5 border-b border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Scrollable Body (Matches Screenshot 5) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* PRODUCTIVITY RATING (Matches Screenshot 5) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-widest block font-sans">
              PRODUCTIVITY RATING
            </span>

            <div className="space-y-2.5">
              {/* Best Performance */}
              <button
                type="button"
                onClick={() => setPerformanceRating('green')}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  performanceRating === 'green'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-bold text-xs text-emerald-700 font-serif">
                    Best Performance
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 pl-4.5">
                  Exceeded target deliverables & client approvals
                </p>
              </button>

              {/* Medium Performance */}
              <button
                type="button"
                onClick={() => setPerformanceRating('yellow')}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  performanceRating === 'yellow'
                    ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-xs'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-bold text-xs text-amber-700 font-serif">
                    Medium Performance
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 pl-4.5">
                  Met regular baseline; minor creator blockers
                </p>
              </button>

              {/* Poor Performance */}
              <button
                type="button"
                onClick={() => setPerformanceRating('red')}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  performanceRating === 'red'
                    ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500 shadow-xs'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="font-bold text-xs text-rose-700 font-serif">
                    Poor Performance
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 pl-4.5">
                  Missed campaign milestones or escalations
                </p>
              </button>
            </div>
          </div>

          {/* DAILY WORK NOTES & ACTIVITIES (Matches Screenshot 5) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-widest font-sans">
                DAILY WORK NOTES & ACTIVITIES
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">
                Permanent company log
              </span>
            </div>

            {/* Quick Add Chips (Matches Screenshot 5) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500 font-medium">Quick Add:</span>
              <button
                type="button"
                onClick={() => handleQuickAdd('outreach')}
                className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 font-medium cursor-pointer"
              >
                + Creator Outreach
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('deliverables')}
                className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 font-medium cursor-pointer"
              >
                + Video Deliverables
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('contracts')}
                className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 font-medium cursor-pointer"
              >
                + Contracts
              </button>
            </div>

            {/* Notes Textarea Editor */}
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Log tasks, creator outreach, campaign deliveries..."
              className="w-full p-3.5 text-xs text-neutral-800 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-neutral-900 focus:outline-none leading-relaxed font-sans"
            />
          </div>

          {/* Quantitative Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-1">
                Creators Contacted
              </label>
              <input
                type="number"
                min="0"
                value={creatorsContacted}
                onChange={(e) => setCreatorsContacted(parseInt(e.target.value) || 0)}
                className="w-full bg-white px-2 py-1 text-xs font-mono font-bold border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-1">
                Creators Locked
              </label>
              <input
                type="number"
                min="0"
                value={creatorsLocked}
                onChange={(e) => setCreatorsLocked(parseInt(e.target.value) || 0)}
                className="w-full bg-white px-2 py-1 text-xs font-mono font-bold border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-1">
                Deliverables Done
              </label>
              <input
                type="number"
                min="0"
                value={deliverablesCompleted}
                onChange={(e) => setDeliverablesCompleted(parseInt(e.target.value) || 0)}
                className="w-full bg-white px-2 py-1 text-xs font-mono font-bold border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          {/* Connect Brand Deal */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-widest block font-sans">
              Connect Brand Deal
            </span>
            <div className="flex gap-2">
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-xl"
              >
                <option value="">-- Select active deal --</option>
                {allDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.brandName} - {d.campaignName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDeal}
                disabled={!selectedDealId}
                className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-xl cursor-pointer"
              >
                Link Deal
              </button>
            </div>
            {dealsHandled.length > 0 && (
              <div className="space-y-1 pt-1">
                {dealsHandled.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 text-xs">
                    <span className="font-semibold text-neutral-900">{d.brandName}</span>
                    <button
                      onClick={() => setDealsHandled(dealsHandled.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Senior Review Section */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
                <span className="text-xs font-bold text-neutral-900 uppercase font-sans tracking-wider">
                  Senior Leadership Review
                </span>
              </div>
              {entry?.seniorReview?.reviewed && (
                <span className="text-[11px] font-semibold text-blue-700">
                  Approved
                </span>
              )}
            </div>

            {isSenior ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={2}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Senior feedback, milestone approval, guidance..."
                  className="w-full p-2.5 text-xs bg-white border border-neutral-300 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleSaveReview}
                  className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-xl cursor-pointer"
                >
                  Submit Senior Feedback
                </button>
              </div>
            ) : (
              <div>
                {entry?.seniorReview?.feedback ? (
                  <p className="text-xs text-neutral-700 italic bg-white p-2.5 rounded-xl border border-neutral-200">
                    "{entry.seniorReview.feedback}"
                  </p>
                ) : (
                  <span className="text-xs text-neutral-400 italic">
                    Awaiting Senior Review
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Last Editor & Modified Card (Matches Screenshot 5 Bottom) */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                <strong>Last Editor:</strong> {entry?.lastEditorName || entry?.submittedBy || currentUser.name || 'Shraddha Tiwari'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                <strong>Last Modified:</strong>{' '}
                {entry?.lastModifiedAt
                  ? new Date(entry.lastModifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Not yet saved'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Daily Work'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
