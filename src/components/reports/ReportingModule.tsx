import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Scale,
  Users,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateID, formatDateTimeID } from '../../utils/formatters';

export const ReportingModule: React.FC = () => {
  const { deposits, members, wasteCategories, collectorSales, currentBranch } = useApp();

  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [reportType, setReportType] = useState<'deposits' | 'members' | 'categories' | 'sales'>('deposits');

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (reportType === 'deposits') {
      csvContent += 'Kode Transaksi,Waktu,Nasabah,Kode Member,Total Berat (kg),Total Nilai (Rp),Metode,Status,IoT Valid\r\n';
      deposits.forEach((d) => {
        csvContent += `"${d.transactionCode}","${d.timestamp}","${d.memberName}","${d.memberCode}",${d.totalWeightKg},${d.totalValue},"${d.paymentMethod}","${d.status}","${d.isIotVerified}"\r\n`;
      });
    } else if (reportType === 'members') {
      csvContent += 'Kode Member,Nama Lengkap,Telepon,RT/RW,Total Setor (kg),Total Nilai (Rp),Saldo Tabungan (Rp),Status\r\n';
      members.forEach((m) => {
        csvContent += `"${m.memberCode}","${m.fullName}","${m.phoneNumber}","${m.rtRw}",${m.totalWeightKg},${m.totalDepositValue},${m.walletBalance},"${m.status}"\r\n`;
      });
    } else if (reportType === 'sales') {
      csvContent += 'Invoice,Waktu,Pengepul,Total Berat (kg),Total HPP (Rp),Total Penjualan (Rp),Laba Kotor (Rp),Metode\r\n';
      collectorSales.forEach((s) => {
        csvContent += `"${s.invoiceCode}","${s.timestamp}","${s.collectorName}",${s.totalWeightKg},${s.totalCostAmount},${s.totalSaleAmount},${s.totalGrossMargin},"${s.paymentMethod}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PilahIn_Laporan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
            BUSINESS INTELLIGENCE & EXPORT
          </span>
          <h1 className="mt-1 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Laporan Operasional & Analitik
          </h1>
          <p className="text-xs text-slate-500">
            Ekspor data transaksional terstandarisasi, rekapitulasi nasabah, dan dokumen laporan pertanggungjawaban.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-[#009CAC] px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor File CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Pilih Topik Laporan:</span>
          {[
            { id: 'deposits', label: 'Setoran Sampah' },
            { id: 'members', label: 'Buku Tabungan Nasabah' },
            { id: 'sales', label: 'Penjualan ke Pengepul' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                reportType === t.id
                  ? 'bg-[#0C2D57] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="all">Semua Data Historis</option>
          </select>
        </div>
      </div>

      {/* Report Table View */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {reportType === 'deposits'
                ? 'Laporan Rincian Setoran Nasabah'
                : reportType === 'members'
                ? 'Laporan Posisi Saldo Tabungan Anggota'
                : 'Laporan Realisasi Penjualan Material'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Unit: {currentBranch.name} • Waktu Cetak: {formatDateTimeID(new Date().toISOString())}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {reportType === 'deposits'
              ? `${deposits.length} Baris Data`
              : reportType === 'members'
              ? `${members.length} Rekening`
              : `${collectorSales.length} Faktur`}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {reportType === 'deposits' && (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">Kode TRX</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3 font-sans">Nama Nasabah</th>
                  <th className="pb-3 text-right">Berat</th>
                  <th className="pb-3 text-right">Nilai Diterima</th>
                  <th className="pb-3 font-sans">Metode</th>
                  <th className="pb-3 font-sans">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pl-2 font-bold text-slate-800">{d.transactionCode}</td>
                    <td className="py-2.5 text-slate-500">{formatDateID(d.timestamp)}</td>
                    <td className="py-2.5 font-sans font-bold text-slate-800">{d.memberName} ({d.memberCode})</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatWeight(d.totalWeightKg)}</td>
                    <td className="py-2.5 text-right font-black text-emerald-700">{formatIDR(d.totalValue)}</td>
                    <td className="py-2.5 font-sans text-slate-600 capitalize">{d.paymentMethod}</td>
                    <td className="py-2.5 font-sans text-slate-600">{d.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'members' && (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">ID Anggota</th>
                  <th className="pb-3 font-sans">Nama Lengkap</th>
                  <th className="pb-3">No. HP</th>
                  <th className="pb-3 font-sans">Wilayah</th>
                  <th className="pb-3 text-right">Total Setor</th>
                  <th className="pb-3 text-right">Saldo Tabungan</th>
                  <th className="pb-3 font-sans text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pl-2 font-bold text-[#009CAC]">{m.memberCode}</td>
                    <td className="py-2.5 font-sans font-bold text-slate-800">{m.fullName}</td>
                    <td className="py-2.5 text-slate-600">{m.phoneNumber}</td>
                    <td className="py-2.5 font-sans text-slate-600">{m.rtRw}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{formatWeight(m.totalWeightKg)}</td>
                    <td className="py-2.5 text-right font-black text-emerald-700 text-sm">{formatIDR(m.walletBalance)}</td>
                    <td className="py-2.5 text-center font-sans">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales' && (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">No. Faktur</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3 font-sans">Pengepul</th>
                  <th className="pb-3 text-right">Berat (kg)</th>
                  <th className="pb-3 text-right">HPP (Rp)</th>
                  <th className="pb-3 text-right">Nilai Jual (Rp)</th>
                  <th className="pb-3 text-right">Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collectorSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pl-2 font-bold text-slate-800">{s.invoiceCode}</td>
                    <td className="py-2.5 text-slate-500">{formatDateID(s.timestamp)}</td>
                    <td className="py-2.5 font-sans font-bold text-slate-800">{s.collectorName}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{formatWeight(s.totalWeightKg)}</td>
                    <td className="py-2.5 text-right text-rose-600 font-bold">{formatIDR(s.totalCostAmount)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatIDR(s.totalSaleAmount)}</td>
                    <td className="py-2.5 text-right font-black text-emerald-700 text-xs">
                      +{formatIDR(s.totalGrossMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
