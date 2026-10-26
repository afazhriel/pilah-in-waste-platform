import {
  DepositTransaction,
  CollectorSale,
  WasteCategory,
} from '../types';

export type ReportPeriodFilter = 'today' | '7days' | '30days' | 'all';

export interface CategoryCollectionSummary {
  categoryId: string;
  categoryName: string;
  categoryGroup: string;
  weightKg: number;
  weightSharePercent: number;
  totalPayoutRp: number;
  estimatedCollectorValueRp: number;
  estimatedGrossMarginRp: number;
  itemCount: number;
}

export interface TopContributorSummary {
  memberId: string;
  memberCode: string;
  memberName: string;
  depositCount: number;
  totalWeightKg: number;
  totalValueRp: number;
}

export interface PeriodWasteSummaryReport {
  periodFilter: ReportPeriodFilter;
  periodLabel: string;
  periodDateRangeText: string;
  generatedAtIso: string;
  // Core Waste Collection KPIs
  totalWeightKg: number;
  totalTransactions: number;
  uniqueMembersCount: number;
  avgWeightPerTxKg: number;
  // Financial KPIs
  totalMemberPayoutRp: number;
  savingsPayoutRp: number;
  cashPayoutRp: number;
  estimatedCollectorRevenueRp: number;
  estimatedGrossMarginRp: number;
  realizedCollectorRevenueRp: number;
  realizedGrossMarginRp: number;
  // IoT & Telemetry Quality
  iotVerifiedCount: number;
  iotVerifiedPercent: number;
  // Environmental Impact
  co2ReductionKg: number;
  landfillDivertedLitres: number;
  // Detailed Breakdowns
  categoryBreakdown: CategoryCollectionSummary[];
  topContributors: TopContributorSummary[];
  filteredDeposits: DepositTransaction[];
  filteredSales: CollectorSale[];
}

export const PERIOD_LABELS: Record<ReportPeriodFilter, string> = {
  today: 'Hari Ini',
  '7days': '7 Hari Terakhir',
  '30days': '30 Hari Terakhir',
  all: 'Semua Data Historis',
};

/**
 * Filters transactions by period relative to a reference date.
 */
export function filterByPeriod<T extends { timestamp: string }>(
  items: T[],
  period: ReportPeriodFilter,
  referenceDate: Date = new Date()
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (period === 'all') return [...items];

  const refTime = referenceDate.getTime();
  const todayPrefix = referenceDate.toISOString().slice(0, 10);

  return items.filter((item) => {
    if (!item.timestamp) return false;
    if (period === 'today') {
      return item.timestamp.slice(0, 10) === todayPrefix;
    }
    const itemTime = new Date(item.timestamp).getTime();
    if (Number.isNaN(itemTime)) return false;
    const diffDays = (refTime - itemTime) / (1000 * 3600 * 24);
    if (period === '7days') return diffDays >= -0.5 && diffDays <= 7;
    if (period === '30days') return diffDays >= -0.5 && diffDays <= 30;
    return true;
  });
}

/**
 * Computes a complete, deterministic summary of the current period's waste collection
 * data for rendering in the ReportingModule UI and generating the jsPDF summary report.
 */
export function buildPeriodWasteSummary(params: {
  deposits: DepositTransaction[];
  collectorSales: CollectorSale[];
  wasteCategories: WasteCategory[];
  period: ReportPeriodFilter;
  referenceDate?: Date;
}): PeriodWasteSummaryReport {
  const {
    deposits,
    collectorSales,
    wasteCategories,
    period,
    referenceDate = new Date(),
  } = params;

  const categoryMap = new Map<string, WasteCategory>();
  for (const cat of wasteCategories || []) {
    categoryMap.set(cat.id, cat);
  }

  const validDeposits = (deposits || []).filter((d) => d.status !== 'cancelled');
  const filteredDeposits = filterByPeriod(validDeposits, period, referenceDate);
  const filteredSales = filterByPeriod(collectorSales || [], period, referenceDate);

  let totalWeightKg = 0;
  let totalMemberPayoutRp = 0;
  let savingsPayoutRp = 0;
  let cashPayoutRp = 0;
  let iotVerifiedCount = 0;

  const uniqueMemberIds = new Set<string>();
  const categoryAgg = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      categoryGroup: string;
      weightKg: number;
      totalPayoutRp: number;
      estimatedCollectorValueRp: number;
      itemCount: number;
    }
  >();

  const memberAgg = new Map<
    string,
    {
      memberId: string;
      memberCode: string;
      memberName: string;
      depositCount: number;
      totalWeightKg: number;
      totalValueRp: number;
    }
  >();

  for (const dep of filteredDeposits) {
    const depWeight = Number(dep.totalWeightKg) || 0;
    const depValue = Math.round(Number(dep.totalValue) || 0);

    totalWeightKg += depWeight;
    totalMemberPayoutRp += depValue;

    if (dep.paymentMethod === 'tabungan') {
      savingsPayoutRp += depValue;
    } else {
      cashPayoutRp += depValue;
    }

    if (dep.isIotVerified) {
      iotVerifiedCount += 1;
    }

    if (dep.memberId) {
      uniqueMemberIds.add(dep.memberId);
      const existingMember = memberAgg.get(dep.memberId);
      if (existingMember) {
        existingMember.depositCount += 1;
        existingMember.totalWeightKg = Number(
          (existingMember.totalWeightKg + depWeight).toFixed(2)
        );
        existingMember.totalValueRp += depValue;
      } else {
        memberAgg.set(dep.memberId, {
          memberId: dep.memberId,
          memberCode: dep.memberCode || '-',
          memberName: dep.memberName || 'Nasabah',
          depositCount: 1,
          totalWeightKg: Number(depWeight.toFixed(2)),
          totalValueRp: depValue,
        });
      }
    }

    for (const item of dep.items || []) {
      const cat = categoryMap.get(item.categoryId);
      const itemWeight = Number(item.weightKg) || 0;
      const itemSubtotal = Math.round(Number(item.subtotal) || 0);
      const sellPricePerKg = cat
        ? cat.sellPricePerKg
        : Math.round((item.pricePerKgSnapshot || 0) * 1.35);
      const estCollectorVal = Math.round(itemWeight * sellPricePerKg);

      const existingCat = categoryAgg.get(item.categoryId);
      if (existingCat) {
        existingCat.weightKg = Number((existingCat.weightKg + itemWeight).toFixed(2));
        existingCat.totalPayoutRp += itemSubtotal;
        existingCat.estimatedCollectorValueRp += estCollectorVal;
        existingCat.itemCount += 1;
      } else {
        categoryAgg.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: item.categoryName || cat?.name || 'Material Daur Ulang',
          categoryGroup: cat?.categoryGroup || 'Lainnya',
          weightKg: Number(itemWeight.toFixed(2)),
          totalPayoutRp: itemSubtotal,
          estimatedCollectorValueRp: estCollectorVal,
          itemCount: 1,
        });
      }
    }
  }

  totalWeightKg = Number(totalWeightKg.toFixed(2));
  const totalTransactions = filteredDeposits.length;
  const uniqueMembersCount = uniqueMemberIds.size;
  const avgWeightPerTxKg =
    totalTransactions > 0 ? Number((totalWeightKg / totalTransactions).toFixed(2)) : 0;

  const iotVerifiedPercent =
    totalTransactions > 0
      ? Number(((iotVerifiedCount / totalTransactions) * 100).toFixed(1))
      : 0;

  const categoryBreakdown: CategoryCollectionSummary[] = Array.from(
    categoryAgg.values()
  )
    .map((entry) => {
      const share =
        totalWeightKg > 0
          ? Number(((entry.weightKg / totalWeightKg) * 100).toFixed(1))
          : 0;
      const margin = entry.estimatedCollectorValueRp - entry.totalPayoutRp;
      return {
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        categoryGroup: entry.categoryGroup,
        weightKg: entry.weightKg,
        weightSharePercent: share,
        totalPayoutRp: entry.totalPayoutRp,
        estimatedCollectorValueRp: entry.estimatedCollectorValueRp,
        estimatedGrossMarginRp: margin,
        itemCount: entry.itemCount,
      };
    })
    .sort((a, b) => b.weightKg - a.weightKg);

  const estimatedCollectorRevenueRp = categoryBreakdown.reduce(
    (sum, c) => sum + c.estimatedCollectorValueRp,
    0
  );
  const estimatedGrossMarginRp = estimatedCollectorRevenueRp - totalMemberPayoutRp;

  const realizedCollectorRevenueRp = filteredSales.reduce(
    (sum, s) => sum + (Math.round(Number(s.totalSaleAmount)) || 0),
    0
  );
  const realizedGrossMarginRp = filteredSales.reduce(
    (sum, s) => sum + (Math.round(Number(s.totalGrossMargin)) || 0),
    0
  );

  const topContributors: TopContributorSummary[] = Array.from(memberAgg.values())
    .sort((a, b) => b.totalWeightKg - a.totalWeightKg || b.totalValueRp - a.totalValueRp)
    .slice(0, 5);

  // Environmental conversion factors:
  // 1 kg mixed recyclable waste diverted saves ~1.65 kg CO2e and ~4.2 litres of landfill volume
  const co2ReductionKg = Number((totalWeightKg * 1.65).toFixed(2));
  const landfillDivertedLitres = Math.round(totalWeightKg * 4.2);

  // Determine human-readable date range text
  let periodDateRangeText = PERIOD_LABELS[period];
  if (filteredDeposits.length > 0) {
    const sortedTimestamps = filteredDeposits
      .map((d) => d.timestamp.slice(0, 10))
      .sort();
    const earliest = sortedTimestamps[0];
    const latest = sortedTimestamps[sortedTimestamps.length - 1];
    periodDateRangeText =
      earliest === latest ? earliest : `${earliest} s/d ${latest}`;
  } else {
    periodDateRangeText = referenceDate.toISOString().slice(0, 10);
  }

  return {
    periodFilter: period,
    periodLabel: PERIOD_LABELS[period],
    periodDateRangeText,
    generatedAtIso: referenceDate.toISOString(),
    totalWeightKg,
    totalTransactions,
    uniqueMembersCount,
    avgWeightPerTxKg,
    totalMemberPayoutRp,
    savingsPayoutRp,
    cashPayoutRp,
    estimatedCollectorRevenueRp,
    estimatedGrossMarginRp,
    realizedCollectorRevenueRp,
    realizedGrossMarginRp,
    iotVerifiedCount,
    iotVerifiedPercent,
    co2ReductionKg,
    landfillDivertedLitres,
    categoryBreakdown,
    topContributors,
    filteredDeposits,
    filteredSales,
  };
}

/**
 * Generates a standardized filename for the PDF summary report.
 */
export function buildSummaryPdfFilename(
  period: ReportPeriodFilter,
  referenceDate: Date = new Date()
): string {
  const dateSlug = referenceDate.toISOString().slice(0, 10);
  const periodSlug = period.toUpperCase();
  return `PilahIn_Ringkasan_Koleksi_${periodSlug}_${dateSlug}.pdf`;
}
