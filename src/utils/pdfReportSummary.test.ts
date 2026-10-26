import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterByPeriod,
  buildPeriodWasteSummary,
  buildSummaryPdfFilename,
} from './pdfReportSummary';
import { DepositTransaction, CollectorSale, WasteCategory } from '../types';

const MOCK_CATEGORIES: WasteCategory[] = [
  {
    id: 'cat-pet',
    code: 'PL-01',
    name: 'Botol PET Bening',
    categoryGroup: 'Plastik',
    unit: 'kg',
    buyPricePerKg: 4000,
    sellPricePerKg: 5500,
    color: '#009CAC',
    iconName: 'Package',
    isActive: true,
    minDepositKg: 0.5,
    lastUpdated: '2026-10-01T00:00:00Z',
  },
  {
    id: 'cat-kardus',
    code: 'KR-01',
    name: 'Kardus / Karton Tebal',
    categoryGroup: 'Kertas',
    unit: 'kg',
    buyPricePerKg: 2500,
    sellPricePerKg: 3400,
    color: '#D97706',
    iconName: 'FileText',
    isActive: true,
    minDepositKg: 1.0,
    lastUpdated: '2026-10-01T00:00:00Z',
  },
];

const REF_DATE = new Date('2026-10-26T10:00:00.000Z');

const MOCK_DEPOSITS: DepositTransaction[] = [
  {
    id: 'dep-today',
    transactionCode: 'TRX-20261026-001',
    memberId: 'mem-1',
    memberName: 'Budi Santoso',
    memberCode: 'PLH-0001',
    branchId: 'br-1',
    operatorId: 'op-1',
    operatorName: 'Rizky Pratama',
    timestamp: '2026-10-26T08:30:00.000Z',
    items: [
      {
        id: 'item-1',
        depositId: 'dep-today',
        categoryId: 'cat-pet',
        categoryName: 'Botol PET Bening',
        weightKg: 6,
        pricePerKgSnapshot: 4000,
        subtotal: 24000,
      },
      {
        id: 'item-2',
        depositId: 'dep-today',
        categoryId: 'cat-kardus',
        categoryName: 'Kardus / Karton Tebal',
        weightKg: 4,
        pricePerKgSnapshot: 2500,
        subtotal: 10000,
      },
    ],
    totalWeightKg: 10,
    totalValue: 34000,
    paymentMethod: 'tabungan',
    status: 'completed',
    isIotVerified: true,
  },
  {
    id: 'dep-5days',
    transactionCode: 'TRX-20261021-002',
    memberId: 'mem-2',
    memberName: 'Siti Aminah',
    memberCode: 'PLH-0002',
    branchId: 'br-1',
    operatorId: 'op-1',
    operatorName: 'Rizky Pratama',
    timestamp: '2026-10-21T09:00:00.000Z',
    items: [
      {
        id: 'item-3',
        depositId: 'dep-5days',
        categoryId: 'cat-pet',
        categoryName: 'Botol PET Bening',
        weightKg: 5,
        pricePerKgSnapshot: 4000,
        subtotal: 20000,
      },
    ],
    totalWeightKg: 5,
    totalValue: 20000,
    paymentMethod: 'tunai',
    status: 'completed',
    isIotVerified: false,
  },
  {
    id: 'dep-20days',
    transactionCode: 'TRX-20261006-003',
    memberId: 'mem-1',
    memberName: 'Budi Santoso',
    memberCode: 'PLH-0001',
    branchId: 'br-1',
    operatorId: 'op-1',
    operatorName: 'Rizky Pratama',
    timestamp: '2026-10-06T09:00:00.000Z',
    items: [
      {
        id: 'item-4',
        depositId: 'dep-20days',
        categoryId: 'cat-kardus',
        categoryName: 'Kardus / Karton Tebal',
        weightKg: 8,
        pricePerKgSnapshot: 2500,
        subtotal: 20000,
      },
    ],
    totalWeightKg: 8,
    totalValue: 20000,
    paymentMethod: 'tabungan',
    status: 'completed',
    isIotVerified: true,
  },
  {
    id: 'dep-cancelled',
    transactionCode: 'TRX-20261026-999',
    memberId: 'mem-3',
    memberName: 'Batal User',
    memberCode: 'PLH-0099',
    branchId: 'br-1',
    operatorId: 'op-1',
    operatorName: 'Rizky Pratama',
    timestamp: '2026-10-26T09:30:00.000Z',
    items: [],
    totalWeightKg: 50,
    totalValue: 200000,
    paymentMethod: 'tunai',
    status: 'cancelled',
    isIotVerified: false,
  },
];

const MOCK_SALES: CollectorSale[] = [
  {
    id: 'sale-1',
    invoiceCode: 'SLS-20261025-01',
    collectorId: 'col-1',
    collectorName: 'PT Daur Ulang Nusantara',
    timestamp: '2026-10-25T14:00:00.000Z',
    branchId: 'br-1',
    operatorName: 'Rizky Pratama',
    items: [],
    totalWeightKg: 15,
    totalCostAmount: 54000,
    totalSaleAmount: 74500,
    totalGrossMargin: 20500,
    paymentStatus: 'paid',
    paymentMethod: 'transfer',
  },
];

describe('pdfReportSummary utilities', () => {
  it('filters transactions accurately for today, 7days, 30days, and all', () => {
    const valid = MOCK_DEPOSITS.filter((d) => d.status !== 'cancelled');
    assert.equal(filterByPeriod(valid, 'today', REF_DATE).length, 1);
    assert.equal(filterByPeriod(valid, '7days', REF_DATE).length, 2);
    assert.equal(filterByPeriod(valid, '30days', REF_DATE).length, 3);
    assert.equal(filterByPeriod(valid, 'all', REF_DATE).length, 3);
  });

  it('computes accurate waste collection metrics, category breakdown, and margins for 7days period', () => {
    const report = buildPeriodWasteSummary({
      deposits: MOCK_DEPOSITS,
      collectorSales: MOCK_SALES,
      wasteCategories: MOCK_CATEGORIES,
      period: '7days',
      referenceDate: REF_DATE,
    });

    // Cancelled deposit is excluded; dep-today (10kg) + dep-5days (5kg) = 15kg
    assert.equal(report.totalTransactions, 2);
    assert.equal(report.totalWeightKg, 15);
    assert.equal(report.uniqueMembersCount, 2);
    assert.equal(report.avgWeightPerTxKg, 7.5);
    assert.equal(report.totalMemberPayoutRp, 54000);
    assert.equal(report.savingsPayoutRp, 34000);
    assert.equal(report.cashPayoutRp, 20000);
    assert.equal(report.iotVerifiedCount, 1);
    assert.equal(report.iotVerifiedPercent, 50);

    // Category breakdown sorted by weight descending: PET (11kg) then Kardus (4kg)
    assert.equal(report.categoryBreakdown.length, 2);
    assert.equal(report.categoryBreakdown[0].categoryId, 'cat-pet');
    assert.equal(report.categoryBreakdown[0].weightKg, 11);
    assert.equal(report.categoryBreakdown[0].totalPayoutRp, 44000);
    // 11kg * 5500 = 60500
    assert.equal(report.categoryBreakdown[0].estimatedCollectorValueRp, 60500);
    assert.equal(report.categoryBreakdown[0].estimatedGrossMarginRp, 16500);

    assert.equal(report.categoryBreakdown[1].categoryId, 'cat-kardus');
    assert.equal(report.categoryBreakdown[1].weightKg, 4);
    assert.equal(report.categoryBreakdown[1].totalPayoutRp, 10000);
    // 4kg * 3400 = 13600
    assert.equal(report.categoryBreakdown[1].estimatedCollectorValueRp, 13600);

    // Realized collector sales in 7days
    assert.equal(report.realizedCollectorRevenueRp, 74500);
    assert.equal(report.realizedGrossMarginRp, 20500);
  });

  it('handles empty datasets gracefully without NaN or division by zero', () => {
    const emptyReport = buildPeriodWasteSummary({
      deposits: [],
      collectorSales: [],
      wasteCategories: MOCK_CATEGORIES,
      period: 'today',
      referenceDate: REF_DATE,
    });

    assert.equal(emptyReport.totalWeightKg, 0);
    assert.equal(emptyReport.totalTransactions, 0);
    assert.equal(emptyReport.avgWeightPerTxKg, 0);
    assert.equal(emptyReport.iotVerifiedPercent, 0);
    assert.equal(emptyReport.categoryBreakdown.length, 0);
    assert.equal(emptyReport.topContributors.length, 0);
  });

  it('builds deterministic PDF summary filenames', () => {
    const filename = buildSummaryPdfFilename('30days', REF_DATE);
    assert.equal(filename, 'PilahIn_Ringkasan_Koleksi_30DAYS_2026-10-26.pdf');
  });
});
