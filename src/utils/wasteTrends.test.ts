import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWasteTrendsReport,
  formatShortDateID,
  formatFullDateID,
} from './wasteTrends';
import {
  initialWasteCategories,
  initialDeposits,
  initialCollectorSales,
} from '../data/seedData';
import { DepositTransaction } from '../types';

test('formatShortDateID and formatFullDateID format Indonesian dates accurately', () => {
  assert.equal(formatShortDateID('2026-10-25'), '25 Okt');
  assert.equal(formatShortDateID('2026-09-04'), '4 Sep');
  assert.equal(formatFullDateID('2026-10-25'), '25 Oktober 2026');
});

test('buildWasteTrendsReport generates exact 30-day series and consistent summary totals', () => {
  const report = buildWasteTrendsReport({
    deposits: initialDeposits,
    collectorSales: initialCollectorSales,
    wasteCategories: initialWasteCategories,
    days: 30,
    branchId: 'b-01',
    anchorDateIso: '2026-10-26',
  });

  assert.equal(report.days, 30);
  assert.equal(report.series.length, 30);
  assert.equal(report.summary.startDateIso, '2026-09-27');
  assert.equal(report.summary.endDateIso, '2026-10-26');
  assert.equal(report.series[29].isToday, true);
  assert.equal(report.series[29].dateLabel, 'Hari Ini');

  const sumSeriesWeight = Number(
    report.series.reduce((acc, p) => acc + p.totalWeightKg, 0).toFixed(1)
  );
  assert.equal(report.summary.totalWeightKg, sumSeriesWeight);

  const sumSeriesMargin = report.series.reduce((acc, p) => acc + p.grossMarginRp, 0);
  assert.equal(report.summary.totalGrossMarginRp, sumSeriesMargin);
  assert.ok(report.summary.totalEstimatedRevenueRp > report.summary.totalDepositCostRp);
});

test('buildWasteTrendsReport synchronizes live deposits and financial margin accurately without baseline', () => {
  const customDeposit: DepositTransaction = {
    id: 'dep-test-99',
    transactionCode: 'TRX-20261026-999',
    memberId: 'mem-001',
    memberName: 'Ibu Ratna Sari',
    memberCode: 'PLH-0001',
    branchId: 'b-01',
    operatorId: 'op-01',
    operatorName: 'Budi Santoso',
    timestamp: '2026-10-26T09:15:00Z',
    items: [
      {
        id: 'item-test-1',
        depositId: 'dep-test-99',
        categoryId: 'cat-pet', // Buy: 4500, Sell: 7000
        categoryName: 'Plastik PET (Botol Bening)',
        weightKg: 10,
        pricePerKgSnapshot: 4500,
        subtotal: 45000,
      },
      {
        id: 'item-test-2',
        depositId: 'dep-test-99',
        categoryId: 'cat-kardus', // Buy: 2800, Sell: 4200
        categoryName: 'Kardus Gelombang (Box)',
        weightKg: 20,
        pricePerKgSnapshot: 2800,
        subtotal: 56000,
      },
    ],
    totalWeightKg: 30,
    totalValue: 101000,
    paymentMethod: 'tabungan',
    status: 'completed',
    isIotVerified: true,
  };

  const report = buildWasteTrendsReport({
    deposits: [customDeposit],
    collectorSales: [],
    wasteCategories: initialWasteCategories,
    days: 30,
    branchId: 'b-01',
    anchorDateIso: '2026-10-26',
    includeBaseline: false,
  });

  const todayPoint = report.series[report.series.length - 1];
  assert.equal(todayPoint.dateIso, '2026-10-26');
  assert.equal(todayPoint.plastikKg, 10);
  assert.equal(todayPoint.kertasKg, 20);
  assert.equal(todayPoint.totalWeightKg, 30);
  assert.equal(todayPoint.depositCostRp, 101000);
  // Estimated sell value = 10 * 7000 + 20 * 4200 = 70,000 + 84,000 = 154,000
  assert.equal(todayPoint.estimatedRevenueRp, 154000);
  assert.equal(todayPoint.grossMarginRp, 53000);
  assert.equal(todayPoint.transactionCount, 1);
  assert.equal(todayPoint.iotVerifiedCount, 1);
});

test('buildWasteTrendsReport filters by branchId and clamps window days', () => {
  const reportB1 = buildWasteTrendsReport({
    deposits: initialDeposits,
    collectorSales: initialCollectorSales,
    wasteCategories: initialWasteCategories,
    days: 14,
    branchId: 'b-01',
    anchorDateIso: '2026-10-26',
  });

  const reportB2 = buildWasteTrendsReport({
    deposits: initialDeposits,
    collectorSales: initialCollectorSales,
    wasteCategories: initialWasteCategories,
    days: 14,
    branchId: 'b-02',
    anchorDateIso: '2026-10-26',
  });

  assert.equal(reportB1.series.length, 14);
  assert.equal(reportB2.series.length, 14);
  assert.ok(reportB1.summary.totalWeightKg > reportB2.summary.totalWeightKg);
});
