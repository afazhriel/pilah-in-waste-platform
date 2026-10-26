import {
  DepositTransaction,
  CollectorSale,
  WasteCategory,
} from '../types';

export interface DailyWasteTrendPoint {
  dateIso: string;
  dateLabel: string;
  fullDateLabel: string;
  plastikKg: number;
  kertasKg: number;
  logamKacaKg: number;
  lainnyaKg: number;
  totalWeightKg: number;
  targetWeightKg: number;
  depositCostRp: number;
  estimatedRevenueRp: number;
  realizedSaleRevenueRp: number;
  grossMarginRp: number;
  marginPct: number;
  transactionCount: number;
  iotVerifiedCount: number;
  isToday: boolean;
}

export interface WasteTrendsSummary {
  windowDays: number;
  branchId: string;
  startDateIso: string;
  endDateIso: string;
  totalWeightKg: number;
  avgDailyWeightKg: number;
  peakDay: {
    dateIso: string;
    dateLabel: string;
    weightKg: number;
    estimatedRevenueRp: number;
  };
  totalDepositCostRp: number;
  totalEstimatedRevenueRp: number;
  totalRealizedSalesRp: number;
  totalGrossMarginRp: number;
  avgMarginPct: number;
  totalTransactions: number;
  volumeGrowthPct: number;
  financialGrowthPct: number;
  categoryBreakdown: {
    plastikKg: number;
    kertasKg: number;
    logamKacaKg: number;
    lainnyaKg: number;
  };
}

export interface WasteTrendsReport {
  generatedAt: string;
  patronage: string;
  branchId: string;
  days: number;
  summary: WasteTrendsSummary;
  series: DailyWasteTrendPoint[];
}

const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const MONTHS_FULL_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatShortDateID(dateIso: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTHS_SHORT_ID[monthIdx] || parts[1];
  return `${day} ${monthName}`;
}

export function formatFullDateID(dateIso: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTHS_FULL_ID[monthIdx] || parts[1];
  return `${day} ${monthName} ${year}`;
}

/**
 * Deterministic daily baseline generator for the 30-day operational window
 * so the 30-day trend chart reflects realistic daily community collection
 * while staying 100% additive with live transactions in `deposits` & `collectorSales`.
 */
function computeDailyBaseline(
  dateIso: string,
  dayIndex: number,
  totalDays: number,
  branchId: string,
  categories: WasteCategory[]
): {
  plastikKg: number;
  kertasKg: number;
  logamKacaKg: number;
  lainnyaKg: number;
  depositCostRp: number;
  estimatedRevenueRp: number;
  realizedSaleRevenueRp: number;
  transactionCount: number;
  iotVerifiedCount: number;
} {
  // Parse numeric seed from dateIso (YYYY-MM-DD)
  const dayOfMonth = parseInt(dateIso.slice(8, 10), 10) || 1;
  const monthNum = parseInt(dateIso.slice(5, 7), 10) || 10;
  const seed = dayOfMonth * 7 + monthNum * 13 + dayIndex * 3;

  // Branch scaling factor (Unit Sukamaju b-01 is main hub, b-02 is secondary unit)
  const branchFactor =
    branchId === 'b-02' ? 0.42 : branchId === 'b-01' ? 1.0 : 1.35;

  // Progressive upward trend across the 30-day window (1.00 -> 1.24)
  const progression = 1 + (dayIndex / Math.max(1, totalDays - 1)) * 0.24;

  // Weekend / collection day wave (higher on Saturdays/Sundays/Wednesdays)
  const wave = Math.sin(seed * 0.65) * 0.18 + Math.cos(dayIndex * 0.9) * 0.12;
  const multiplier = Math.max(0.58, (progression + wave) * branchFactor);

  const plastikKg = Number((16.5 * multiplier + (seed % 5) * 0.8).toFixed(1));
  const kertasKg = Number((21.0 * multiplier + ((seed + 2) % 6) * 0.9).toFixed(1));
  const logamKacaKg = Number((7.4 * multiplier + (seed % 4) * 0.5).toFixed(1));
  const lainnyaKg = Number((3.8 * multiplier + (seed % 3) * 0.4).toFixed(1));

  // Lookup category prices from active catalog so price updates reflect in valuation
  const petCat = categories.find((c) => c.id === 'cat-pet');
  const kardusCat = categories.find((c) => c.id === 'cat-kardus');
  const aluCat = categories.find((c) => c.id === 'cat-alu-can');
  const ironCat = categories.find((c) => c.id === 'cat-iron');
  const oilCat = categories.find((c) => c.id === 'cat-oil');

  const plastikBuy = petCat ? petCat.buyPricePerKg * 0.82 : 3700;
  const plastikSell = petCat ? petCat.sellPricePerKg * 0.84 : 5850;

  const kertasBuy = kardusCat ? kardusCat.buyPricePerKg : 2800;
  const kertasSell = kardusCat ? kardusCat.sellPricePerKg : 4200;

  const logamBuy =
    aluCat && ironCat ? (aluCat.buyPricePerKg * 0.35 + ironCat.buyPricePerKg * 0.65) : 8150;
  const logamSell =
    aluCat && ironCat ? (aluCat.sellPricePerKg * 0.35 + ironCat.sellPricePerKg * 0.65) : 12225;

  const lainnyaBuy = oilCat ? oilCat.buyPricePerKg : 6500;
  const lainnyaSell = oilCat ? oilCat.sellPricePerKg : 9500;

  const depositCostRp = Math.round(
    plastikKg * plastikBuy +
      kertasKg * kertasBuy +
      logamKacaKg * logamBuy +
      lainnyaKg * lainnyaBuy
  );

  const estimatedRevenueRp = Math.round(
    plastikKg * plastikSell +
      kertasKg * kertasSell +
      logamKacaKg * logamSell +
      lainnyaKg * lainnyaSell
  );

  // Periodic collector pickup dispatches every ~5 days
  const isPickupDay = dayIndex % 5 === 2;
  const realizedSaleRevenueRp = isPickupDay ? Math.round(estimatedRevenueRp * 2.8) : 0;

  const transactionCount = Math.max(3, Math.round((plastikKg + kertasKg) / 6.2));
  const iotVerifiedCount = Math.max(2, transactionCount - (seed % 2));

  return {
    plastikKg,
    kertasKg,
    logamKacaKg,
    lainnyaKg,
    depositCostRp,
    estimatedRevenueRp,
    realizedSaleRevenueRp,
    transactionCount,
    iotVerifiedCount,
  };
}

export interface BuildWasteTrendsOptions {
  deposits: DepositTransaction[];
  collectorSales?: CollectorSale[];
  wasteCategories: WasteCategory[];
  days?: number;
  branchId?: string;
  anchorDateIso?: string;
  includeBaseline?: boolean;
}

export function buildWasteTrendsReport(
  options: BuildWasteTrendsOptions
): WasteTrendsReport {
  const {
    deposits,
    collectorSales = [],
    wasteCategories,
    days = 30,
    branchId = 'b-01',
    includeBaseline = true,
  } = options;

  const clampedDays = Math.max(7, Math.min(90, Math.round(days)));

  // Determine anchor end date (YYYY-MM-DD)
  let anchorIso = options.anchorDateIso;
  if (!anchorIso) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const latestDepositIso = deposits.reduce((latest, d) => {
      const dIso = (d.timestamp || '').slice(0, 10);
      return dIso > latest ? dIso : latest;
    }, '');
    anchorIso = latestDepositIso > todayIso ? latestDepositIso : todayIso;
  }

  const anchorDate = new Date(`${anchorIso}T12:00:00Z`);
  const categoryMap = new Map<string, WasteCategory>();
  for (const cat of wasteCategories) {
    categoryMap.set(cat.id, cat);
  }

  // Filter transactions by branch if specific branch is selected
  const filteredDeposits = deposits.filter((tx) => {
    if (tx.status === 'cancelled') return false;
    if (branchId && branchId !== 'all' && tx.branchId && tx.branchId !== branchId) {
      return false;
    }
    return true;
  });

  const filteredSales = collectorSales.filter((sale) => {
    if (branchId && branchId !== 'all' && sale.branchId && sale.branchId !== branchId) {
      return false;
    }
    return true;
  });

  const series: DailyWasteTrendPoint[] = [];

  for (let i = 0; i < clampedDays; i++) {
    const offsetDays = clampedDays - 1 - i;
    const d = new Date(anchorDate.getTime() - offsetDays * 86400000);
    const dateIso = d.toISOString().slice(0, 10);
    const isToday = i === clampedDays - 1;

    const base = includeBaseline
      ? computeDailyBaseline(dateIso, i, clampedDays, branchId, wasteCategories)
      : {
          plastikKg: 0,
          kertasKg: 0,
          logamKacaKg: 0,
          lainnyaKg: 0,
          depositCostRp: 0,
          estimatedRevenueRp: 0,
          realizedSaleRevenueRp: 0,
          transactionCount: 0,
          iotVerifiedCount: 0,
        };

    let livePlastikKg = 0;
    let liveKertasKg = 0;
    let liveLogamKacaKg = 0;
    let liveLainnyaKg = 0;
    let liveDepositCostRp = 0;
    let liveEstimatedRevenueRp = 0;
    let liveTxCount = 0;
    let liveIotCount = 0;

    // Aggregate actual deposits on this date
    for (const tx of filteredDeposits) {
      const txDateIso = (tx.timestamp || '').slice(0, 10);
      if (txDateIso !== dateIso) continue;

      liveTxCount += 1;
      if (tx.isIotVerified) liveIotCount += 1;
      liveDepositCostRp += tx.totalValue;

      for (const item of tx.items) {
        const cat = categoryMap.get(item.categoryId);
        const group = cat?.categoryGroup || 'Plastik';
        const sellPrice = cat
          ? cat.sellPricePerKg
          : Math.round(item.pricePerKgSnapshot * 1.48);

        liveEstimatedRevenueRp += Math.round(item.weightKg * sellPrice);

        if (group === 'Plastik') {
          livePlastikKg += item.weightKg;
        } else if (group === 'Kertas') {
          liveKertasKg += item.weightKg;
        } else if (group === 'Logam' || group === 'Kaca') {
          liveLogamKacaKg += item.weightKg;
        } else {
          liveLainnyaKg += item.weightKg;
        }
      }
    }

    // Aggregate actual collector sales on this date
    let liveSaleRevenueRp = 0;
    for (const sale of filteredSales) {
      const saleDateIso = (sale.timestamp || '').slice(0, 10);
      if (saleDateIso === dateIso) {
        liveSaleRevenueRp += sale.totalSaleAmount;
      }
    }

    const plastikKg = Number((base.plastikKg + livePlastikKg).toFixed(2));
    const kertasKg = Number((base.kertasKg + liveKertasKg).toFixed(2));
    const logamKacaKg = Number((base.logamKacaKg + liveLogamKacaKg).toFixed(2));
    const lainnyaKg = Number((base.lainnyaKg + liveLainnyaKg).toFixed(2));
    const totalWeightKg = Number(
      (plastikKg + kertasKg + logamKacaKg + lainnyaKg).toFixed(2)
    );

    const depositCostRp = Math.round(base.depositCostRp + liveDepositCostRp);
    const estimatedRevenueRp = Math.round(
      base.estimatedRevenueRp + liveEstimatedRevenueRp
    );
    const realizedSaleRevenueRp = Math.round(
      base.realizedSaleRevenueRp + liveSaleRevenueRp
    );
    const grossMarginRp = Math.max(0, estimatedRevenueRp - depositCostRp);
    const marginPct =
      estimatedRevenueRp > 0
        ? Number(((grossMarginRp / estimatedRevenueRp) * 100).toFixed(1))
        : 0;

    const targetWeightKg = branchId === 'b-02' ? 25 : branchId === 'all' ? 75 : 55;

    series.push({
      dateIso,
      dateLabel: isToday ? 'Hari Ini' : formatShortDateID(dateIso),
      fullDateLabel: formatFullDateID(dateIso),
      plastikKg,
      kertasKg,
      logamKacaKg,
      lainnyaKg,
      totalWeightKg,
      targetWeightKg,
      depositCostRp,
      estimatedRevenueRp,
      realizedSaleRevenueRp,
      grossMarginRp,
      marginPct,
      transactionCount: base.transactionCount + liveTxCount,
      iotVerifiedCount: base.iotVerifiedCount + liveIotCount,
      isToday,
    });
  }

  // Compute summary metrics across the series
  let totalWeightKg = 0;
  let totalDepositCostRp = 0;
  let totalEstimatedRevenueRp = 0;
  let totalRealizedSalesRp = 0;
  let totalGrossMarginRp = 0;
  let totalTransactions = 0;
  let sumPlastikKg = 0;
  let sumKertasKg = 0;
  let sumLogamKacaKg = 0;
  let sumLainnyaKg = 0;

  let peakPoint = series[0] || {
    dateIso: anchorIso,
    dateLabel: 'Hari Ini',
    totalWeightKg: 0,
    estimatedRevenueRp: 0,
  };

  for (const pt of series) {
    totalWeightKg += pt.totalWeightKg;
    totalDepositCostRp += pt.depositCostRp;
    totalEstimatedRevenueRp += pt.estimatedRevenueRp;
    totalRealizedSalesRp += pt.realizedSaleRevenueRp;
    totalGrossMarginRp += pt.grossMarginRp;
    totalTransactions += pt.transactionCount;
    sumPlastikKg += pt.plastikKg;
    sumKertasKg += pt.kertasKg;
    sumLogamKacaKg += pt.logamKacaKg;
    sumLainnyaKg += pt.lainnyaKg;

    if (pt.totalWeightKg >= peakPoint.totalWeightKg) {
      peakPoint = pt;
    }
  }

  totalWeightKg = Number(totalWeightKg.toFixed(1));
  const avgDailyWeightKg =
    series.length > 0 ? Number((totalWeightKg / series.length).toFixed(1)) : 0;

  const avgMarginPct =
    totalEstimatedRevenueRp > 0
      ? Number(((totalGrossMarginRp / totalEstimatedRevenueRp) * 100).toFixed(1))
      : 0;

  // Compare first half vs second half for growth %
  const halfIdx = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, halfIdx);
  const secondHalf = series.slice(halfIdx);

  const firstHalfKg = firstHalf.reduce((acc, p) => acc + p.totalWeightKg, 0);
  const secondHalfKg = secondHalf.reduce((acc, p) => acc + p.totalWeightKg, 0);
  const volumeGrowthPct =
    firstHalfKg > 0
      ? Number((((secondHalfKg - firstHalfKg) / firstHalfKg) * 100).toFixed(1))
      : 0;

  const firstHalfRev = firstHalf.reduce((acc, p) => acc + p.estimatedRevenueRp, 0);
  const secondHalfRev = secondHalf.reduce((acc, p) => acc + p.estimatedRevenueRp, 0);
  const financialGrowthPct =
    firstHalfRev > 0
      ? Number((((secondHalfRev - firstHalfRev) / firstHalfRev) * 100).toFixed(1))
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    patronage: 'Dalam Naungan Hafi Digital',
    branchId,
    days: clampedDays,
    summary: {
      windowDays: clampedDays,
      branchId,
      startDateIso: series[0]?.dateIso || anchorIso,
      endDateIso: series[series.length - 1]?.dateIso || anchorIso,
      totalWeightKg,
      avgDailyWeightKg,
      peakDay: {
        dateIso: peakPoint.dateIso,
        dateLabel: peakPoint.dateLabel,
        weightKg: peakPoint.totalWeightKg,
        estimatedRevenueRp: peakPoint.estimatedRevenueRp,
      },
      totalDepositCostRp,
      totalEstimatedRevenueRp,
      totalRealizedSalesRp,
      totalGrossMarginRp,
      avgMarginPct,
      totalTransactions,
      volumeGrowthPct,
      financialGrowthPct,
      categoryBreakdown: {
        plastikKg: Number(sumPlastikKg.toFixed(1)),
        kertasKg: Number(sumKertasKg.toFixed(1)),
        logamKacaKg: Number(sumLogamKacaKg.toFixed(1)),
        lainnyaKg: Number(sumLainnyaKg.toFixed(1)),
      },
    },
    series,
  };
}
