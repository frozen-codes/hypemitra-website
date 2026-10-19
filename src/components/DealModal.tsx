import React, { useState, useEffect } from 'react';
import { BrandDeal, DealStatus, User } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/financialUtils';

interface DealModalProps {
  deal: BrandDeal | null;
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onSave: (deal: Partial<BrandDeal>) => Promise<void>;
}

export const DealModal: React.FC<DealModalProps> = ({
  deal,
  isOpen,
  currentUser,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [brandName, setBrandName] = useState(deal?.brandName || '');
  const [campaignName, setCampaignName] = useState(deal?.campaignName || '');
  const [dealValue, setDealValue] = useState(deal?.dealValue || 0);
  const [brandRevenueReceived, setBrandRevenueReceived] = useState(deal?.brandRevenueReceived || 0);
  const [creatorPayments, setCreatorPayments] = useState(deal?.creatorPayments || 0);
  const [additionalExpenses, setAdditionalExpenses] = useState(deal?.additionalExpenses || 0);
  const [creatorsLocked, setCreatorsLocked] = useState(deal?.creatorsLocked || 0);
  const [creatorsCompleted, setCreatorsCompleted] = useState(deal?.creatorsCompleted || 0);
  const [creatorsPending, setCreatorsPending] = useState(deal?.creatorsPending || 0);
  const [creatorsDeclined, setCreatorsDeclined] = useState(deal?.creatorsDeclined || 0);
  const [deadline, setDeadline] = useState(deal?.deadline || '2026-11-15');
  const [status, setStatus] = useState<DealStatus>(deal?.status || 'in-progress');
  const [notes, setNotes] = useState(deal?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Live calculations
  const totalExpenses = creatorPayments + additionalExpenses;
  const netProfit = brandRevenueReceived - totalExpenses;
  const outstandingPayments = Math.max(0, dealValue - brandRevenueReceived);
  const profitMargin = brandRevenueReceived > 0 
    ? Math.round(((netProfit / brandRevenueReceived) * 100) * 10) / 10 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !campaignName.trim()) {
      setError('Brand name and campaign name are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        id: deal?.id,
        brandName: brandName.trim(),
        campaignName: campaignName.trim(),
        dealValue: Number(dealValue) || 0,
        brandRevenueReceived: Number(brandRevenueReceived) || 0,
        outstandingPayments,
        creatorPayments: Number(creatorPayments) || 0,
        additionalExpenses: Number(additionalExpenses) || 0,
        totalExpenses,
        netProfit,
        profitMargin,
        creatorsLocked: Number(creatorsLocked) || 0,
        creatorsCompleted: Number(creatorsCompleted) || 0,
        creatorsPending: Number(creatorsPending) || 0,
        creatorsDeclined: Number(creatorsDeclined) || 0,
        deadline,
        status,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save deal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <h3 className="text-base font-bold text-neutral-900">
            {deal ? 'Edit Brand Deal' : 'Add New Brand Deal'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Brand & Campaign */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Nike, Sephora, Samsung"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Autumn Velocity Challenge"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Deal Value & Financials */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Financial & Revenue Tracking
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Agreed Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={dealValue}
                  onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Revenue Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={brandRevenueReceived}
                  onChange={(e) => setBrandRevenueReceived(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Creator Payouts (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="2500"
                  value={creatorPayments}
                  onChange={(e) => setCreatorPayments(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Other Expenses (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={additionalExpenses}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>
            </div>

            {/* Calculated Profit Summary Card */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block font-mono">
                  Outstanding Due
                </span>
                <span className="font-bold font-mono text-amber-700">
                  {formatCurrency(outstandingPayments)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block font-mono">
                  Net Profit (Recognized)
                </span>
                <span className={`font-bold font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block font-mono">
                  Profit Margin
                </span>
                <span className={`font-bold font-mono ${profitMargin >= 30 ? 'text-emerald-700' : 'text-neutral-900'}`}>
                  {profitMargin}%
                </span>
              </div>
            </div>
          </div>

          {/* Creators Pipeline */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Creator Pipeline Roster
            </h4>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Locked
                </label>
                <input
                  type="number"
                  min="0"
                  value={creatorsLocked}
                  onChange={(e) => setCreatorsLocked(parseInt(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Completed
                </label>
                <input
                  type="number"
                  min="0"
                  value={creatorsCompleted}
                  onChange={(e) => setCreatorsCompleted(parseInt(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Pending
                </label>
                <input
                  type="number"
                  min="0"
                  value={creatorsPending}
                  onChange={(e) => setCreatorsPending(parseInt(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                  Declined
                </label>
                <input
                  type="number"
                  min="0"
                  value={creatorsDeclined}
                  onChange={(e) => setCreatorsDeclined(parseInt(e.target.value) || 0)}
                  className="w-full bg-white px-2.5 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Status & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Deal Status
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              >
                <option value="lead">Lead / Pitching</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed & Wrapped</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Campaign Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Campaign Notes & Deliverable Requirements
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Talent specs, contract milestones, video requirements..."
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
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
              <span>{isSaving ? 'Saving...' : 'Save Deal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
