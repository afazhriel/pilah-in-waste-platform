import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDepositSubtotal,
  evaluateWeightStability,
  reconcileInventoryStock,
  deriveWalletBalance,
  isDuplicateTransaction,
  calculateGrossMargin,
  calculateFinancialSummary,
} from './calculations';
import { WalletLedgerEntry } from '../types';

test('calculateDepositSubtotal: exact integer Rupiah without floating drift', () => {
  // 3.5 kg at Rp 4.500/kg = 15,750
  assert.equal(calculateDepositSubtotal(3.5, 4500), 15750);
  // 0.25 kg at Rp 3.000/kg = 750
  assert.equal(calculateDepositSubtotal(0.25, 3000), 750);
  // 0 kg or 0 price
  assert.equal(calculateDepositSubtotal(0, 5000), 0);
  assert.equal(calculateDepositSubtotal(2.5, 0), 0);
  // Fractional rounding test: 1.333 kg at Rp 10.000/kg = 13,330
  assert.equal(calculateDepositSubtotal(1.333, 10000), 13330);
});

test('evaluateWeightStability: detects stable vs jittery readings', () => {
  // Stable readings within 0.05kg tolerance
  const stableSamples = [12.45, 12.46, 12.45, 12.46, 12.45];
  const stableResult = evaluateWeightStability(stableSamples, 0.05);
  assert.equal(stableResult.isStable, true);
  assert.equal(stableResult.stabilityScore, 100);

  // Unstable readings (person still putting items on scale)
  const unstableSamples = [10.2, 11.5, 12.4, 13.1, 13.9];
  const unstableResult = evaluateWeightStability(unstableSamples, 0.05);
  assert.equal(unstableResult.isStable, false);
  assert.ok(unstableResult.stabilityScore < 80);
});

test('reconcileInventoryStock: Opening Stock + Movements = Closing Stock', () => {
  const openingStock = 100; // 100 kg
  const movements = [
    { quantityKg: 25.5 },  // deposit +25.5
    { quantityKg: 14.5 },  // deposit +14.5
    { quantityKg: -80 },   // sale to collector -80
    { quantityKg: -2 },    // adjustment loss -2
    { quantityKg: 5 },     // adjustment found +5
  ];
  // 100 + 25.5 + 14.5 - 80 - 2 + 5 = 63 kg
  assert.equal(reconcileInventoryStock(openingStock, movements), 63);
});

test('deriveWalletBalance: correctly aggregates append-only ledger entries', () => {
  const ledger: WalletLedgerEntry[] = [
    {
      id: '1',
      memberId: 'M1',
      referenceType: 'deposit',
      referenceId: 'D1',
      referenceCode: 'TRX-01',
      timestamp: '2026-10-25T10:00:00Z',
      amount: 45000,
      balanceBefore: 0,
      balanceAfter: 45000,
      operatorName: 'Budi',
      description: 'Setoran Plastik PET 10kg',
    },
    {
      id: '2',
      memberId: 'M1',
      referenceType: 'deposit',
      referenceId: 'D2',
      referenceCode: 'TRX-02',
      timestamp: '2026-10-25T11:00:00Z',
      amount: 25000,
      balanceBefore: 45000,
      balanceAfter: 70000,
      operatorName: 'Budi',
      description: 'Setoran Kardus 10kg',
    },
    {
      id: '3',
      memberId: 'M1',
      referenceType: 'withdrawal',
      referenceId: 'W1',
      referenceCode: 'WDR-01',
      timestamp: '2026-10-25T12:00:00Z',
      amount: -50000,
      balanceBefore: 70000,
      balanceAfter: 20000,
      operatorName: 'Siti',
      description: 'Penarikan tunai tabungan',
    },
  ];

  assert.equal(deriveWalletBalance(ledger), 20000);
});

test('isDuplicateTransaction: detects replay or duplicate submission', () => {
  const existing = ['TRX-001', 'TRX-002'];
  assert.equal(isDuplicateTransaction(existing, 'TRX-001'), true);
  assert.equal(isDuplicateTransaction(existing, 'TRX-003'), false);
});

test('calculateGrossMargin: accurately computes revenue, HPP and margin', () => {
  // 50kg sold at Rp 7.000/kg, bought at Rp 4.500/kg
  const result = calculateGrossMargin(50, 4500, 7000);
  assert.equal(result.totalCost, 225000);
  assert.equal(result.totalRevenue, 350000);
  assert.equal(result.grossMargin, 125000);
  // (125000 / 350000) * 100 = 35.7%
  assert.equal(result.marginPercentage, 35.7);
});

test('calculateFinancialSummary: strictly separates wallet liability from profit', () => {
  const summary = calculateFinancialSummary({
    totalDepositValue: 5000000, // Rp 5jt disetor nasabah (menjadi saldo tabungan)
    totalWalletBalances: 3500000, // Rp 3.5jt belum ditarik nasabah (kewajiban bank sampah)
    totalWithdrawalsPaid: 1500000, // Rp 1.5jt sudah dicairkan
    collectorSalesRevenue: 6800000, // Rp 6.8jt omset jual ke pengepul
    collectorSalesCost: 4200000, // Rp 4.2jt HPP material terjual
    operationalExpenses: 800000, // Rp 800rb biaya operasional
  });

  assert.equal(summary.realizedGrossMargin, 2600000); // 6.8jt - 4.2jt = 2.6jt
  assert.equal(summary.netOperationalProfit, 1800000); // 2.6jt - 800rb = 1.8jt
  assert.equal(summary.walletLiability, 3500000);
});
