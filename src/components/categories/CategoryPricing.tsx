import React, { useState } from 'react';
import {
  Tags,
  TrendingUp,
  History,
  Edit3,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatDateID, formatDateTimeID } from '../../utils/formatters';
import { WasteCategory } from '../../types';

export const CategoryPricing: React.FC = () => {
  const { wasteCategories, priceHistory, updateCategoryPrice, currentUser } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<WasteCategory | null>(null);
  const [newBuyPrice, setNewBuyPrice] = useState<number>(0);
  const [newSellPrice, setNewSellPrice] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTabSub, setActiveTabSub] = useState<'prices' | 'history'>('prices');

  const handleOpenEdit = (cat: WasteCategory) => {
    setSelectedCategory(cat);
    setNewBuyPrice(cat.buyPricePerKg);
    setNewSellPrice(cat.sellPricePerKg);
    setReason('');
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!reason.trim()) {
      setFeedback({ type: 'error', message: 'Alasan penyesuaian harga wajib diisi untuk rekam jejak audit.' });
      return;
    }

    const res = updateCategoryPrice(selectedCategory.id, newBuyPrice, newSellPrice, reason);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Harga ${selectedCategory.name} berhasil diperbarui. Transaksi historis tetap terjaga dengan harga aslinya.`,
      });
      setSelectedCategory(null);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal mengubah harga.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            KATALOG & PRICING ENGINE
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Jenis & Tarif Harga Sampah
          </h1>
          <p className="text-xs text-slate-500">
            Penetapan harga beli dari nasabah dan harga jual ke pabrik pengepul dengan margin kotor terproyeksi.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTabSub('prices')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTabSub === 'prices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Daftar Tarif Aktif
          </button>
          <button
            onClick={() => setActiveTabSub('history')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTabSub === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Log Riwayat Perubahan ({priceHistory.length})
          </button>
        </div>
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

      {activeTabSub === 'prices' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wasteCategories.map((cat) => {
            const marginRp = cat.sellPricePerKg - cat.buyPricePerKg;
            const marginPct = cat.sellPricePerKg > 0 ? ((marginRp / cat.sellPricePerKg) * 100).toFixed(0) : 0;

            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {cat.code}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                          {cat.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                    {cat.description || 'Kategori material daur ulang terpilah.'}
                  </p>

                  {/* Pricing Comparison Cards */}
                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-100 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Beli dari Nasabah:</span>
                      <span className="font-bold text-slate-900">{formatIDR(cat.buyPricePerKg)} / kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Jual ke Pengepul:</span>
                      <span className="font-bold text-teal-800">{formatIDR(cat.sellPricePerKg)} / kg</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-emerald-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Proyeksi Margin:</span>
                      <span className="font-black text-xs">
                        +{formatIDR(marginRp)} ({marginPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Update: {formatDateID(cat.lastUpdated)}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="flex items-center gap-1 font-bold text-[#009CAC] hover:text-teal-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Ubah Harga</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Price History Table */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Jejak Audit Perubahan Harga & Snapshot Transaksi
            </h3>
            <p className="text-[11px] text-slate-400">
              Setiap penyesuaian harga tercatat lengkap dengan penanggung jawab dan alasan bisnis. Transaksi lampau tidak berubah nilainya.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">Waktu Penyesuaian</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Harga Beli Lama → Baru</th>
                  <th className="pb-3">Harga Jual Lama → Baru</th>
                  <th className="pb-3">Otorisator</th>
                  <th className="pb-3">Alasan Kebijakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada perubahan harga yang dilakukan dalam sesi ini.
                    </td>
                  </tr>
                ) : (
                  priceHistory.map((ph) => {
                    const cat = wasteCategories.find((c) => c.id === ph.categoryId);
                    return (
                      <tr key={ph.id} className="hover:bg-slate-50 font-mono">
                        <td className="py-3 pl-2 text-slate-500">{formatDateTimeID(ph.effectiveDate)}</td>
                        <td className="py-3 font-bold text-slate-800">{cat?.name || ph.categoryId}</td>
                        <td className="py-3">
                          <span className="text-slate-400 line-through">{formatIDR(ph.previousBuyPrice)}</span>{' '}
                          → <span className="font-bold text-slate-900">{formatIDR(ph.newBuyPrice)}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-slate-400 line-through">{formatIDR(ph.previousSellPrice)}</span>{' '}
                          → <span className="font-bold text-teal-800">{formatIDR(ph.newSellPrice)}</span>
                        </td>
                        <td className="py-3 font-sans text-slate-700">{ph.changedBy}</td>
                        <td className="py-3 font-sans text-slate-600 max-w-xs">{ph.reason}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSavePrice}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {selectedCategory.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Sesuaikan Tarif {selectedCategory.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-900 flex items-start gap-2 border border-teal-200/60">
              <ShieldCheck className="h-4 w-4 text-[#009CAC] mt-0.5 shrink-0" />
              <p>
                Penetapan harga baru hanya berlaku untuk transaksi setelah tanggal efektif ini. Transaksi setoran lampau nasabah tidak terpengaruh.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Harga Beli dari Nasabah (Rp / kg) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="50"
                  value={newBuyPrice}
                  onChange={(e) => setNewBuyPrice(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Harga Jual ke Pengepul (Rp / kg) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="50"
                  value={newSellPrice}
                  onChange={(e) => setNewSellPrice(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>

              {/* Preview Margin */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-mono flex justify-between">
                <span className="text-slate-500">Estimasi Margin Kotor:</span>
                <span className="font-bold text-emerald-700">
                  {formatIDR(newSellPrice - newBuyPrice)} / kg (
                  {newSellPrice > 0 ? (((newSellPrice - newBuyPrice) / newSellPrice) * 100).toFixed(0) : 0}%)
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Perubahan Tarif (Audit Trail) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Mengikuti kenaikan harga beli pabrik daur ulang per Oktober 2026."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#009CAC] py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Simpan Tarif Baru
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
