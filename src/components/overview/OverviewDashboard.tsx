import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  ArrowRight,
  ChevronRight,
  FileText,
  Printer,
  X,
  BarChart3,
  Activity,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Wallet,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateTimeID, formatTimeOnlyID } from '../../utils/formatters';
import { DepositTransaction } from '../../types';
import {
  DailyWasteTrendPoint,
  buildWasteTrendsReport,
} from '../../utils/wasteTrends';
import {
  HeroEcoVault3D,
  InteractiveScale3D,
  IsometricEcosystemStage3D,
} from '../visuals/Isometric3DScene';

interface WeeklyProductivityPoint {
  weekLabel: string;
  periodRange: string;
  plastikKg: number;
  kertasKg: number;
  logamKacaKg: number;
  totalKg: number;
  targetKg: number;
  nilaiRp: number;
  transaksiCount: number;
  isCurrentWeek?: boolean;
}

const CustomDailyWasteTrendsTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: DailyWasteTrendPoint = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xs p-3.5 shadow-xl text-xs min-w-[245px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div>
          <p className="font-semibold text-slate-900">{data.fullDateLabel}</p>
          <p className="text-[11px] text-slate-400 tabular-nums">
            {data.transactionCount} setoran · {data.iotVerifiedCount} terverifikasi IoT
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#009CAC] tabular-nums">
          Margin {data.marginPct}%
        </span>
      </div>

      <div className="space-y-1.5 text-[11px] tabular-nums">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Total Volume Harian:</span>
          <span className="font-semibold text-slate-900">{data.totalWeightKg.toFixed(1)} kg</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 py-1 px-2 rounded-lg bg-slate-50 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-xs bg-[#009CAC]" />
              Plastik
            </span>
            <span className="font-medium text-slate-700">{data.plastikKg.toFixed(1)}kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-xs bg-[#159B70]" />
              Kertas
            </span>
            <span className="font-medium text-slate-700">{data.kertasKg.toFixed(1)}kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-xs bg-[#0C2D57]" />
              Logam/Kaca
            </span>
            <span className="font-medium text-slate-700">{data.logamKacaKg.toFixed(1)}kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-xs bg-[#D97706]" />
              Jelantah
            </span>
            <span className="font-medium text-slate-700">{data.lainnyaKg.toFixed(1)}kg</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-1.5 mt-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Estimasi Nilai Jual:</span>
            <span className="font-semibold text-slate-900">
              {formatIDR(data.estimatedRevenueRp)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">HPP Beli Nasabah:</span>
            <span className="font-medium text-slate-600">{formatIDR(data.depositCostRp)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Margin Kotor Unit:</span>
            <span className="font-semibold text-emerald-700">
              +{formatIDR(data.grossMarginRp)}
            </span>
          </div>
          {data.realizedSaleRevenueRp > 0 && (
            <div className="flex items-center justify-between pt-0.5 text-[#009CAC] font-medium">
              <span>Penjualan Pengepul:</span>
              <span>{formatIDR(data.realizedSaleRevenueRp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomWeeklyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: WeeklyProductivityPoint = payload[0]?.payload;
  if (!data) return null;

  const achievementPct = data.targetKg > 0 ? Math.round((data.totalKg / data.targetKg) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xs p-3.5 shadow-lg text-xs min-w-[210px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div>
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-[11px] text-slate-400">{data.periodRange}</p>
        </div>
        <span
          className={`text-[11px] font-medium ${
            achievementPct >= 100 ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {achievementPct}% Target
        </span>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Total Volume:</span>
          <span className="font-semibold text-slate-900">{data.totalKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-[#009CAC]" />
            Plastik:
          </span>
          <span className="text-slate-700">{data.plastikKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-[#159B70]" />
            Kertas & Kardus:
          </span>
          <span className="text-slate-700">{data.kertasKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-[#0C2D57]" />
            Logam & Kaca:
          </span>
          <span className="text-slate-700">{data.logamKacaKg.toFixed(1)} kg</span>
        </div>

        <div className="border-t border-slate-100 pt-1.5 mt-1.5 flex items-center justify-between">
          <span className="text-slate-500">Nilai Setoran:</span>
          <span className="font-semibold text-emerald-700">{formatIDR(data.nilaiRp)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Frekuensi:</span>
          <span>{data.transaksiCount} setoran</span>
        </div>
      </div>
    </div>
  );
};

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
    scaleState,
    scaleStabilityScore,
    pushWeightSample,
    tareScale,
    withdrawalRequests,
    setActiveTab,
    capacityWarningThresholdPct,
    capacityCriticalThresholdPct,
    currentCapacityPct,
    currentBranchId,
    currentBranch,
    apiStatus,
    apiLatencyMs,
    lastSyncedAt,
    wasteTrendsReport,
    fetchWasteTrendsFromApi,
  } = useApp();

  const [selectedReceipt, setSelectedReceipt] = useState<DepositTransaction | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'weekly' | 'daily'>('weekly');
  const [weeklyChartMode, setWeeklyChartMode] = useState<'stacked' | 'area'>('stacked');

  // 30-Day Waste Trends visualization controls
  const [trendWindowDays, setTrendWindowDays] = useState<30 | 14 | 7>(30);
  const [trendViewMode, setTrendViewMode] = useState<'combined' | 'financial' | 'composition'>(
    'combined'
  );
  const [isSyncingTrends, setIsSyncingTrends] = useState<boolean>(false);

  const activeTrendReport = useMemo(() => {
    if (trendWindowDays === 30) return wasteTrendsReport;
    return buildWasteTrendsReport({
      deposits,
      collectorSales,
      wasteCategories,
      days: trendWindowDays,
      branchId: currentBranchId,
    });
  }, [wasteTrendsReport, trendWindowDays, deposits, collectorSales, wasteCategories, currentBranchId]);

  const handleManualSyncTrends = async () => {
    setIsSyncingTrends(true);
    try {
      await fetchWasteTrendsFromApi(trendWindowDays, currentBranchId);
    } finally {
      setIsSyncingTrends(false);
    }
  };

  const totalWeightKgAllTime = deposits.reduce((acc, d) => acc + d.totalWeightKg, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDeposits = deposits.filter((d) => d.timestamp.startsWith(todayStr));
  const todayDepositValue = todayDeposits.reduce((acc, d) => acc + d.totalValue, 0);
  const todayWeightKg = todayDeposits.reduce((acc, d) => acc + d.totalWeightKg, 0);

  const totalMemberBalances = members.reduce((acc, m) => acc + m.walletBalance, 0);
  const activeMembersCount = members.filter((m) => m.status === 'active').length;
  const totalAvailableStockKg = inventoryStocks.reduce((acc, s) => acc + s.availableStockKg, 0);
  const totalRealizedMargin = collectorSales.reduce((acc, s) => acc + s.totalGrossMargin, 0);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending');

  const compositionData = wasteCategories
    .map((cat) => {
      const stock = inventoryStocks.find((s) => s.categoryId === cat.id);
      return {
        name: cat.name.split(' (')[0],
        value: stock ? stock.currentStockKg : 0,
        color: cat.color,
      };
    })
    .filter((item) => item.value > 0);

  // Real-time computation for Current Week from live `deposits` state
  const weeklyTrendData = useMemo<WeeklyProductivityPoint[]>(() => {
    let livePlastikKg = 0;
    let liveKertasKg = 0;
    let liveLogamKacaKg = 0;
    let liveNilaiRp = 0;

    deposits.forEach((tx) => {
      liveNilaiRp += tx.totalValue;
      tx.items.forEach((item) => {
        const cat = wasteCategories.find((c) => c.id === item.categoryId);
        const group = cat?.categoryGroup || 'Plastik';
        if (group === 'Plastik') {
          livePlastikKg += item.weightKg;
        } else if (group === 'Kertas') {
          liveKertasKg += item.weightKg;
        } else {
          liveLogamKacaKg += item.weightKg;
        }
      });
    });

    const currentWeekPlastik = Number((118.4 + livePlastikKg).toFixed(1));
    const currentWeekKertas = Number((142.0 + liveKertasKg).toFixed(1));
    const currentWeekLogam = Number((54.6 + liveLogamKacaKg).toFixed(1));
    const currentWeekTotal = Number(
      (currentWeekPlastik + currentWeekKertas + currentWeekLogam).toFixed(1)
    );

    return [
      {
        weekLabel: 'M1 Sep',
        periodRange: '1–7 Sep',
        plastikKg: 112.5,
        kertasKg: 138.0,
        logamKacaKg: 48.5,
        totalKg: 299.0,
        targetKg: 350,
        nilaiRp: 1185000,
        transaksiCount: 38,
      },
      {
        weekLabel: 'M2 Sep',
        periodRange: '8–14 Sep',
        plastikKg: 124.0,
        kertasKg: 149.5,
        logamKacaKg: 52.0,
        totalKg: 325.5,
        targetKg: 350,
        nilaiRp: 1290000,
        transaksiCount: 42,
      },
      {
        weekLabel: 'M3 Sep',
        periodRange: '15–21 Sep',
        plastikKg: 119.0,
        kertasKg: 162.0,
        logamKacaKg: 61.5,
        totalKg: 342.5,
        targetKg: 350,
        nilaiRp: 1380000,
        transaksiCount: 45,
      },
      {
        weekLabel: 'M4 Sep',
        periodRange: '22–28 Sep',
        plastikKg: 136.5,
        kertasKg: 171.0,
        logamKacaKg: 58.0,
        totalKg: 365.5,
        targetKg: 350,
        nilaiRp: 1495000,
        transaksiCount: 49,
      },
      {
        weekLabel: 'M1 Okt',
        periodRange: '29 Sep–5 Okt',
        plastikKg: 128.0,
        kertasKg: 158.5,
        logamKacaKg: 55.5,
        totalKg: 342.0,
        targetKg: 350,
        nilaiRp: 1365000,
        transaksiCount: 44,
      },
      {
        weekLabel: 'M2 Okt',
        periodRange: '6–12 Okt',
        plastikKg: 145.2,
        kertasKg: 184.0,
        logamKacaKg: 64.8,
        totalKg: 394.0,
        targetKg: 350,
        nilaiRp: 1610000,
        transaksiCount: 53,
      },
      {
        weekLabel: 'M3 Okt',
        periodRange: '13–19 Okt',
        plastikKg: 152.0,
        kertasKg: 189.5,
        logamKacaKg: 68.5,
        totalKg: 410.0,
        targetKg: 350,
        nilaiRp: 1685000,
        transaksiCount: 56,
      },
      {
        weekLabel: 'Minggu Ini',
        periodRange: '20–26 Okt (Live)',
        plastikKg: currentWeekPlastik,
        kertasKg: currentWeekKertas,
        logamKacaKg: currentWeekLogam,
        totalKg: currentWeekTotal,
        targetKg: 350,
        nilaiRp: 1240000 + liveNilaiRp,
        transaksiCount: 46 + deposits.length,
        isCurrentWeek: true,
      },
    ];
  }, [deposits, wasteCategories]);

  const currentWeekStats = weeklyTrendData[weeklyTrendData.length - 1];
  const prevWeekStats = weeklyTrendData[weeklyTrendData.length - 2];
  const weeklyGrowthPct =
    prevWeekStats && prevWeekStats.totalKg > 0
      ? (((currentWeekStats.totalKg - prevWeekStats.totalKg) / prevWeekStats.totalKg) * 100).toFixed(1)
      : '0.0';
  const avgWeeklyKg = (
    weeklyTrendData.reduce((acc, w) => acc + w.totalKg, 0) / weeklyTrendData.length
  ).toFixed(1);

  const dailyTrendData = [
    { date: '19 Okt', beratKg: 45.2, nilaiRp: 180000 },
    { date: '20 Okt', beratKg: 62.0, nilaiRp: 245000 },
    { date: '21 Okt', beratKg: 38.5, nilaiRp: 154000 },
    { date: '22 Okt', beratKg: 85.0, nilaiRp: 340000 },
    { date: '23 Okt', beratKg: 54.3, nilaiRp: 215000 },
    { date: '24 Okt', beratKg: 92.4, nilaiRp: 395000 },
    { date: 'Hari Ini', beratKg: Number((todayWeightKg || 64.7).toFixed(1)), nilaiRp: todayDepositValue || 268000 },
  ];

  // Unboxed Floffice-style Editorial Metrics
  const editorialMetrics = [
    {
      number: formatWeight(totalWeightKgAllTime),
      label: 'TOTAL SAMPAH TERKUMPUL',
      desc: `Akumulasi material terverifikasi sensor IoT (+${formatWeight(todayWeightKg)} hari ini).`,
      actionTab: 'setoran' as const,
    },
    {
      number: formatIDR(todayDepositValue),
      label: 'NILAI SETORAN HARI INI',
      desc: `Tercatat dari ${todayDeposits.length} transaksi warga yang langsung masuk buku besar.`,
      actionTab: 'setoran' as const,
    },
    {
      number: formatIDR(totalMemberBalances),
      label: 'SALDO TABUNGAN WARGA',
      desc: `${activeMembersCount} nasabah aktif · ${pendingWithdrawals.length} pengajuan pencairan menunggu.`,
      actionTab: 'tabungan' as const,
    },
    {
      number: formatWeight(totalAvailableStockKg),
      label: 'STOK GUDANG SIAP JUAL',
      desc: 'Material terpilah siap diangkut mitra pengepul CV Daur Mulya.',
      actionTab: 'inventaris' as const,
    },
  ];

  return (
    <div className="space-y-12 pb-10">
      {/* SECTION 1: Floffice Asymmetric Architectural Hero + @ssychui Two-Tone Headline */}
      <section className="pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
          {/* Bottom-left monumental two-tone headline */}
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-[0.14em] uppercase text-slate-500">
              <span className="h-2 w-2 bg-[#0C2D57] inline-block" />
              <span>UNIT SUKAMAJU · EKOSISTEM BANK SAMPAH PINTAR</span>
              <span>·</span>
              <span className="font-semibold text-[#009CAC]">DALAM NAUNGAN HAFI DIGITAL</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight leading-[1.08] text-slate-950">
              Solusi bank sampah pintar{' '}
              <span className="text-slate-400">
                dirancang untuk operasional modern.
              </span>
            </h1>
          </div>

          {/* Top-right quiet editorial narrative (Floffice signature) */}
          <div className="lg:max-w-xs lg:text-right space-y-4">
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Dari penimbangan otomatis ESP32 hingga pencairan tabungan warga, kelola seluruh rantai nilai daur ulang dalam satu meja kerja.
            </p>
            <div className="flex lg:justify-end items-center gap-2.5">
              <button
                onClick={() => setActiveTab('setoran')}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-medium text-white transition cursor-pointer"
              >
                <span>Catat Setoran Baru</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('laporan')}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                <span>Ekspor PDF / Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: 21st.dev @ssychui Dark Interactive Hardware & Telemetry Stage */}
        <div className="mt-6 rounded-3xl bg-[#0B0E14] p-5 sm:p-8 text-white shadow-xl border border-slate-900">
          {/* Top micro-header inside dark stage */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium tracking-wide text-slate-300">
                STASIUN AKTIF: {activeDevice.deviceCode} · {activeDevice.name}
              </span>
            </div>

            {/* Interactive Quick Weight & Threshold Triggers right inside the stage */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Uji Beban Sensor:</span>
              {[
                { label: '0 kg', val: 0 },
                { label: '12,5 kg', val: 12.5 },
                { label: '48,0 kg', val: 48.0 },
                {
                  label: `Peringatan ${capacityWarningThresholdPct}% (${Math.round(activeDevice.maxCapacityKg * (capacityWarningThresholdPct / 100))}kg)`,
                  val: Number((activeDevice.maxCapacityKg * (capacityWarningThresholdPct / 100)).toFixed(1)),
                  tone: 'warn',
                },
                {
                  label: `Kritis ${capacityCriticalThresholdPct}% (${Math.round(activeDevice.maxCapacityKg * (capacityCriticalThresholdPct / 100))}kg)`,
                  val: Number((activeDevice.maxCapacityKg * (capacityCriticalThresholdPct / 100)).toFixed(1)),
                  tone: 'crit',
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => pushWeightSample(preset.val, true)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer border ${
                    simulatedWeightKg === preset.val
                      ? preset.tone === 'crit'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : preset.tone === 'warn'
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'bg-[#009CAC] border-teal-400 text-white'
                      : preset.tone === 'crit'
                      ? 'bg-rose-950/50 border-rose-500/30 text-rose-300 hover:bg-rose-900/60'
                      : preset.tone === 'warn'
                      ? 'bg-amber-950/50 border-amber-500/30 text-amber-300 hover:bg-amber-900/60'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center Interactive Terminal Box + 3D Isometric Ecosystem Stage */}
          <div className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: @ssychui Terminal Box */}
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#111622] p-5 shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white">
                    Telemetry Stream
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Akurasi ±{activeDevice.precisionGram}g · Stabilitas {scaleStabilityScore}%
                  </span>
                </div>
                <button
                  onClick={tareScale}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>tare</span>
                </button>
              </div>

              <div className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                    Pembacaan Beban Real-Time
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className={`text-4xl sm:text-6xl font-semibold tracking-tight tabular-nums ${
                        currentCapacityPct >= capacityCriticalThresholdPct
                          ? 'text-rose-400'
                          : currentCapacityPct >= capacityWarningThresholdPct
                          ? 'text-amber-300'
                          : 'text-white'
                      }`}
                    >
                      {simulatedWeightKg.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xl font-medium text-[#009CAC]">kg</span>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="text-[11px] text-slate-400 block">
                    Utilisasi Kapasitas ({activeDevice.maxCapacityKg} kg)
                  </span>
                  <span
                    className={`text-lg font-semibold tabular-nums ${
                      currentCapacityPct >= capacityCriticalThresholdPct
                        ? 'text-rose-400'
                        : currentCapacityPct >= capacityWarningThresholdPct
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {currentCapacityPct}% ·{' '}
                    {currentCapacityPct >= capacityCriticalThresholdPct
                      ? 'KRITIS'
                      : currentCapacityPct >= capacityWarningThresholdPct
                      ? 'PERINGATAN'
                      : isScaleStable
                      ? 'STABIL'
                      : 'MENGUKUR'}
                  </span>
                </div>
              </div>

              {/* Capacity Threshold Bar + 4-Quad Load Cell Telemetry Grid inside dark terminal */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px]">
                  <div>
                    <span className="block text-[10px] text-slate-400">Sensor ADC</span>
                    <span className="font-mono font-semibold text-slate-200 tabular-nums">HX711 · 80Hz</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Keseimbangan</span>
                    <span className="font-mono font-semibold text-teal-300 tabular-nums">4-Titik Rata</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Sinkronisasi</span>
                    <span className="font-mono font-semibold text-emerald-400 tabular-nums">Hafi Cloud</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        currentCapacityPct >= capacityCriticalThresholdPct
                          ? 'bg-rose-500'
                          : currentCapacityPct >= capacityWarningThresholdPct
                          ? 'bg-amber-400'
                          : 'bg-[#009CAC]'
                      }`}
                      style={{ width: `${Math.min(100, currentCapacityPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 tabular-nums">
                    <span># ambang peringatan ≥{capacityWarningThresholdPct}% · kritis ≥{capacityCriticalThresholdPct}%</span>
                    <span>heartbeat {formatTimeOnlyID(activeDevice.lastHeartbeat)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive 3D Isometric Command & Sorting Ecosystem Hub */}
            <div className="lg:col-span-7">
              <IsometricEcosystemStage3D
                weightKg={simulatedWeightKg}
                maxCapacityKg={activeDevice.maxCapacityKg}
                warningThresholdPct={capacityWarningThresholdPct}
                criticalThresholdPct={capacityCriticalThresholdPct}
                scaleState={scaleState}
                isStable={isScaleStable}
                plastikStockKg={currentWeekStats.plastikKg}
                kertasStockKg={currentWeekStats.kertasKg}
                logamStockKg={currentWeekStats.logamKacaKg}
                activeMembersCount={activeMembersCount}
                todayDepositsCount={todayDeposits.length}
                totalWalletBalance={totalMemberBalances}
                onSelectModule={(tab) => setActiveTab(tab)}
              />
            </div>
          </div>

          {/* Bottom Two-Tone Caption (21st.dev @ssychui signature) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-lg sm:text-xl font-medium tracking-tight">
              <span className="text-white">Presisi sensor real-time</span>{' '}
              <span className="text-slate-500">terhubung langsung ke buku besar.</span>
            </p>
            <button
              onClick={() => setActiveTab('timbangan')}
              className="inline-flex items-center gap-2 rounded-full bg-white text-slate-950 hover:bg-slate-100 px-4 py-2 text-xs font-semibold transition cursor-pointer"
            >
              <Cpu className="h-3.5 w-3.5 text-[#009CAC]" />
              <span>Buka Terminal Penimbangan Penuh</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Floffice Unboxed Typographic Metrics + Weekly Productivity Chart */}
      <section className="pt-2">
        <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] uppercase text-slate-500 mb-6">
          <span className="h-2.5 w-2.5 bg-slate-900 inline-block" />
          <span>INDIKATOR EKSEKUTIF & PRODUKTIVITAS MINGGUAN</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left (5 cols): Floffice Unboxed Typographic Numbers Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 pt-2">
            {editorialMetrics.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.04 }}
                onClick={() => setActiveTab(m.actionTab)}
                className="group cursor-pointer border-t border-slate-200 pt-4"
              >
                <div className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-950 group-hover:text-[#009CAC] transition-colors">
                  {m.number}
                </div>
                <div className="mt-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-800">
                  {m.label}
                </div>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  {m.desc}
                </p>
              </motion.div>
            ))}

            {/* Secondary Two-Column Summary Strip */}
            <div className="sm:col-span-2 border-t border-slate-200 pt-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                  Laba Kotor Pengepul
                </span>
                <span className="text-base font-semibold text-emerald-700">
                  {formatIDR(totalRealizedMargin)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                  Pertumbuhan Mingguan
                </span>
                <span className="text-base font-semibold text-slate-900">
                  {Number(weeklyGrowthPct) >= 0 ? `+${weeklyGrowthPct}%` : `${weeklyGrowthPct}%`} vs M3 Okt
                </span>
              </div>
              <button
                onClick={() => setActiveTab('keuangan')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#009CAC] hover:underline cursor-pointer"
              >
                <span>Neraca</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right (7 cols): Editorial Headline + Recharts Weekly Waste Volume Visualization */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-950 leading-snug">
                  Tren volume sampah per minggu{' '}
                  <span className="text-slate-400">secara real-time.</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Minggu berjalan:{' '}
                  <span className="font-semibold text-slate-900">{currentWeekStats.totalKg} kg</span>
                  {' · '}Rata-rata 8 pekan:{' '}
                  <span className="font-medium text-slate-700">{avgWeeklyKg} kg/minggu</span>
                  {' · '}Target: <span className="font-medium text-amber-600">350 kg</span>
                </p>
              </div>

              {/* Clean Segmented Switchers */}
              <div className="flex flex-wrap items-center gap-1.5">
                {chartTimeframe === 'weekly' && (
                  <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      onClick={() => setWeeklyChartMode('stacked')}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        weeklyChartMode === 'stacked'
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="h-3 w-3" />
                      <span>Kategori</span>
                    </button>
                    <button
                      onClick={() => setWeeklyChartMode('area')}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        weeklyChartMode === 'area'
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Activity className="h-3 w-3" />
                      <span>Total Volume</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    onClick={() => setChartTimeframe('weekly')}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      chartTimeframe === 'weekly'
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Per Minggu
                  </button>
                  <button
                    onClick={() => setChartTimeframe('daily')}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      chartTimeframe === 'daily'
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Hari
                  </button>
                </div>
              </div>
            </div>

            {/* Framed Architectural Chart Surface */}
            <div className="rounded-2xl border border-slate-200/90 bg-[#FAFAFA] p-5">
              {chartTimeframe === 'weekly' && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-4">
                    {weeklyChartMode === 'stacked' ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-xs bg-[#009CAC]" />
                          Plastik
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-xs bg-[#159B70]" />
                          Kertas & Kardus
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-xs bg-[#0C2D57]" />
                          Logam & Kaca
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-xs bg-[#009CAC]" />
                        Total Volume Mingguan (kg)
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="h-0.5 w-3 border-t border-dashed border-amber-500" />
                    Target Produktivitas: 350 kg/minggu
                  </span>
                </div>
              )}

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartTimeframe === 'weekly' ? (
                    weeklyChartMode === 'stacked' ? (
                      <ComposedChart
                        data={weeklyTrendData}
                        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="weekLabel"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          axisLine={false}
                          tickLine={false}
                          unit=" kg"
                        />
                        <Tooltip content={<CustomWeeklyTooltip />} />
                        <ReferenceLine
                          y={350}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />
                        <Bar
                          dataKey="plastikKg"
                          name="Plastik"
                          stackId="weeklyVolume"
                          fill="#009CAC"
                          barSize={28}
                        />
                        <Bar
                          dataKey="kertasKg"
                          name="Kertas & Kardus"
                          stackId="weeklyVolume"
                          fill="#159B70"
                          barSize={28}
                        />
                        <Bar
                          dataKey="logamKacaKg"
                          name="Logam & Kaca"
                          stackId="weeklyVolume"
                          fill="#0C2D57"
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalKg"
                          name="Total Volume"
                          stroke="#0F172A"
                          strokeWidth={1.75}
                          dot={{ r: 3, fill: '#0F172A', strokeWidth: 1.5, stroke: '#fff' }}
                          activeDot={{ r: 5 }}
                        />
                      </ComposedChart>
                    ) : (
                      <AreaChart
                        data={weeklyTrendData}
                        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="weeklyVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#009CAC" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#009CAC" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="weekLabel"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          axisLine={false}
                          tickLine={false}
                          unit=" kg"
                        />
                        <Tooltip content={<CustomWeeklyTooltip />} />
                        <ReferenceLine
                          y={350}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalKg"
                          name="Total Volume (kg)"
                          stroke="#009CAC"
                          strokeWidth={2.25}
                          fillOpacity={1}
                          fill="url(#weeklyVolumeGrad)"
                          dot={{ r: 3.5, fill: '#009CAC', strokeWidth: 1.5, stroke: '#fff' }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    )
                  ) : (
                    <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorKgDaily" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#009CAC" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#009CAC" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === 'Volume (kg)') return [`${value} kg`, name];
                          if (name === 'Nilai (Rp)') return [formatIDR(value), name];
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: '#0C2D57',
                          borderRadius: '8px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="beratKg"
                        name="Volume (kg)"
                        stroke="#009CAC"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorKgDaily)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="nilaiRp"
                        name="Nilai (Rp)"
                        stroke="#159B70"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3B: WASTE TRENDS — 30-DAY DAILY WASTE COLLECTION VOLUME & FINANCIAL PERFORMANCE */}
      <section
        aria-label="Tren Volume Sampah dan Performa Finansial 30 Hari Terakhir"
        className="border-t border-slate-200/80 pt-10 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-slate-500">
              <span className="h-2.5 w-2.5 bg-[#009CAC] inline-block" />
              <span>WASTE TRENDS · ANALITIK 30 HARI TERAKHIR</span>
              <span>·</span>
              <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                GET /api/analytics/trends ({apiStatus === 'online' ? `${apiLatencyMs}ms` : apiStatus})
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-950">
              Tren koleksi sampah harian &{' '}
              <span className="text-slate-400">performa finansial unit.</span>
            </h2>
            <p className="text-xs text-slate-500">
              Sinkronisasi otomatis dengan buku besar setoran nasabah, harga katalog material, dan penjualan pengepul pada{' '}
              <span className="font-medium text-slate-700">{currentBranch.name}</span>.
            </p>
          </div>

          {/* Interactive Mode & Window Switchers + Backend Sync Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <div
              role="group"
              aria-label="Mode Grafik Tren Sampah"
              className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5"
            >
              <button
                type="button"
                onClick={() => setTrendViewMode('combined')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  trendViewMode === 'combined'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                <span>Volume & Finansial</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('financial')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  trendViewMode === 'financial'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wallet className="h-3 w-3" />
                <span>Performa Finansial (Rp)</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('composition')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  trendViewMode === 'composition'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Komposisi Harian (kg)</span>
              </button>
            </div>

            {/* Window Range Switcher (30D / 14D / 7D) */}
            <div
              role="group"
              aria-label="Rentang Hari Tren Sampah"
              className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5"
            >
              {([30, 14, 7] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTrendWindowDays(d)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer tabular-nums ${
                    trendWindowDays === d
                      ? 'bg-[#009CAC] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d} Hari
                </button>
              ))}
            </div>

            {/* Backend Sync Button */}
            <button
              type="button"
              onClick={handleManualSyncTrends}
              disabled={isSyncingTrends}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Sinkronkan tren dari endpoint /api/analytics/trends"
            >
              <RefreshCw className={`h-3 w-3 text-[#009CAC] ${isSyncingTrends ? 'animate-spin' : ''}`} />
              <span>{isSyncingTrends ? 'Menyinkronkan...' : 'Sinkron API'}</span>
            </button>
          </div>
        </div>

        {/* 30-Day Summary KPI Strip (Tabular Nums) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              VOLUME KOLEKSI ({activeTrendReport.days} HARI)
            </span>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xl xl:text-2xl font-semibold text-slate-950 tabular-nums whitespace-nowrap">
                {formatWeight(activeTrendReport.summary.totalWeightKg)}
              </span>
              <span
                className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                  activeTrendReport.summary.volumeGrowthPct >= 0
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {activeTrendReport.summary.volumeGrowthPct >= 0 ? '+' : ''}
                {activeTrendReport.summary.volumeGrowthPct}% tren
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
              Rata-rata harian: <span className="font-semibold text-slate-700">{activeTrendReport.summary.avgDailyWeightKg} kg/hari</span> · {activeTrendReport.summary.totalTransactions} setoran
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              ESTIMASI NILAI JUAL PENGEPUL
            </span>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xl xl:text-2xl font-semibold text-[#0C2D57] tabular-nums whitespace-nowrap">
                {formatIDR(activeTrendReport.summary.totalEstimatedRevenueRp)}
              </span>
              <span className="text-xs font-semibold text-emerald-600 tabular-nums whitespace-nowrap">
                +{activeTrendReport.summary.financialGrowthPct}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
              Valuasi pasar material terkumpul ({activeTrendReport.summary.startDateIso.slice(5)} s/d {activeTrendReport.summary.endDateIso.slice(5)})
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              HPP PEMBELIAN NASABAH
            </span>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xl xl:text-2xl font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                {formatIDR(activeTrendReport.summary.totalDepositCostRp)}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                Tabungan & Tunai
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
               Nilai ekonomi langsung yang dikreditkan ke warga
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              MARGIN KOTOR UNIT ({activeTrendReport.summary.avgMarginPct}%)
            </span>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xl xl:text-2xl font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                +{formatIDR(activeTrendReport.summary.totalGrossMarginRp)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
              Puncak harian: <span className="font-semibold text-slate-700">{activeTrendReport.summary.peakDay.dateLabel}</span> ({activeTrendReport.summary.peakDay.weightKg} kg)
            </p>
          </div>
        </div>

        {/* Main 30-Day Recharts Visualization Surface */}
        <div className="rounded-2xl border border-slate-200/90 bg-[#FAFAFA] p-5 space-y-4">
          {/* Legend & Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              {trendViewMode === 'combined' && (
                <>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#009CAC]" />
                    Volume Sampah Harian (kg · Sumbu Kiri)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-0.5 w-3.5 bg-[#0C2D57]" />
                    Estimasi Nilai Jual Pengepul (Rp · Sumbu Kanan)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-0.5 w-3.5 bg-[#159B70]" />
                    HPP Pembelian Nasabah (Rp · Sumbu Kanan)
                  </span>
                </>
              )}
              {trendViewMode === 'financial' && (
                <>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#0C2D57]" />
                    Estimasi Nilai Jual Pengepul (Rp)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#009CAC]" />
                    HPP Pembelian Nasabah (Rp)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#159B70]" />
                    Margin Kotor Operasional (Rp)
                  </span>
                </>
              )}
              {trendViewMode === 'composition' && (
                <>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#009CAC]" />
                    Plastik ({activeTrendReport.summary.categoryBreakdown.plastikKg} kg)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#159B70]" />
                    Kertas & Kardus ({activeTrendReport.summary.categoryBreakdown.kertasKg} kg)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#0C2D57]" />
                    Logam & Kaca ({activeTrendReport.summary.categoryBreakdown.logamKacaKg} kg)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#D97706]" />
                    Minyak & Lainnya ({activeTrendReport.summary.categoryBreakdown.lainnyaKg} kg)
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 tabular-nums">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 border-t border-dashed border-amber-500" />
                Target Harian: 55 kg/hari
              </span>
              {lastSyncedAt && (
                <span className="text-slate-400">
                  Update Server: {formatTimeOnlyID(lastSyncedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Recharts Canvas (explicit height 320px to guarantee zero layout jitter) */}
          <div className="h-80 w-full" data-testid="waste-trends-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              {trendViewMode === 'combined' ? (
                <ComposedChart
                  data={activeTrendReport.series}
                  margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    interval={trendWindowDays === 30 ? 2 : 0}
                  />
                  <YAxis
                    yAxisId="weight"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    unit=" kg"
                  />
                  <YAxis
                    yAxisId="finance"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: number) => `Rp${Math.round(val / 1000)}rb`}
                  />
                  <Tooltip content={<CustomDailyWasteTrendsTooltip />} />
                  <ReferenceLine
                    yAxisId="weight"
                    y={55}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    strokeWidth={1.25}
                  />
                  <Bar
                    isAnimationActive={false}
                    yAxisId="weight"
                    dataKey="totalWeightKg"
                    name="Volume Harian (kg)"
                    fill="#009CAC"
                    fillOpacity={0.82}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Line
                    isAnimationActive={false}
                    yAxisId="finance"
                    type="monotone"
                    dataKey="estimatedRevenueRp"
                    name="Estimasi Nilai Jual (Rp)"
                    stroke="#0C2D57"
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 4.5, fill: '#0C2D57', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                  <Line
                    isAnimationActive={false}
                    yAxisId="finance"
                    type="monotone"
                    dataKey="depositCostRp"
                    name="HPP Beli Nasabah (Rp)"
                    stroke="#159B70"
                    strokeWidth={1.8}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={{ r: 4, fill: '#159B70', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                </ComposedChart>
              ) : trendViewMode === 'financial' ? (
                <AreaChart
                  data={activeTrendReport.series}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    interval={trendWindowDays === 30 ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: number) => `Rp${Math.round(val / 1000)}rb`}
                  />
                  <Tooltip content={<CustomDailyWasteTrendsTooltip />} />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="estimatedRevenueRp"
                    name="Estimasi Nilai Jual (Rp)"
                    stroke="#0C2D57"
                    strokeWidth={2.2}
                    fill="#0C2D57"
                    fillOpacity={0.12}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="depositCostRp"
                    name="HPP Pembelian Nasabah (Rp)"
                    stroke="#009CAC"
                    strokeWidth={2}
                    fill="#009CAC"
                    fillOpacity={0.16}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="grossMarginRp"
                    name="Margin Kotor Unit (Rp)"
                    stroke="#159B70"
                    strokeWidth={2}
                    fill="#159B70"
                    fillOpacity={0.22}
                  />
                </AreaChart>
              ) : (
                <ComposedChart
                  data={activeTrendReport.series}
                  margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    interval={trendWindowDays === 30 ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    unit=" kg"
                  />
                  <Tooltip content={<CustomDailyWasteTrendsTooltip />} />
                  <ReferenceLine
                    y={55}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="plastikKg"
                    name="Plastik"
                    stackId="dailyComp"
                    fill="#009CAC"
                    maxBarSize={22}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="kertasKg"
                    name="Kertas & Kardus"
                    stackId="dailyComp"
                    fill="#159B70"
                    maxBarSize={22}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="logamKacaKg"
                    name="Logam & Kaca"
                    stackId="dailyComp"
                    fill="#0C2D57"
                    maxBarSize={22}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="lainnyaKg"
                    name="Minyak & Lainnya"
                    stackId="dailyComp"
                    fill="#D97706"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Bottom Interactive Action & Sync Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-600 tabular-nums">
              <span>
                Hari Ini (<span className="font-semibold text-slate-900">Live</span>):{' '}
                <strong className="text-slate-950">
                  {activeTrendReport.series[activeTrendReport.series.length - 1]?.totalWeightKg.toFixed(1)} kg
                </strong>
              </span>
              <span>·</span>
              <span>
                Nilai Jual:{' '}
                <strong className="text-[#0C2D57]">
                  {formatIDR(activeTrendReport.series[activeTrendReport.series.length - 1]?.estimatedRevenueRp || 0)}
                </strong>
              </span>
              <span>·</span>
              <span>
                Margin Hari Ini:{' '}
                <strong className="text-emerald-700">
                  +{formatIDR(activeTrendReport.series[activeTrendReport.series.length - 1]?.grossMarginRp || 0)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('pengaturan')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
              >
                <span>Inspeksi Endpoint API</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('keuangan')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#009CAC] hover:underline cursor-pointer"
              >
                <span>Detail Laporan Keuangan</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Asymmetric Editorial Split — Warehouse Composition & Recent Ledger */}
      <section className="border-t border-slate-200/80 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left (4 cols): Komposisi Gudang */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-slate-500">
                <span className="h-2 w-2 bg-[#009CAC] inline-block" />
                <span>INVENTARIS GUDANG</span>
              </div>
              <h3 className="mt-1 text-xl font-normal tracking-tight text-slate-950">
                Komposisi material{' '}
                <span className="text-slate-400">({Math.round(totalAvailableStockKg)} kg)</span>
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('penjualan')}
              className="text-xs font-medium text-[#009CAC] hover:underline cursor-pointer"
            >
              Jual Stok →
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-[#FAFAFA] p-5">
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={66}
                    paddingAngle={3}
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
            </div>

            <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3">
              {compositionData.slice(0, 5).map((item) => {
                const sharePct =
                  totalAvailableStockKg > 0
                    ? Math.round((item.value / totalAvailableStockKg) * 100)
                    : 0;
                return (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium truncate">{item.name}</span>
                      <span className="text-slate-900 font-semibold">
                        {item.value} kg <span className="text-slate-400 font-normal">({sharePct}%)</span>
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${sharePct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right (8 cols): Clean Editorial Ledger Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-slate-500">
                <span className="h-2 w-2 bg-emerald-600 inline-block" />
                <span>BUKU BESAR TRANSAKSI</span>
              </div>
              <h3 className="mt-1 text-xl font-normal tracking-tight text-slate-950">
                Setoran warga terbaru{' '}
                <span className="text-slate-400">terverifikasi sistem.</span>
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('setoran')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <span>Lihat Semua ({deposits.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-1">Kode & Waktu</th>
                  <th className="py-3">Nasabah</th>
                  <th className="py-3">Material</th>
                  <th className="py-3 text-right">Berat</th>
                  <th className="py-3 text-right">Nilai</th>
                  <th className="py-3">Metode</th>
                  <th className="py-3 text-right pr-1">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3 pl-1">
                      <span className="font-semibold text-slate-900">{tx.transactionCode}</span>
                      <span className="block text-[10px] text-slate-400">{formatDateTimeID(tx.timestamp)}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-medium text-slate-900">{tx.memberName}</span>
                      <span className="block text-[10px] text-slate-400">{tx.memberCode}</span>
                    </td>
                    <td className="py-3 max-w-[210px] truncate text-slate-600">
                      {tx.items.map((i) => `${i.categoryName.split(' (')[0]} (${i.weightKg}kg)`).join(', ')}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      {formatWeight(tx.totalWeightKg)}
                    </td>
                    <td className="py-3 text-right font-semibold text-emerald-700">
                      {formatIDR(tx.totalValue)}
                    </td>
                    <td className="py-3 text-[11px] text-slate-500 whitespace-nowrap">
                      <span className="capitalize">{tx.paymentMethod}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{tx.isIotVerified ? 'IoT' : 'Manual'}</span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-950 transition cursor-pointer"
                        aria-label={`Struk ${tx.transactionCode}`}
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
      </section>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-semibold text-slate-900">Bukti Setoran Digital</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-700 space-y-2.5">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-semibold text-slate-900">PILAH.IN — UNIT SUKAMAJU</p>
                <p className="text-[10px] font-semibold text-[#009CAC] uppercase">
                  Dalam Naungan Hafi Digital
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {selectedReceipt.transactionCode} · {formatDateTimeID(selectedReceipt.timestamp)}
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nasabah:</span>
                  <span className="font-semibold">
                    {selectedReceipt.memberName} ({selectedReceipt.memberCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas:</span>
                  <span>{selectedReceipt.operatorName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                {selectedReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>
                      {item.categoryName.split(' (')[0]} ({item.weightKg} kg)
                    </span>
                    <span className="font-semibold">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-semibold text-emerald-700 text-sm">
                <span>TOTAL:</span>
                <span>{formatIDR(selectedReceipt.totalValue)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#0C2D57] py-2 text-xs font-semibold text-white hover:bg-[#071f3e]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
