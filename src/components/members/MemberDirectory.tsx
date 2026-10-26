import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  QrCode,
  FileText,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  Scale,
  Printer,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateID, formatDateTimeID } from '../../utils/formatters';
import { Member } from '../../types';

export const MemberDirectory: React.FC = () => {
  const { members, addMember, updateMember, deposits, walletLedger, searchQuery, setSearchQuery } = useApp();

  const [filterRt, setFilterRt] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isQrCardOpen, setIsQrCardOpen] = useState<boolean>(false);

  // New member form state
  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    phoneNumber: '',
    address: '',
    rtRw: 'RT 03 / RW 05',
    kelurahan: 'Sukamaju',
    branchId: 'b-01',
    status: 'active' as const,
    notes: '',
  });

  const [formError, setFormError] = useState<string>('');

  // Filtering
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phoneNumber.includes(searchQuery) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRt = filterRt === 'all' || m.rtRw.includes(filterRt);
    return matchesSearch && matchesRt;
  });

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Nama lengkap nasabah wajib diisi.');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setFormError('Nomor telepon wajib diisi.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Alamat wajib diisi.');
      return;
    }

    const created = addMember({
      ...formData,
      status: 'active',
      qrCodeToken: `QR-${formData.fullName.replace(/\s+/g, '').toUpperCase()}-${Date.now().toString().slice(-4)}`,
    });

    setIsAddModalOpen(false);
    setSelectedMember(created);
    setFormError('');
    // reset form
    setFormData({
      fullName: '',
      nik: '',
      phoneNumber: '',
      address: '',
      rtRw: 'RT 03 / RW 05',
      kelurahan: 'Sukamaju',
      branchId: 'b-01',
      status: 'active',
      notes: '',
    });
  };

  // Member's historical deposits and ledger
  const memberDeposits = selectedMember
    ? deposits.filter((d) => d.memberId === selectedMember.id)
    : [];

  const memberLedger = selectedMember
    ? walletLedger.filter((l) => l.memberId === selectedMember.id)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            DATABASE KELOMPOK MASYARAKAT
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Data & Rekening Nasabah
          </h1>
          <p className="text-xs text-slate-500">
            Manajemen identitas nasabah bank sampah, cetak kartu QR anggota, dan monitoring saldo tabungan digital.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#009CAC] px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-md shadow-teal-900/20 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Tambah Nasabah Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, ID nasabah, no HP..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#009CAC] focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Wilayah:</span>
          <select
            value={filterRt}
            onChange={(e) => setFilterRt(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="all">Semua RT / Lingkungan</option>
            <option value="RT 01">RT 01</option>
            <option value="RT 02">RT 02</option>
            <option value="RT 03">RT 03</option>
            <option value="RT 04">RT 04</option>
            <option value="RT 05">RT 05</option>
          </select>
        </div>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-teal-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0C2D57] to-[#009CAC] text-white font-extrabold text-sm shadow-xs">
                    {member.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{member.fullName}</h3>
                    <p className="font-mono text-[11px] font-semibold text-[#009CAC]">{member.memberCode}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    member.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {member.status === 'active' ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              {/* Info details */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{member.phoneNumber}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{member.address} ({member.rtRw})</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Terdaftar sejak {formatDateID(member.registrationDate)}</span>
                </p>
              </div>

              {/* Financial & Weight Summary */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">TOTAL SETOR</span>
                  <span className="font-bold text-slate-800">{formatWeight(member.totalWeightKg)}</span>
                  <span className="text-[10px] text-slate-400 block">{member.totalDepositCount}x Transaksi</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">SALDO TABUNGAN</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {formatIDR(member.walletBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedMember(member);
                  setIsQrCardOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <QrCode className="h-3.5 w-3.5 text-[#009CAC]" />
                <span>Kartu QR</span>
              </button>

              <button
                onClick={() => setSelectedMember(member)}
                className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#009CAC] hover:bg-teal-100"
              >
                <span>Detail & Mutasi</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Member Detail & Statement Modal */}
      {selectedMember && !isQrCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0C2D57] text-white font-black text-base">
                  {selectedMember.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMember.fullName}</h3>
                  <p className="font-mono text-xs text-[#009CAC]">{selectedMember.memberCode} • NIK: {selectedMember.nik || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Saldo Tabungan Saat Ini</span>
                <p className="text-lg font-black text-emerald-700 font-mono">
                  {formatIDR(selectedMember.walletBalance)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-800 uppercase">Total Akumulasi Setor</span>
                <p className="text-lg font-black text-blue-700 font-mono">
                  {formatIDR(selectedMember.totalDepositValue)}
                </p>
              </div>
              <div className="rounded-xl bg-teal-50 p-3 border border-teal-100">
                <span className="text-[10px] font-bold text-teal-800 uppercase">Total Berat Sampah</span>
                <p className="text-lg font-black text-teal-700 font-mono">
                  {formatWeight(selectedMember.totalWeightKg)}
                </p>
              </div>
            </div>

            {/* Deposit History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Riwayat Setoran Sampah Terakhir
              </h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {memberDeposits.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">Belum ada transaksi setoran tercatat.</p>
                ) : (
                  memberDeposits.map((dep) => (
                    <div key={dep.id} className="p-3 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 font-mono">{dep.transactionCode}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{formatDateTimeID(dep.timestamp)}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {dep.items.map((i) => `${i.categoryName} (${i.weightKg} kg)`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-emerald-700">{formatIDR(dep.totalValue)}</span>
                        <span className="block text-[10px] text-slate-400">{formatWeight(dep.totalWeightKg)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wallet Mutasi */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Buku Mutasi Rekening Digital
              </h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl font-mono text-xs">
                {memberLedger.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">Belum ada mutasi rekening.</p>
                ) : (
                  memberLedger.map((ledg) => (
                    <div key={ledg.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{ledg.description}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTimeID(ledg.timestamp)} • Ref: {ledg.referenceCode}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            ledg.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {ledg.amount >= 0 ? `+${formatIDR(ledg.amount)}` : formatIDR(ledg.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Saldo: {formatIDR(ledg.balanceAfter)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Rekening Koran</span>
              </button>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-xl bg-[#009CAC] px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable QR Member Card Modal */}
      {selectedMember && isQrCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">KARTU ANGGOTA RESMI</span>
              <button onClick={() => setIsQrCardOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Fintech Card Visual */}
            <div className="rounded-2xl bg-gradient-to-tr from-[#0C2D57] via-[#082245] to-[#009CAC] p-5 text-white text-left shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-teal-300 tracking-wider uppercase">PILAH.IN SMART CARD</p>
                  <p className="text-xs text-slate-300">Bank Sampah Unit Sukamaju</p>
                </div>
                <div className="rounded-lg bg-white/20 p-1 backdrop-blur-xs">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* QR Code Placeholder with High Contrast */}
              <div className="my-4 flex items-center justify-center">
                <div className="bg-white p-3 rounded-xl shadow-md">
                  <div className="h-32 w-32 bg-slate-950 flex flex-col items-center justify-center text-white p-2 text-center rounded-lg">
                    <QrCode className="h-16 w-16 text-white mb-1" />
                    <span className="text-[9px] font-mono tracking-widest text-emerald-400">
                      {selectedMember.memberCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-2 flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-slate-300 uppercase">Nama Nasabah</p>
                  <p className="text-sm font-extrabold">{selectedMember.fullName}</p>
                  <p className="text-[10px] text-slate-300">{selectedMember.rtRw}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-300 uppercase">ID Anggota</p>
                  <p className="text-xs font-mono font-bold text-teal-200">{selectedMember.memberCode}</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Gunakan kartu ini untuk identifikasi instan di stasiun timbangan IoT Pilah.in.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#009CAC] py-2.5 text-xs font-bold text-white hover:bg-teal-700"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Kartu Member</span>
              </button>
              <button
                onClick={() => setIsQrCardOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateMember}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#009CAC]" />
                <h3 className="font-bold text-slate-900">Pendaftaran Nasabah Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-700">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap (Sesuai KTP) *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Contoh: Ibu Tri Wahyuni"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK (16 Digit - Opsional)</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="3174xxxx"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah RT / RW *</label>
                  <input
                    type="text"
                    required
                    value={formData.rtRw}
                    onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                    placeholder="RT 03 / RW 05"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelurahan</label>
                  <input
                    type="text"
                    value={formData.kelurahan}
                    onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Tempat Tinggal *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Melati Raya No. 12"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Kader Dasawisma / Toko Sembako"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#009CAC] py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Daftarkan & Buat Rekening
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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
