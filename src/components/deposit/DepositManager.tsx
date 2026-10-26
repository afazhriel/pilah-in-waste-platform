import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  FileText,
  UserCheck,
  Coins,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateTimeID } from '../../utils/formatters';
import { DepositTransaction } from '../../types';

export const DepositManager: React.FC = () => {
  const {
    members,
    wasteCategories,
    recordDeposit,
    deposits,
    setActiveTab,
  } = useApp();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'tabungan' | 'tunai'>('tabungan');
  const [items, setItems] = useState<Array<{ categoryId: string; weightKg: number }>>([
    { categoryId: wasteCategories[0]?.id || '', weightKg: 5.0 },
  ]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<DepositTransaction | null>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Add line item
  const handleAddItem = () => {
    setItems((prev) => [...prev, { categoryId: wasteCategories[0]?.id || '', weightKg: 1.0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: 'categoryId' | 'weightKg', value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const cat = wasteCategories.find((c) => c.id === item.categoryId);
    const price = cat ? cat.buyPricePerKg : 0;
    const subtotal = Math.round(item.weightKg * price);
    return { ...item, categoryName: cat?.name || '', price, subtotal };
  });

  const totalWeightKg = calculatedItems.reduce((acc, i) => acc + (Number(i.weightKg) || 0), 0);
  const totalValue = calculatedItems.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setFeedback({ type: 'error', message: 'Silakan pilih nasabah.' });
      return;
    }

    if (totalWeightKg <= 0) {
      setFeedback({ type: 'error', message: 'Bobot sampah harus lebih dari 0 kg.' });
      return;
    }

    const res = recordDeposit({
      memberId: selectedMember.id,
      items: items.map((i) => ({ categoryId: i.categoryId, weightKg: Number(i.weightKg) })),
      paymentMethod,
      isIotVerified: false,
    });

    if (res.success && res.transaction) {
      setLatestReceipt(res.transaction);
      setFeedback({
        type: 'success',
        message: `Setoran ${res.transaction.transactionCode} berhasil dicatat untuk ${selectedMember.fullName}.`,
      });
      // reset items
      setItems([{ categoryId: wasteCategories[0]?.id || '', weightKg: 1.0 }]);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan transaksi.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            PENERIMAAN SETORAN
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Input Transaksi Setoran Sampah
          </h1>
          <p className="text-xs text-slate-500">
            Mencatat setoran nasabah multi-kategori secara manual atau menghubungkan dengan stasiun timbangan IoT.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('timbangan')}
          className="flex items-center gap-2 rounded-xl bg-[#0C2D57] px-4 py-2 text-xs font-bold text-white hover:bg-[#071f3e] transition"
        >
          <Scale className="h-4 w-4 text-teal-400" />
          <span>Gunakan Timbangan Digital IoT</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-bold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Main Entry Form & Recent Deposits side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <form onSubmit={handleSubmitDeposit} className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              FORMULIR PENYETORAN
            </h2>

            {/* Member selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nasabah Penyetor
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-[#009CAC] focus:bg-white focus:outline-hidden"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.memberCode} - {m.fullName} ({m.rtRw}) • Saldo: {formatIDR(m.walletBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Item Waste Lines */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Rincian Barang Sampah</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs font-bold text-[#009CAC] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Baris Sampah</span>
                </button>
              </div>

              {items.map((item, idx) => {
                const cat = wasteCategories.find((c) => c.id === item.categoryId);
                const subtotal = Math.round((item.weightKg || 0) * (cat?.buyPricePerKg || 0));

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/70"
                  >
                    {/* Category select */}
                    <div className="flex-1 w-full">
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800"
                      >
                        {wasteCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({formatIDR(c.buyPricePerKg)}/kg)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Weight input */}
                    <div className="flex items-center gap-1.5 w-full sm:w-36">
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={item.weightKg}
                        onChange={(e) =>
                          handleItemChange(idx, 'weightKg', parseFloat(e.target.value) || 0)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-right text-slate-800"
                      />
                      <span className="text-xs font-bold text-slate-500">kg</span>
                    </div>

                    {/* Subtotal */}
                    <div className="w-full sm:w-32 text-right font-mono font-bold text-xs text-emerald-700">
                      {formatIDR(subtotal)}
                    </div>

                    {/* Delete line */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Payment method */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Penyaluran Nilai Setoran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs transition ${
                    paymentMethod === 'tabungan'
                      ? 'border-[#009CAC] bg-teal-50/50 text-[#0C2D57] font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'tabungan'}
                      onChange={() => setPaymentMethod('tabungan')}
                      className="accent-[#009CAC]"
                    />
                    <span>Kredit Tabungan (Direkomendasikan)</span>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs transition ${
                    paymentMethod === 'tunai'
                      ? 'border-[#159B70] bg-emerald-50/50 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'tunai'}
                      onChange={() => setPaymentMethod('tunai')}
                      className="accent-[#159B70]"
                    />
                    <span>Bayar Tunai Langsung</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Total calculation banner */}
            <div className="rounded-2xl bg-[#0C2D57] p-4 text-white font-mono flex items-center justify-between">
              <div>
                <p className="text-[10px] text-teal-300 uppercase">AKUMULASI PENYETORAN</p>
                <p className="text-xs text-slate-300">{items.length} Macam Sampah • {formatWeight(totalWeightKg)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">NILAI RUPIAH</span>
                <span className="text-2xl font-black text-[#DDF7EE] tracking-tight">
                  {formatIDR(totalValue)}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009CAC] py-3 text-xs font-black text-white hover:bg-teal-700 transition shadow-md shadow-teal-900/20 active:scale-98"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan & Bukukan Transaksi Setoran</span>
            </button>
          </div>
        </form>

        {/* Right Column: Struk Print & Recent List */}
        <div className="lg:col-span-5 space-y-4">
          {latestReceipt && (
            <div className="rounded-2xl border-2 border-teal-500/40 bg-white p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#009CAC]" />
                  <span className="text-xs font-bold text-slate-900">Struk Transaksi Terbaru</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <Printer className="h-3 w-3" />
                  <span>Cetak</span>
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 font-mono text-[11px] space-y-2 border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{latestReceipt.transactionCode}</span>
                  <span>{formatDateTimeID(latestReceipt.timestamp)}</span>
                </div>
                <p className="text-slate-600">Nasabah: {latestReceipt.memberName}</p>
                <div className="border-t border-dashed border-slate-300 pt-1 space-y-1">
                  {latestReceipt.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{i.categoryName} ({i.weightKg} kg)</span>
                      <span>{formatIDR(i.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between font-black text-emerald-700 text-xs">
                  <span>TOTAL:</span>
                  <span>{formatIDR(latestReceipt.totalValue)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Deposits summary card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              5 TRANSAKSI TERAKHIR
            </h3>
            <div className="divide-y divide-slate-100 mt-2">
              {deposits.slice(0, 5).map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{d.memberName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {d.transactionCode} • {d.totalWeightKg} kg
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-700">{formatIDR(d.totalValue)}</span>
                    <span className="block text-[9px] uppercase font-semibold text-slate-400">
                      {d.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
