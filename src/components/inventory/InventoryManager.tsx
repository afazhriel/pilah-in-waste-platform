import React, { useState } from 'react';
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  X,
  History,
  TrendingDown,
  Warehouse,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateTimeID } from '../../utils/formatters';
import { InventoryStock } from '../../types';

export const InventoryManager: React.FC = () => {
  const { inventoryStocks, inventoryMovements, adjustInventoryStock, wasteCategories } = useApp();

  const [selectedStock, setSelectedStock] = useState<InventoryStock | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTabSub, setActiveTabSub] = useState<'warehouse' | 'movements'>('warehouse');

  // Summary Metrics
  const totalStockKg = inventoryStocks.reduce((acc, s) => acc + s.currentStockKg, 0);
  const totalValuation = inventoryStocks.reduce((acc, s) => acc + s.estimatedValuation, 0);

  // Reconciliation calculations across movements
  const totalDepositedKg = inventoryMovements
    .filter((m) => m.movementType === 'deposit')
    .reduce((acc, m) => acc + m.quantityKg, 0);

  const totalSoldKg = inventoryMovements
    .filter((m) => m.movementType === 'collector_sale')
    .reduce((acc, m) => acc + Math.abs(m.quantityKg), 0);

  const totalAdjustedKg = inventoryMovements
    .filter((m) => m.movementType.startsWith('adjustment'))
    .reduce((acc, m) => acc + m.quantityKg, 0);

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    if (adjustmentDelta === 0) {
      setFeedback({ type: 'error', message: 'Jumlah penyesuaian tidak boleh nol.' });
      return;
    }
    if (!adjustmentReason.trim()) {
      setFeedback({ type: 'error', message: 'Alasan penyesuaian fisik gudang wajib diisi untuk audit.' });
      return;
    }

    adjustInventoryStock(selectedStock.categoryId, adjustmentDelta, adjustmentReason);
    setFeedback({
      type: 'success',
      message: `Penyesuaian stok ${selectedStock.categoryName} sebesar ${adjustmentDelta > 0 ? '+' : ''}${adjustmentDelta} kg berhasil dibukukan.`,
    });
    setSelectedStock(null);
    setAdjustmentDelta(0);
    setAdjustmentReason('');
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Inventaris Gudang
          </h1>
          <p className="text-xs text-slate-500">
            Stok material daur ulang, valuasi aset, dan rekonsiliasi fisik
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-200/70 p-0.5">
          <button
            onClick={() => setActiveTabSub('warehouse')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTabSub === 'warehouse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Stok Gudang
          </button>
          <button
            onClick={() => setActiveTabSub('movements')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTabSub === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Mutasi Barang ({inventoryMovements.length})
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

      {/* Inventory Reconciliation Formula Card (Mandatory Requirement) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0C2D57] to-[#009CAC] p-5 text-white shadow-md">
        <div className="flex items-center gap-2 border-b border-white/20 pb-3">
          <Warehouse className="h-5 w-5 text-teal-300" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-200">
            FORMULA REKONSILIASI FISIK GUDANG (AUDIT MATEMATIS)
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center text-xs">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase text-slate-300 block">Stok Awal</span>
            <span className="text-base font-bold text-white">1.820 kg</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase text-emerald-300 block">+ Setoran Nasabah</span>
            <span className="text-base font-bold text-emerald-300">+{formatWeight(totalDepositedKg)}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase text-rose-300 block">- Penjualan Pengepul</span>
            <span className="text-base font-bold text-rose-300">-{formatWeight(totalSoldKg)}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase text-amber-300 block">± Penyesuaian Audit</span>
            <span className="text-base font-bold text-amber-300">{formatWeight(totalAdjustedKg)}</span>
          </div>
          <div className="bg-[#DDF7EE] text-[#0C2D57] rounded-xl p-3 col-span-2 sm:col-span-1 shadow-md">
            <span className="text-[10px] uppercase font-bold text-teal-900 block">= Stok Akhir Tersedia</span>
            <span className="text-base font-black text-[#0C2D57]">{formatWeight(totalStockKg)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-teal-100/90 pt-1 border-t border-white/10">
          <span>Formula: Stok Awal + Setoran + Penyesuaian(+) − Penjualan − Penyesuaian(−) = Stok Akhir</span>
          <span className="font-bold">Estimasi Valuasi Aset: {formatIDR(totalValuation)}</span>
        </div>
      </div>

      {activeTabSub === 'warehouse' ? (
        /* Stock Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventoryStocks.map((stock) => {
            const isLow = stock.currentStockKg < stock.minThresholdKg;
            const isHigh = stock.currentStockKg > stock.minThresholdKg * 2.5;

            return (
              <div
                key={stock.categoryId}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {stock.categoryGroup}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {stock.categoryName}
                      </h3>
                    </div>
                    {isLow && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-200">
                        STOK MENIPIS
                      </span>
                    )}
                    {isHigh && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-[#009CAC] border border-teal-200">
                        SIAP JUAL
                      </span>
                    )}
                  </div>

                  {/* Weight Readout */}
                  <div className="mt-4 flex items-baseline justify-between border-b border-slate-100 pb-3">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {stock.currentStockKg.toFixed(1)}
                    </span>
                    <span className="font-bold text-slate-500 font-mono text-sm">kg</span>
                  </div>

                  {/* Valuation details */}
                  <div className="mt-3 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Harga Pokok Beli:</span>
                      <span className="font-semibold text-slate-700">
                        {formatIDR(stock.avgBuyPricePerKg)} / kg
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Estimasi Valuasi:</span>
                      <span className="font-bold text-emerald-700">
                        {formatIDR(stock.estimatedValuation)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Ambang Minimum:</span>
                      <span>{stock.minThresholdKg} kg</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Update: {formatDateTimeID(stock.lastMovementTimestamp).split(',')[0]}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedStock(stock);
                      setAdjustmentDelta(0);
                      setAdjustmentReason('');
                    }}
                    className="flex items-center gap-1 font-bold text-[#009CAC] hover:text-teal-700"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Sesuaikan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Movements Log */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            Buku Mutasi Keluar/Masuk Gudang (Append-Only)
          </h3>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">Waktu & Ref</th>
                  <th className="pb-3">Kategori Sampah</th>
                  <th className="pb-3">Jenis Aliran</th>
                  <th className="pb-3 text-right">Kuantitas</th>
                  <th className="pb-3 text-right">Stok Akhir</th>
                  <th className="pb-3">Petugas & Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pl-2 text-[11px]">
                      <p className="font-bold text-slate-800">{m.referenceCode}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTimeID(m.timestamp)}</p>
                    </td>
                    <td className="py-2.5 font-sans font-bold text-slate-800">{m.categoryName}</td>
                    <td className="py-2.5 font-sans">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          m.movementType === 'deposit'
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.movementType === 'collector_sale'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {m.movementType === 'deposit'
                          ? 'Setoran Nasabah (+)'
                          : m.movementType === 'collector_sale'
                          ? 'Penjualan Pengepul (-)'
                          : 'Penyesuaian Fisik (±)'}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        m.quantityKg >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {m.quantityKg >= 0 ? `+${m.quantityKg} kg` : `${m.quantityKg} kg`}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{m.stockAfterKg} kg</td>
                    <td className="py-2.5 font-sans text-slate-600 text-[11px] max-w-xs truncate">
                      {m.operatorName} • {m.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleApplyAdjustment}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  AUDIT OPNAME GUDANG
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Koreksi Stok {selectedStock.categoryName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStock(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Stok Sistem Saat Ini:</span>
                <span className="font-bold text-slate-900">{selectedStock.currentStockKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimasi Hasil Koreksi:</span>
                <span className="font-bold text-emerald-700">
                  {Math.max(0, Number((selectedStock.currentStockKg + adjustmentDelta).toFixed(2)))} kg
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Delta Penyesuaian (kg) *
                </label>
                <p className="text-[10px] text-slate-400 mb-1">
                  Gunakan angka positif (+) untuk penambahan temuan fisik, atau negatif (-) jika ada penyusutan/kerusakan.
                </p>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: -2.5 atau +4.0"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Penyesuaian Fisik (Wajib untuk Audit) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Contoh: Penyusutan kadar air kardus setelah pengeringan 3 hari."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#009CAC] py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Bukukan Koreksi Stok
              </button>
              <button
                type="button"
                onClick={() => setSelectedStock(null)}
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
