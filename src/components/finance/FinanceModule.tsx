import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatDateID, formatDateTimeID } from '../../utils/formatters';
import { calculateFinancialSummary } from '../../utils/calculations';

export const FinanceModule: React.FC = () => {
  const {
    members,
    deposits,
    collectorSales,
    expenses,
    walletLedger,
    addOperationalExpense,
    currentUser,
  } = useApp();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'operasional' as const,
    amount: 50000,
    description: '',
    receiptNumber: '',
    date: new Date().toISOString().slice(0, 10),
    operatorName: currentUser.name,
  });

  // Financial Calculations
  const totalDepositValue = deposits.reduce((acc, d) => acc + d.totalValue, 0);
  const totalWalletBalances = members.reduce((acc, m) => acc + m.walletBalance, 0);
  const totalWithdrawalsPaid = walletLedger
    .filter((l) => l.referenceType === 'withdrawal')
    .reduce((acc, l) => acc + Math.abs(l.amount), 0);

  const collectorSalesRevenue = collectorSales.reduce((acc, s) => acc + s.totalSaleAmount, 0);
  const collectorSalesCost = collectorSales.reduce((acc, s) => acc + s.totalCostAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const financeSummary = calculateFinancialSummary({
    totalDepositValue,
    totalWalletBalances,
    totalWithdrawalsPaid,
    collectorSalesRevenue,
    collectorSalesCost,
    operationalExpenses: totalExpenses,
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0 || !expenseForm.description.trim()) return;

    addOperationalExpense({
      ...expenseForm,
      operatorName: currentUser.name,
    });

    setIsExpenseModalOpen(false);
    setExpenseForm({
      category: 'operasional',
      amount: 50000,
      description: '',
      receiptNumber: '',
      date: new Date().toISOString().slice(0, 10),
      operatorName: currentUser.name,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            AKUNTANSI & KEUANGAN
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Laporan Keuangan & Rekonsiliasi Kas
          </h1>
          <p className="text-xs text-slate-500">
            Pemisahan ketat antara liabilitas tabungan nasabah, pendapatan riil penjualan pengepul, dan laba bersih operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#009CAC] px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Beban Operasional</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Neraca</span>
          </button>
        </div>
      </div>

      {/* Financial Structure Diagram Card */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-4">
          STRUKTUR LABA RUGI & ARUS KAS BANK SAMPAH
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Pendapatan Penjualan */}
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase">1. Pendapatan Penjualan Pengepul</span>
            <span className="text-xl font-black text-white">{formatIDR(collectorSalesRevenue)}</span>
            <span className="text-[10px] text-teal-300 block mt-1">Omzet penjualan material daur ulang</span>
          </div>

          {/* HPP */}
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase">2. Harga Pokok Penjualan (HPP)</span>
            <span className="text-xl font-bold text-rose-300">-{formatIDR(collectorSalesCost)}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Modal beli dari nasabah</span>
          </div>

          {/* Laba Kotor */}
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase">3. Laba Kotor Terealisasi</span>
            <span className="text-xl font-black text-emerald-400">
              +{formatIDR(financeSummary.realizedGrossMargin)}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-1">Margin penjualan bruto</span>
          </div>

          {/* Laba Bersih */}
          <div className="rounded-xl bg-[#009CAC] p-4 text-[#0C2D57] shadow-lg">
            <span className="text-[10px] font-bold text-teal-950 block uppercase">4. Laba Bersih Operasional</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {formatIDR(financeSummary.netOperationalProfit)}
            </span>
            <span className="text-[10px] text-teal-950 font-bold block mt-1">
              Setelah dikurangi biaya operasional ({formatIDR(totalExpenses)})
            </span>
          </div>
        </div>
      </div>

      {/* Liabilities vs Cash Inflow Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tabungan Liabilities */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">POS LIABILITAS</span>
              <h3 className="text-sm font-extrabold text-slate-900">Rekonsiliasi Tabungan Nasabah</h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700 font-mono font-bold text-xs">
              {members.length} Rekening
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">Total Akumulasi Setoran Masuk:</span>
              <span className="font-bold text-slate-900">{formatIDR(totalDepositValue)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">Total Penarikan Kas Terbayar:</span>
              <span className="font-bold text-rose-600">-{formatIDR(totalWithdrawalsPaid)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200 font-bold text-blue-900 text-sm">
              <span>Sisa Kewajiban Tabungan Belum Ditarik:</span>
              <span className="font-black text-blue-800">{formatIDR(totalWalletBalances)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            * <b>Catatan Akuntansi:</b> Nilai setoran nasabah <u>bukan pendapatan</u> bank sampah, melainkan kewajiban (utang simpanan) yang wajib dicairkan saat nasabah meminta penarikan.
          </p>
        </div>

        {/* Right: Operational Expenses */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase">POS BEBAN</span>
              <h3 className="text-sm font-extrabold text-slate-900">Beban Operasional Bank Sampah</h3>
            </div>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-800 font-mono font-bold text-xs">
              Total {formatIDR(totalExpenses)}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{exp.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {exp.expenseCode} • {formatDateID(exp.date)} • {exp.operatorName}
                  </p>
                </div>
                <span className="font-mono font-bold text-rose-600">-{formatIDR(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Add Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateExpense}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Catat Beban Operasional Baru</h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Beban</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800"
                >
                  <option value="peralatan">Peralatan (Karung, Tali, ATK)</option>
                  <option value="transportasi">Transportasi & Pengangkutan</option>
                  <option value="konsumsi">Konsumsi Petugas / Rapat Pengurus</option>
                  <option value="operasional">Pemeliharaan / Listrik / Internet</option>
                  <option value="lainnya">Beban Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Pengeluaran *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Contoh: Beli 20 karung jumbo untuk botol PET"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Nota / Kwitansi (Opsional)</label>
                <input
                  type="text"
                  value={expenseForm.receiptNumber}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                  placeholder="NOTA-xxx"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#009CAC] py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Simpan Beban
              </button>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
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
