import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatDateTimeID, formatDateID } from '../../utils/formatters';

export const DigitalWallet: React.FC = () => {
  const {
    members,
    walletLedger,
    withdrawalRequests,
    requestWithdrawal,
    processWithdrawal,
    currentUser,
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'requests' | 'ledger'>('requests');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50000);
  const [payoutMethod, setPayoutMethod] = useState<'tunai' | 'transfer_bank' | 'emoney'>('tunai');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Financial statistics
  const totalWalletLiability = members.reduce((acc, m) => acc + m.walletBalance, 0);
  const totalDepositedAllTime = members.reduce((acc, m) => acc + m.totalDepositValue, 0);
  const totalWithdrawnAllTime = walletLedger
    .filter((l) => l.referenceType === 'withdrawal')
    .reduce((acc, l) => acc + Math.abs(l.amount), 0);

  const pendingRequests = withdrawalRequests.filter((r) => r.status === 'pending');

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const res = requestWithdrawal(selectedMember.id, withdrawAmount, payoutMethod, withdrawNotes);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Pengajuan pencairan saldo sebesar ${formatIDR(withdrawAmount)} untuk ${selectedMember.fullName} berhasil diajukan.`,
      });
      setWithdrawNotes('');
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal mengajukan pencairan.' });
    }
  };

  const handleApprove = (id: string) => {
    const res = processWithdrawal(id, true);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Penarikan saldo disetujui. Saldo nasabah telah didebet dan kas dibayarkan.' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal memproses penarikan.' });
    }
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;

    const res = processWithdrawal(rejectingId, false, rejectReason);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Pengajuan penarikan saldo ditolak.' });
      setRejectingId(null);
      setRejectReason('');
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal memproses penolakan.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            FINANSIAL TABUNGAN DIGITAL
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Tabungan & Penarikan Saldo
          </h1>
          <p className="text-xs text-slate-500">
            Sistem buku besar (ledger) tabungan nasabah yang diaudit, anti duplikasi kredit, dan mutasi transparan.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Laporan Kewajiban Saldo</span>
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

      {/* KPI Cards for Digital Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Saldo Terparkir (Kewajiban)</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatIDR(totalWalletLiability)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kewajiban kas yang tersimpan di {members.length} rekening nasabah
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Akumulasi Kredit Setoran</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {formatIDR(totalDepositedAllTime)}
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">
            Nilai ekonomis sampah terkonversi
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Penarikan Terbayar</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatIDR(totalWithdrawnAllTime)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kas tunai/transfer dicairkan ke nasabah
          </p>
        </div>
      </div>

      {/* Main Grid: Withdrawal Request Form & Ledger Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Withdrawal Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleCreateWithdrawal} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                PENARIKAN SALDO TABUNGAN
              </h2>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Formulir Pencairan Dana Nasabah
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Nasabah
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-[#009CAC] focus:bg-white focus:outline-hidden"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.memberCode} - {m.fullName} • Saldo: {formatIDR(m.walletBalance)}
                  </option>
                ))}
              </select>

              {selectedMember && (
                <div className="mt-2 rounded-xl bg-slate-50 p-3 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Alamat</span>
                    <span className="font-semibold text-slate-700">{selectedMember.address}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Saldo Siap Tarik</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {formatIDR(selectedMember.walletBalance)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nominal Penarikan (Rp) *
              </label>
              <input
                type="number"
                min="10000"
                step="5000"
                max={selectedMember?.walletBalance || 0}
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900 text-sm focus:border-[#009CAC] focus:outline-hidden"
              />

              {/* Quick Amount Buttons */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[20000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt)}
                    disabled={(selectedMember?.walletBalance || 0) < amt}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-2 py-1 text-[11px] font-mono font-semibold text-slate-700"
                  >
                    {formatIDR(amt)}
                  </button>
                ))}
                {selectedMember && (
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(selectedMember.walletBalance)}
                    className="rounded-lg bg-teal-50 text-[#009CAC] hover:bg-teal-100 px-2 py-1 text-[11px] font-mono font-bold"
                  >
                    Tarik Semua ({formatIDR(selectedMember.walletBalance)})
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800"
              >
                <option value="tunai">Tunai Kas Operasional</option>
                <option value="transfer_bank">Transfer Bank (BCA / BRI / Mandiri)</option>
                <option value="emoney">E-Wallet (GoPay / OVO / Dana)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Keperluan (Opsional)
              </label>
              <input
                type="text"
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
                placeholder="Contoh: Belanja dapur harian"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedMember || selectedMember.walletBalance < withdrawAmount || withdrawAmount <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009CAC] py-3 text-xs font-bold text-white hover:bg-teal-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-teal-900/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Ajukan Permohonan Penarikan</span>
            </button>
          </form>
        </div>

        {/* Right: Tabs for Requests & Full Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTabSub('requests')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTabSub === 'requests'
                      ? 'bg-[#0C2D57] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Permintaan Pencairan ({pendingRequests.length})
                </button>
                <button
                  onClick={() => setActiveTabSub('ledger')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTabSub === 'ledger'
                      ? 'bg-[#0C2D57] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Mutasi Buku Besar ({walletLedger.length})
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                Audit Trail Aktif
              </span>
            </div>

            {activeTabSub === 'requests' ? (
              <div className="divide-y divide-slate-100 mt-2">
                {withdrawalRequests.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">
                    Tidak ada riwayat pengajuan penarikan dana.
                  </p>
                ) : (
                  withdrawalRequests.map((req) => (
                    <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{req.memberName}</span>
                          <span className="font-mono text-[10px] text-[#009CAC]">{req.memberCode}</span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                              req.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : req.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {req.status === 'pending'
                              ? 'MENUNGGU VERIFIKASI'
                              : req.status === 'approved'
                              ? 'DISETUJUI & DIBAYAR'
                              : 'DITOLAK'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {req.withdrawalCode} • {formatDateTimeID(req.requestDate)} • Metode: {req.payoutMethod.toUpperCase()}
                        </p>
                        {req.notes && <p className="text-[11px] text-slate-600 mt-1">"{req.notes}"</p>}
                        {req.rejectionReason && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                            Alasan Penolakan: {req.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-end justify-between gap-1">
                        <span className="text-sm font-mono font-black text-rose-700">
                          -{formatIDR(req.amount)}
                        </span>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => setRejectingId(req.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Full Wallet Ledger */
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                      <th className="pb-3 pl-2">Waktu & Ref</th>
                      <th className="pb-3 font-sans">Keterangan</th>
                      <th className="pb-3 text-right">Debit / Kredit</th>
                      <th className="pb-3 text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {walletLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pl-2 text-[11px]">
                          <p className="font-bold text-slate-800">{item.referenceCode}</p>
                          <p className="text-[10px] text-slate-400">{formatDateTimeID(item.timestamp)}</p>
                        </td>
                        <td className="py-2.5 font-sans text-slate-700 text-xs">
                          {item.description}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold text-xs ${
                            item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.amount >= 0 ? `+${formatIDR(item.amount)}` : formatIDR(item.amount)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-xs text-slate-900">
                          {formatIDR(item.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleRejectConfirm}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">Tolak Permohonan Penarikan</h3>
            <p className="text-xs text-slate-500">
              Silakan tuliskan alasan penolakan untuk transparansi pencatatan nasabah.
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Saldo sedang dialokasikan untuk pemeliharaan kas / verifikasi identitas tidak cocok."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Konfirmasi Penolakan
              </button>
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
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
