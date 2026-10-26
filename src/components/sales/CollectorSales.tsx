import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Printer,
  TrendingUp,
  AlertCircle,
  Building,
  UserCheck,
  Coins,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateTimeID, formatDateID } from '../../utils/formatters';
import { CollectorSale } from '../../types';

export const CollectorSales: React.FC = () => {
  const {
    collectors,
    collectorSales,
    wasteCategories,
    inventoryStocks,
    recordCollectorSale,
    currentUser,
  } = useApp();

  const [selectedCollectorId, setSelectedCollectorId] = useState<string>(collectors[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'tunai' | 'giro'>('transfer');
  const [vehicleNumber, setVehicleNumber] = useState<string>('B 9231 TKL');
  const [driverName, setDriverName] = useState<string>('Pak Joko Santoso');
  const [notes, setNotes] = useState<string>('Pengangkutan rit 1 material daur ulang');
  const [items, setItems] = useState<Array<{ categoryId: string; weightKg: number }>>([
    { categoryId: 'cat-kardus', weightKg: 100 },
  ]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<CollectorSale | null>(null);

  const selectedCollector = collectors.find((c) => c.id === selectedCollectorId);

  // Add item
  const handleAddItem = () => {
    setItems((prev) => [...prev, { categoryId: wasteCategories[0]?.id || '', weightKg: 50 }]);
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

  // Real-time calculation of Sale items
  const calculatedItems = items.map((item) => {
    const cat = wasteCategories.find((c) => c.id === item.categoryId);
    const stock = inventoryStocks.find((s) => s.categoryId === item.categoryId);
    const costPrice = cat ? cat.buyPricePerKg : 0;
    const sellPrice = cat ? cat.sellPricePerKg : 0;
    const weight = Number(item.weightKg) || 0;
    const totalCost = Math.round(weight * costPrice);
    const totalRevenue = Math.round(weight * sellPrice);
    const grossMargin = totalRevenue - totalCost;

    return {
      ...item,
      categoryName: cat?.name || '',
      availableStock: stock?.currentStockKg || 0,
      costPrice,
      sellPrice,
      totalCost,
      totalRevenue,
      grossMargin,
    };
  });

  const totalWeightKg = calculatedItems.reduce((acc, i) => acc + i.weightKg, 0);
  const totalCostAmount = calculatedItems.reduce((acc, i) => acc + i.totalCost, 0);
  const totalRevenueAmount = calculatedItems.reduce((acc, i) => acc + i.totalRevenue, 0);
  const totalGrossMargin = totalRevenueAmount - totalCostAmount;
  const marginPercentage =
    totalRevenueAmount > 0 ? ((totalGrossMargin / totalRevenueAmount) * 100).toFixed(1) : 0;

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollector) return;

    const res = recordCollectorSale({
      collectorId: selectedCollector.id,
      items: items.map((i) => ({ categoryId: i.categoryId, weightKg: Number(i.weightKg) })),
      paymentMethod,
      vehicleNumber,
      driverName,
      notes,
    });

    if (res.success && res.sale) {
      setSelectedInvoice(res.sale);
      setFeedback({
        type: 'success',
        message: `Penjualan ${res.sale.invoiceCode} ke ${selectedCollector.companyName} berhasil. Laba kotor terealisasi: ${formatIDR(res.sale.totalGrossMargin)}.`,
      });
      // reset
      setItems([{ categoryId: 'cat-kardus', weightKg: 100 }]);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan penjualan pengepul.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            OFF-TAKER & MONETISASI
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Penjualan Sampah ke Pengepul
          </h1>
          <p className="text-xs text-slate-500">
            Realisasi pendapatan dan margin kotor dari penjualan agregasi material sampah gudang ke mitra industri daur ulang.
          </p>
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

      {/* Main Grid: Sale Creation Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Create Sale */}
        <form onSubmit={handleSubmitSale} className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              SURAT JALAN & NOTA PENJUALAN PENGEPUL
            </h2>

            {/* Collector selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Mitra Pengepul / Pabrik
              </label>
              <select
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-[#009CAC] focus:bg-white focus:outline-hidden"
              >
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.name}) • {c.categoriesHandled.join(', ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle & Driver */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plat Nomor Kendaraan</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Contoh: B 9182 KDF"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pengemudi / Sopir</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Contoh: Pak Joko"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Daftar Material yang Diangkut</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs font-bold text-[#009CAC] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Jenis Sampah</span>
                </button>
              </div>

              {items.map((item, idx) => {
                const row = calculatedItems[idx];
                const isOverStock = (row?.weightKg || 0) > (row?.availableStock || 0);

                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 border transition ${
                      isOverStock ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex-1 w-full">
                        <select
                          value={item.categoryId}
                          onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800"
                        >
                          {wasteCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-36">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.weightKg}
                          onChange={(e) =>
                            handleItemChange(idx, 'weightKg', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-right text-slate-800"
                        />
                        <span className="text-xs font-bold text-slate-500">kg</span>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Breakdown per item */}
                    <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Tersedia di Gudang: <b className="text-slate-800">{row?.availableStock} kg</b></span>
                      <span>HPP: {formatIDR(row?.costPrice || 0)}/kg</span>
                      <span>Harga Jual: {formatIDR(row?.sellPrice || 0)}/kg</span>
                      <span className="font-bold text-emerald-700">
                        Laba: {formatIDR(row?.grossMargin || 0)}
                      </span>
                    </div>

                    {isOverStock && (
                      <p className="mt-1 text-[11px] font-bold text-rose-600">
                        Peringatan: Kuantitas melebihi stok yang tersedia di gudang!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financial Summary Calculation Banner */}
            <div className="rounded-2xl bg-[#0C2D57] p-4 text-white font-mono space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Berat Angkut:</span>
                <span className="font-bold text-white">{formatWeight(totalWeightKg)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total HPP (Modal Beli Nasabah):</span>
                <span className="font-bold text-slate-200">{formatIDR(totalCostAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Pendapatan Kotor dari Pengepul:</span>
                <span className="font-bold text-white">{formatIDR(totalRevenueAmount)}</span>
              </div>
              <div className="border-t border-white/20 pt-2 flex items-baseline justify-between text-sm">
                <span className="font-bold text-teal-300 uppercase">LABA KOTOR REALISASI:</span>
                <span className="text-xl font-black text-[#DDF7EE]">
                  +{formatIDR(totalGrossMargin)} ({marginPercentage}%)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={totalWeightKg <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009CAC] py-3.5 text-xs font-black text-white hover:bg-teal-700 transition shadow-md shadow-teal-900/20 active:scale-98"
            >
              <Truck className="h-4 w-4" />
              <span>Simpan Penjualan & Terbitkan Surat Jalan</span>
            </button>
          </div>
        </form>

        {/* Right Column: Invoice Preview & Historical Sales */}
        <div className="lg:col-span-5 space-y-4">
          {/* Printable Invoice */}
          {selectedInvoice && (
            <div className="rounded-2xl border-2 border-teal-500/40 bg-white p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#009CAC]" />
                  <span className="text-xs font-bold text-slate-900">Surat Jalan / Invoice Pengepul</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak</span>
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700 space-y-2 border border-slate-200">
                <div className="text-center border-b border-dashed border-slate-300 pb-2">
                  <p className="font-black text-slate-900">SURAT JALAN ANGKUT SAMPAH</p>
                  <p className="text-[10px] text-slate-500">{selectedInvoice.invoiceCode} • {formatDateTimeID(selectedInvoice.timestamp)}</p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <p><b>Mitra Pengepul:</b> {selectedInvoice.collectorName}</p>
                  <p><b>Armada:</b> {selectedInvoice.vehicleNumber} ({selectedInvoice.driverName})</p>
                  <p><b>Petugas Gudang:</b> {selectedInvoice.operatorName}</p>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                  {selectedInvoice.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{i.categoryName} ({i.weightKg} kg)</span>
                      <span className="font-bold">{formatIDR(i.totalRevenue)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-black text-xs text-slate-900">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="text-emerald-700">{formatIDR(selectedInvoice.totalSaleAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Realisasi Laba Kotor:</span>
                  <span className="font-bold text-teal-800">+{formatIDR(selectedInvoice.totalGrossMargin)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Historical Sales Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              RIWAYAT PENJUALAN PENGEPUL
            </h3>
            <div className="divide-y divide-slate-100 mt-2 max-h-80 overflow-y-auto">
              {collectorSales.map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{sale.collectorName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {sale.invoiceCode} • {sale.totalWeightKg} kg • {formatDateID(sale.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-900">{formatIDR(sale.totalSaleAmount)}</span>
                    <span className="block text-[10px] font-mono text-emerald-700 font-bold">
                      +{formatIDR(sale.totalGrossMargin)} laba
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
