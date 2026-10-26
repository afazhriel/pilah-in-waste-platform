import React, { useState } from 'react';
import {
  Scale,
  Coins,
  Wallet,
  Users,
  Boxes,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Printer,
  Sparkles,
  Info,
  Calendar,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateTimeID, formatTimeOnlyID } from '../../utils/formatters';
import { DepositTransaction } from '../../types';

export const OverviewDashboard: React.FC = () => {
  const {
    members,
    deposits,
    wasteCategories,
    inventoryStocks,
    collectorSales,
    devices,
    activeDeviceId,
    simulatedWeightKg,
    isScaleStable,
    withdrawalRequests,
    setActiveTab,
  } = useApp();

  const [selectedReceipt, setSelectedReceipt] = useState<DepositTransaction | null>(null);

  // 1. Calculate KPI Metrics
  const totalWeightKgAllTime = deposits.reduce((acc, d) => acc + d.totalWeightKg, 0);

  // Today's deposits (Asia/Jakarta standard)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDeposits = deposits.filter((d) => d.timestamp.startsWith(todayStr));
  const todayDepositValue = todayDeposits.reduce((acc, d) => acc + d.totalValue, 0);
  const todayWeightKg = todayDeposits.reduce((acc, d) => acc + d.totalWeightKg, 0);

  // Total Member Balances (Kewajiban Tabungan)
  const totalMemberBalances = members.reduce((acc, m) => acc + m.walletBalance, 0);
  const activeMembersCount = members.filter((m) => m.status === 'active').length;

  // Total Available Stock in Warehouse
  const totalAvailableStockKg = inventoryStocks.reduce((acc, s) => acc + s.availableStockKg, 0);

  // Realized Gross Margin from collector sales
  const totalRealizedMargin = collectorSales.reduce((acc, s) => acc + s.totalGrossMargin, 0);

  // Active IoT device
  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending');

  // 2. Prepare Data for Charts
  // Collection composition
  const compositionData = wasteCategories.map((cat) => {
    const stock = inventoryStocks.find((s) => s.categoryId === cat.id);
    return {
      name: cat.name.split(' (')[0], // clean label
      value: stock ? stock.currentStockKg : 0,
      color: cat.color,
    };
  }).filter((item) => item.value > 0);

  // Daily Trend Mock Data aligned with real timestamps
  const trendData = [
    { date: '19 Okt', beratKg: 45.2, nilaiRp: 180000, marginRp: 65000 },
    { date: '20 Okt', beratKg: 62.0, nilaiRp: 245000, marginRp: 90000 },
    { date: '21 Okt', beratKg: 38.5, nilaiRp: 154000, marginRp: 52000 },
    { date: '22 Okt', beratKg: 85.0, nilaiRp: 340000, marginRp: 145000 },
    { date: '23 Okt', beratKg: 54.3, nilaiRp: 215000, marginRp: 78000 },
    { date: '24 Okt', beratKg: 92.4, nilaiRp: 395000, marginRp: 160000 },
    { date: '25 Okt (Hari Ini)', beratKg: todayWeightKg || 64.7, nilaiRp: todayDepositValue || 268000, marginRp: 110000 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2D57] via-[#082245] to-[#009CAC] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-400/20 px-2.5 py-0.5 text-xs font-semibold text-[#DDF7EE] tracking-wide">
                OPERASIONAL REAL-TIME
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight lg:text-3xl">
              Dashboard Bank Sampah Pintar
            </h1>
            <p className="mt-1 text-xs text-slate-200 max-w-xl font-normal leading-relaxed">
              Pantau timbangan digital ESP32 secara instan, kelola tabungan nasabah, dan optimalisasi margin penjualan ke pengepul daur ulang.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('timbangan')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#009CAC] to-[#159B70] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-900/40 transition hover:brightness-110 active:scale-95"
            >
              <Cpu className="h-4 w-4" />
              <span>Buka Timbangan IoT</span>
            </button>
            <button
              onClick={() => setActiveTab('setoran')}
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
            >
              <Scale className="h-4 w-4" />
              <span>+ Setor Sampah</span>
            </button>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="pointer-events-none absolute right-48 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-xl" />
      </div>

      {/* KPI Cards Grid (Fintech Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Sampah */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Total Sampah</span>
            <div className="rounded-xl bg-teal-50 p-2 text-[#009CAC]">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatWeight(totalWeightKgAllTime)}
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            <span>+{formatWeight(todayWeightKg)} hari ini</span>
          </p>
        </div>

        {/* KPI 2: Nilai Setoran Hari Ini */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Setoran Hari Ini</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatIDR(todayDepositValue)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {todayDeposits.length} transaksi tercatat
          </p>
        </div>

        {/* KPI 3: Total Saldo Nasabah (Kewajiban) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Saldo Nasabah</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatIDR(totalMemberBalances)}
          </div>
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            Kewajiban liabilitas tabungan
          </p>
        </div>

        {/* KPI 4: Nasabah Aktif */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Nasabah Aktif</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {activeMembersCount} <span className="text-xs font-normal text-slate-400">Orang</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            100% partisipasi warga
          </p>
        </div>

        {/* KPI 5: Stok Tersedia */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Stok Gudang</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatWeight(totalAvailableStockKg)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Siap jual ke pengepul
          </p>
        </div>

        {/* KPI 6: Margin Realisasi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Margin Terealisasi</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight text-emerald-700">
            {formatIDR(totalRealizedMargin)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Laba kotor operasional
          </p>
        </div>
      </div>

      {/* Operational Intelligence Card & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IoT Live Monitoring Widget */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#009CAC]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Timbangan Terhubung
              </h2>
            </div>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                activeDevice.status === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  activeDevice.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {activeDevice.status.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Perangkat Aktif</p>
              <p className="text-sm font-bold text-slate-900">{activeDevice.name}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                MAC: {activeDevice.macAddress} • Firmware {activeDevice.firmwareVersion}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-right font-mono border border-slate-200/60">
              <p className="text-[9px] text-slate-400 uppercase">Live Sensor</p>
              <p className="text-lg font-black text-slate-900">
                {simulatedWeightKg > 0 ? `${simulatedWeightKg.toFixed(2)} kg` : '0,00 kg'}
              </p>
              <span
                className={`inline-block text-[9px] font-bold ${
                  isScaleStable ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {isScaleStable ? '● Stabil' : '○ Mengukur...'}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Kapasitas Maksimal</span>
              <span className="font-semibold text-slate-700">{activeDevice.maxCapacityKg} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Akurasi Sensor</span>
              <span className="font-semibold text-slate-700">±{activeDevice.precisionGram} gram</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Kalibrasi Terakhir</span>
              <span className="font-semibold text-slate-700">22 Okt 2026 (Presisi)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Koneksi / Ping</span>
              <span className="font-semibold text-emerald-600">
                {formatTimeOnlyID(activeDevice.lastHeartbeat)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('timbangan')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-[#009CAC] transition-colors"
          >
            <span>Buka Ruang Penimbangan Mandiri</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Operational Attention & Pending Alerts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Intelijen Operasional & Tindakan Cepat
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              3 Perhatian
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Alert 1: Pending Withdrawal */}
            {pendingWithdrawals.length > 0 ? (
              <div className="flex items-center justify-between rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900">
                      {pendingWithdrawals.length} Permintaan Pencairan Saldo Menunggu Persetujuan
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Total {formatIDR(pendingWithdrawals.reduce((a, b) => a + b.amount, 0))} diajukan oleh nasabah.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('tabungan')}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
                >
                  Verifikasi
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Semua pengajuan pencairan saldo telah diproses tuntas.</span>
              </div>
            )}

            {/* Alert 2: High Stock ready for collector */}
            <div className="flex items-center justify-between rounded-xl bg-teal-50/70 border border-teal-200/60 p-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-teal-100 p-2 text-teal-800">
                  <Boxes className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-teal-950">
                    Stok Kardus & Plastik PET Mencapai Batas Optimum Penjualan
                  </p>
                  <p className="text-[11px] text-teal-800">
                    Kardus (480 kg) dan PET (245,5 kg) siap diangkut oleh CV Daur Mulya Pratama. Estimasi margin: Rp 1,45 Juta.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('penjualan')}
                className="rounded-lg bg-[#009CAC] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
              >
                Jual ke Pengepul
              </button>
            </div>

            {/* Alert 3: Routine Calibration check */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Pemeriksaan Kalibrasi Timbangan Rutin</p>
                  <p className="text-[11px] text-slate-500">
                    Deviasi load-cell ESP32 saat ini berada di 0,02%. Kalibrasi berkala disarankan setiap 30 hari.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('perangkat')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cek Sensor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Penyetoran Sampah Mingguan */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tren Penyetoran & Nilai Sampah (7 Hari Terakhir)
              </h2>
              <p className="text-[11px] text-slate-400">Volume akumulasi timbangan versus nilai Rupiah yang disetor</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-teal-700">
                <span className="h-2.5 w-2.5 rounded-full bg-[#009CAC]" /> Volume (kg)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-[#159B70]" /> Nilai (Rp)
              </span>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#009CAC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#009CAC" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#159B70" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#159B70" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" hide />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'Volume Sampah (kg)') return [`${value} kg`, name];
                    if (name === 'Nilai Setoran (Rp)') return [formatIDR(value), name];
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#0C2D57',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="beratKg"
                  name="Volume Sampah (kg)"
                  stroke="#009CAC"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorKg)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="nilaiRp"
                  name="Nilai Setoran (Rp)"
                  stroke="#159B70"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorRp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Composition Donut Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Komposisi Stok Gudang (kg)
            </h2>
            <p className="text-[11px] text-slate-400">Proporsi material daur ulang yang tersimpan</p>
          </div>

          <div className="relative mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} kg`, 'Stok']}
                  contentStyle={{
                    backgroundColor: '#0C2D57',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Stok</span>
              <span className="text-base font-black text-slate-800 font-mono">
                {Math.round(totalAvailableStockKg)} kg
              </span>
            </div>
          </div>

          {/* Mini Legend */}
          <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto text-[11px]">
            {compositionData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600">{item.name}:</span>
                <span className="font-semibold text-slate-900 font-mono">{item.value} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Aktivitas Setoran Terbaru
            </h2>
            <p className="text-[11px] text-slate-400">Pencatatan transaksi timbangan dan kredit tabungan nasabah</p>
          </div>
          <button
            onClick={() => setActiveTab('setoran')}
            className="text-xs font-bold text-[#009CAC] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat Semua Transaksi</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">Kode & Waktu</th>
                <th className="pb-3">Nasabah</th>
                <th className="pb-3">Rincian Sampah</th>
                <th className="pb-3 text-right">Total Berat</th>
                <th className="pb-3 text-right">Nilai Rupiah</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3">Operator</th>
                <th className="pb-3 text-center">IoT Status</th>
                <th className="pb-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deposits.slice(0, 6).map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="py-3 pl-2">
                    <p className="font-mono font-bold text-slate-900">{tx.transactionCode}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatDateTimeID(tx.timestamp)}</p>
                  </td>
                  <td className="py-3">
                    <p className="font-bold text-slate-800">{tx.memberName}</p>
                    <p className="text-[10px] font-mono text-[#009CAC]">{tx.memberCode}</p>
                  </td>
                  <td className="py-3 max-w-[200px]">
                    <p className="truncate text-slate-700 text-[11px]">
                      {tx.items.map((i) => `${i.categoryName} (${i.weightKg} kg)`).join(', ')}
                    </p>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-800">
                    {formatWeight(tx.totalWeightKg)}
                  </td>
                  <td className="py-3 text-right font-mono font-black text-emerald-700">
                    {formatIDR(tx.totalValue)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tx.paymentMethod === 'tabungan'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {tx.paymentMethod === 'tabungan' ? 'Tabungan' : 'Tunai'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 text-[11px]">{tx.operatorName}</td>
                  <td className="py-3 text-center">
                    {tx.isIotVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        IoT Valid
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => setSelectedReceipt(tx)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-teal-50 hover:text-[#009CAC] transition"
                      title="Lihat Struk Setoran"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Struk Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#009CAC]" />
                <h3 className="font-bold text-slate-800">Bukti Setoran Sampah Digital</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-700 space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-black text-sm text-slate-900 tracking-wider">PILAH.IN WASTE BANK</p>
                <p className="text-[10px] text-slate-500">Unit Sukamaju • Jakarta Selatan</p>
                <p className="text-[10px] text-slate-400">{selectedReceipt.transactionCode}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{formatDateTimeID(selectedReceipt.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nasabah:</span>
                  <span className="font-bold">{selectedReceipt.memberName} ({selectedReceipt.memberCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas:</span>
                  <span>{selectedReceipt.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timbangan:</span>
                  <span>{selectedReceipt.weighingStationId || 'ESP32-SCALE-01'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
                {selectedReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-semibold">{item.categoryName}</p>
                      <p className="text-[10px] text-slate-400">{item.weightKg} kg × {formatIDR(item.pricePerKgSnapshot)}</p>
                    </div>
                    <span className="font-bold">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 text-xs">
                  <span>TOTAL BERAT:</span>
                  <span>{formatWeight(selectedReceipt.totalWeightKg)}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-700 text-sm">
                  <span>TOTAL DITERIMA:</span>
                  <span>{formatIDR(selectedReceipt.totalValue)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Penyaluran:</span>
                  <span className="uppercase font-semibold">
                    {selectedReceipt.paymentMethod === 'tabungan' ? 'Dikreditkan ke Tabungan' : 'Dibayar Tunai'}
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-2">
                "Sampah Bernilai, Masa Depan Berkelanjutan."
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0C2D57] py-2.5 text-xs font-bold text-white hover:bg-[#071f3e] transition"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Bukti</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
