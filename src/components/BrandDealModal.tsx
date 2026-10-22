import React, { useState } from 'react';
import {
  BrandDealRecord,
  BrandPaymentStatus,
  CreatorPaymentStatus,
  CreatorRecord,
  CreatorUploadingStatus,
} from '../types';
import { calculateBrandDeal, formatCurrency } from '../utils/financialUtils';
import {
  X,
  Plus,
  Trash2,
  Building2,
  Users,
  Save,
  AlertCircle,
  TrendingUp,
  DollarSign,
  FileCheck2,
} from 'lucide-react';

interface BrandDealModalProps {
  isOpen: boolean;
  initialDate?: string;
  dealToEdit?: BrandDealRecord | null;
  onClose: () => void;
  onSaveDeal: (deal: Partial<BrandDealRecord>) => Promise<void>;
  onDeleteDeal?: (id: string) => Promise<void>;
}

export const BrandDealModal: React.FC<BrandDealModalProps> = ({
  isOpen,
  initialDate,
  dealToEdit,
  onClose,
  onSaveDeal,
  onDeleteDeal,
}) => {
  if (!isOpen) return null;

  const isEditing = !!dealToEdit;

  const [brandName, setBrandName] = useState(dealToEdit?.brandName || '');
  const [dealDate, setDealDate] = useState(
    dealToEdit?.dealDate || initialDate || new Date().toISOString().split('T')[0]
  );
  const [totalDealAmount, setTotalDealAmount] = useState<number | string>(
    dealToEdit?.totalDealAmount ?? ''
  );
  const [amountReceived, setAmountReceived] = useState<number | string>(
    dealToEdit?.amountReceived ?? ''
  );
  const [paymentStatus, setPaymentStatus] = useState<BrandPaymentStatus>(
    dealToEdit?.paymentStatus || 'Pending'
  );
  const [notes, setNotes] = useState(dealToEdit?.notes || '');

  // Creators list
  const [creators, setCreators] = useState<CreatorRecord[]>(
    dealToEdit?.creators || []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live calculation preview
  const previewDeal: BrandDealRecord = {
    id: dealToEdit?.id || 'preview',
    brandName: brandName || 'Brand Preview',
    dealDate,
    totalDealAmount: Math.max(0, Number(totalDealAmount) || 0),
    amountReceived: Math.max(0, Number(amountReceived) || 0),
    paymentStatus,
    creators,
  };
  const calc = calculateBrandDeal(previewDeal);

  // Creator handlers
  const handleAddCreator = () => {
    const newCreator: CreatorRecord = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      creatorName: '',
      lockingAmount: 0,
      payoutAmount: 0,
      uploadingStatus: 'Pending',
      paymentStatus: 'Pending',
      amountPaid: 0,
    };
    setCreators([...creators, newCreator]);
  };

  const handleUpdateCreator = (
    index: number,
    field: keyof CreatorRecord,
    value: any
  ) => {
    const updated = [...creators];
    updated[index] = { ...updated[index], [field]: value };
    setCreators(updated);
  };

  const handleRemoveCreator = (index: number) => {
    setCreators(creators.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!brandName.trim()) {
      setErrorMsg('Brand name is required.');
      return;
    }
    if (!dealDate) {
      setErrorMsg('Deal date is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveDeal({
        id: dealToEdit?.id,
        brandName: brandName.trim(),
        dealDate,
        totalDealAmount: Math.max(0, Number(totalDealAmount) || 0),
        amountReceived: Math.max(0, Number(amountReceived) || 0),
        paymentStatus,
        creators: creators.map((c) => ({
          ...c,
          creatorName: c.creatorName.trim() || 'Creator',
          lockingAmount: Math.max(0, Number(c.lockingAmount) || 0),
          payoutAmount: Math.max(0, Number(c.payoutAmount) || 0),
          amountPaid: Math.max(0, Number(c.amountPaid) || 0),
        })),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save brand deal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-4xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 font-serif">
                {isEditing ? `Edit Brand Deal: ${brandName || 'Untitled'}` : 'Add Brand Deal'}
              </h2>
              <p className="text-xs text-neutral-500">
                Record brand terms, creator deliverables, and automatic margin calculations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Brand Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Building2 className="w-4 h-4 text-neutral-700" />
              <span>Brand Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Nike India, Sephora"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Deal Date *
                </label>
                <input
                  type="date"
                  required
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Brand Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as BrandPaymentStatus)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Total Deal Amount Agreed (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={totalDealAmount}
                  onChange={(e) => setTotalDealAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Amount Received from Brand (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Brand Notes / Campaign Brief
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Autumn fitness campaign, 4 videos"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Creators Associated with Brand */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Users className="w-4 h-4 text-neutral-700" />
                  <span>Creators Associated with this Brand ({creators.length})</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Store locking amount, payout amount, uploading status, and amount paid for each creator
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCreator}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Creator</span>
              </button>
            </div>

            {/* Creators Table / List */}
            {creators.length > 0 ? (
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10px] font-bold text-neutral-600 uppercase">
                        <th className="py-2.5 px-3">Creator Name</th>
                        <th className="py-2.5 px-2.5 font-mono text-right">Locking (₹)</th>
                        <th className="py-2.5 px-2.5 font-mono text-right">Payout (₹)</th>
                        <th className="py-2.5 px-2.5 text-center">Uploading Status</th>
                        <th className="py-2.5 px-2.5 text-center">Payment Status</th>
                        <th className="py-2.5 px-2.5 font-mono text-right">Amount Paid (₹)</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {creators.map((c, idx) => (
                        <tr key={c.id || idx} className="hover:bg-neutral-50/60">
                          {/* Creator Name */}
                          <td className="py-2 px-3 min-w-[160px]">
                            <input
                              type="text"
                              value={c.creatorName}
                              onChange={(e) =>
                                handleUpdateCreator(idx, 'creatorName', e.target.value)
                              }
                              placeholder="Creator name / handle"
                              className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                          </td>

                          {/* Locking Amount */}
                          <td className="py-2 px-2.5 w-28">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={c.lockingAmount}
                              onChange={(e) =>
                                handleUpdateCreator(
                                  idx,
                                  'lockingAmount',
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="w-full px-2 py-1 text-xs font-mono text-right border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                          </td>

                          {/* Payout Amount */}
                          <td className="py-2 px-2.5 w-28">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={c.payoutAmount}
                              onChange={(e) =>
                                handleUpdateCreator(
                                  idx,
                                  'payoutAmount',
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="w-full px-2 py-1 text-xs font-mono text-right border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold text-neutral-900"
                            />
                          </td>

                          {/* Uploading Status */}
                          <td className="py-2 px-2.5 w-28 text-center">
                            <select
                              value={c.uploadingStatus}
                              onChange={(e) =>
                                handleUpdateCreator(
                                  idx,
                                  'uploadingStatus',
                                  e.target.value as CreatorUploadingStatus
                                )
                              }
                              className={`w-full px-2 py-1 text-xs rounded-lg border border-neutral-200 cursor-pointer font-medium ${
                                c.uploadingStatus === 'Uploaded'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Uploaded">Uploaded</option>
                            </select>
                          </td>

                          {/* Payment Status */}
                          <td className="py-2 px-2.5 w-32 text-center">
                            <select
                              value={c.paymentStatus}
                              onChange={(e) =>
                                handleUpdateCreator(
                                  idx,
                                  'paymentStatus',
                                  e.target.value as CreatorPaymentStatus
                                )
                              }
                              className="w-full px-2 py-1 text-xs rounded-lg border border-neutral-200 cursor-pointer font-medium"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Partially Paid">Partially Paid</option>
                              <option value="Paid">Paid</option>
                            </select>
                          </td>

                          {/* Amount Paid */}
                          <td className="py-2 px-2.5 w-28">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={c.amountPaid}
                              onChange={(e) =>
                                handleUpdateCreator(
                                  idx,
                                  'amountPaid',
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="w-full px-2 py-1 text-xs font-mono text-right border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 text-blue-900 font-semibold"
                            />
                          </td>

                          {/* Delete */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCreator(idx)}
                              className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                              title="Remove creator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic py-2">
                No creators added to this brand deal yet. Click "+ Add Creator" above to add creators.
              </p>
            )}
          </div>

          {/* Section 3: Live Automatic Profit Calculation Card */}
          <div className="bg-neutral-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <span className="text-xs font-bold tracking-wider uppercase text-neutral-400 font-sans flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Automatic Profit & Financial Calculation</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Real-time formula evaluation
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-neutral-800/80 p-3 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Total Deal Amount
                </span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {formatCurrency(calc.totalDealAmount)}
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Agreed with brand
                </span>
              </div>

              <div className="bg-neutral-800/80 p-3 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Total Creator Locking
                </span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {formatCurrency(calc.totalCreatorLocking)}
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Sum of agreed locks
                </span>
              </div>

              <div className="bg-neutral-800/80 p-3 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Total Creator Payouts
                </span>
                <span className="text-sm font-bold font-mono text-white mt-1 block">
                  {formatCurrency(calc.totalCreatorPayouts)}
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Total payable to talent
                </span>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-800/50 p-3 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">
                  Agency Gross Margin
                </span>
                <span className="text-base font-bold font-mono text-emerald-300 mt-1 block">
                  {formatCurrency(calc.agencyGrossMargin)}
                </span>
                <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
                  Deal Amount − Creator Payouts
                </span>
              </div>
            </div>

            {/* Second row of calculations: Cash position and receivables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-neutral-800/60 p-2.5 rounded-xl">
                <span className="text-[10px] text-neutral-400 block">Brand Receivables</span>
                <span className="font-mono font-bold text-amber-300 text-xs mt-0.5 block">
                  {formatCurrency(calc.brandReceivables)}
                </span>
                <span className="text-[9px] text-neutral-400">Due from brand</span>
              </div>

              <div className="bg-neutral-800/60 p-2.5 rounded-xl">
                <span className="text-[10px] text-neutral-400 block">Creator Payables</span>
                <span className="font-mono font-bold text-rose-300 text-xs mt-0.5 block">
                  {formatCurrency(calc.creatorPayables)}
                </span>
                <span className="text-[9px] text-neutral-400">Due to creators</span>
              </div>

              <div className="bg-neutral-800/60 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] text-neutral-400 block">Net Cash Position</span>
                <span className={`font-mono font-bold text-xs mt-0.5 block ${calc.netCashPosition >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatCurrency(calc.netCashPosition)}
                </span>
                <span className="text-[9px] text-neutral-400">Received − Paid to Creators</span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
          <div>
            {isEditing && onDeleteDeal && dealToEdit?.id && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete brand deal "${brandName}"?`)) {
                    await onDeleteDeal(dealToEdit.id);
                    onClose();
                  }
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Delete Brand Deal
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Brand Deal' : 'Save Brand Deal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
