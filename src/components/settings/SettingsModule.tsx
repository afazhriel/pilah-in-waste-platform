import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  RotateCcw,
  Database,
  Building,
  User,
  History,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeID } from '../../utils/formatters';

export const SettingsModule: React.FC = () => {
  const {
    currentBranch,
    currentUser,
    auditLogs,
    resetToDemoData,
    isDemoMode,
    setIsDemoMode,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'audit' | 'database'>('audit');
  const [copySuccess, setCopySuccess] = useState(false);

  const sampleSchema = `-- PILAH.IN PostgreSQL DDL Migration (20 Tables)
-- organizations, branches, profiles, members, waste_categories, category_price_history,
-- weighing_devices, device_telemetry, calibration_records, deposit_transactions,
-- deposit_items, wallet_accounts, wallet_ledger, inventory_movements, collectors,
-- collector_sales, collector_sale_items, expenses, withdrawal_requests, audit_logs.

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    member_code VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    wallet_balance BIGINT DEFAULT 0 CHECK (wallet_balance >= 0)
);

CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id),
    reference_type VARCHAR(32) NOT NULL,
    reference_code VARCHAR(64) NOT NULL,
    amount BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sampleSchema);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            SISTEM & GOVERNANCE
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Pengaturan & Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Rekam jejak seluruh transaksi operasional, konfigurasi unit kerja, serta dokumentasi struktur data PostgreSQL.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeSubTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Log Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeSubTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Info Unit & Akun
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeSubTab === 'database' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Skema Database SQL
          </button>
        </div>
      </div>

      {activeSubTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Log Audit Aktivitas Sistem (Immutable Activity Trail)
              </h3>
              <p className="text-[11px] text-slate-400">
                Setiap aksi setoran, penarikan, perubahan harga, dan kalibrasi terekam dengan timestamp Asia/Jakarta.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              {auditLogs.length} Entri
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">Waktu (WIB)</th>
                  <th className="pb-3 font-sans">Aktor & Peran</th>
                  <th className="pb-3">Aksi</th>
                  <th className="pb-3">Entitas</th>
                  <th className="pb-3 font-sans">Deskripsi Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pl-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDateTimeID(log.timestamp)}
                    </td>
                    <td className="py-2.5 font-sans whitespace-nowrap">
                      <p className="font-bold text-slate-800">{log.actor}</p>
                      <span className="text-[10px] text-[#009CAC] font-semibold">{log.role}</span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-900">{log.action}</td>
                    <td className="py-2.5 text-slate-600 text-[11px]">{log.entityId}</td>
                    <td className="py-2.5 font-sans text-slate-700 text-xs max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Branch details */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="h-4 w-4 text-[#009CAC]" />
              <h3 className="font-bold text-slate-800 text-sm">Informasi Unit Bank Sampah</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Nama Unit:</span>
                <span className="font-bold text-slate-800">{currentBranch.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Kode Cabang:</span>
                <span className="font-mono font-bold text-slate-800">{currentBranch.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Alamat:</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{currentBranch.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Kepala Unit:</span>
                <span className="font-bold text-slate-800">{currentBranch.manager}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Kontak Resmi:</span>
                <span className="font-bold text-slate-800">{currentBranch.phone}</span>
              </div>
            </div>
          </div>

          {/* Operator profile & Reset Data */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-[#009CAC]" />
              <h3 className="font-bold text-slate-800 text-sm">Sesi Operator Aktif</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0C2D57] text-white font-bold">
                BS
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
                <p className="text-xs text-[#009CAC] font-semibold">{currentUser.role}</p>
                <p className="text-[11px] text-slate-400">{currentUser.email}</p>
              </div>
            </div>

            {/* Reset Data Warning Box */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>Reset Database ke Kondisi Awal Demo</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Menghapus semua perubahan lokal dan mengembalikan data nasabah, transaksi, dan stok gudang ke kondisi seed awal.
              </p>
              <button
                onClick={resetToDemoData}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white transition shadow-xs"
              >
                Reset Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="rounded-2xl border border-slate-800 bg-[#061529] p-5 shadow-xl text-white space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-teal-400" />
              <span className="font-mono text-xs font-bold text-teal-300">
                PostgreSQL Schema DDL (Supabase / Cloud SQL)
              </span>
            </div>
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white transition"
            >
              <Copy className="h-3 w-3" />
              <span>{copySuccess ? 'Tersalin!' : 'Salin DDL'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Skema ternormalisasi lengkap mencakup 20 tabel entitas sesuai spesifikasi Bagian 13 (tersimpan di <code>src/db/schema.sql</code>).
          </p>

          <pre className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-teal-300 overflow-x-auto border border-white/5 leading-relaxed max-h-96">
            {sampleSchema}
          </pre>
        </div>
      )}
    </div>
  );
};
