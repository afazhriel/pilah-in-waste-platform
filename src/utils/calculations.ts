/**
 * Core business logic and calculations for Pilah.in
 * Pure functions designed for deterministic testing and server-grade consistency.
 */

import { WalletLedgerEntry, InventoryMovement } from '../types';

/**
 * Calculates deposit value based on weight (kg) and snapshot price (Rp/kg).
 * Uses integer math to eliminate floating-point financial drift.
 */
export function calculateDepositSubtotal(weightKg: number, pricePerKg: number): number {
  if (weightKg <= 0 || pricePerKg <= 0) return 0;
  // Calculate using grams for precision: (grams * pricePerKg) / 1000, rounded to integer IDR
  const grams = Math.round(weightKg * 1000);
  return Math.round((grams * pricePerKg) / 1000);
}

/**
 * Validates whether a sequence of weight readings (in kg) is stable.
 * Stable if variance/range across the window is under maxDeltaKg.
 */
export function evaluateWeightStability(
  samples: number[],
  maxDeltaKg: number = 0.05
): { isStable: boolean; averageWeightKg: number; stabilityScore: number } {
  if (!samples || samples.length < 3) {
    return { isStable: false, averageWeightKg: samples?.[0] || 0, stabilityScore: 0 };
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min;
  const sum = samples.reduce((a, b) => a + b, 0);
  const avg = Number((sum / samples.length).toFixed(3));

  // Score from 0 to 100 based on closeness to 0 variance
  const score = Math.max(0, Math.min(100, Math.round((1 - range / Math.max(maxDeltaKg * 3, 0.01)) * 100)));
  const isStable = range <= maxDeltaKg && avg > 0.01;

  return { isStable, averageWeightKg: avg, stabilityScore: isStable ? 100 : score };
}

/**
 * Reconciles inventory stock:
 * Opening Stock + Deposits + Positive Adjustments - Sales - Negative Adjustments = Closing Stock
 */
export function reconcileInventoryStock(
  openingStockKg: number,
  movements: Array<{ quantityKg: number }>
): number {
  const totalChange = movements.reduce((acc, m) => acc + m.quantityKg, 0);
  const result = openingStockKg + totalChange;
  // Stock cannot realistically be negative; clamp to 0 with warning condition
  return Number(Math.max(0, result).toFixed(3));
}

/**
 * Derives wallet balance strictly from an append-only ledger.
 * Balances are never mutated directly; always computed from credit/debit sum.
 */
export function deriveWalletBalance(entries: WalletLedgerEntry[]): number {
  return entries.reduce((acc, entry) => acc + entry.amount, 0);
}

/**
 * Prevents duplicate transactions by checking uniqueness of idempotency keys/transaction codes.
 */
export function isDuplicateTransaction(existingCodes: Set<string> | string[], newCode: string): boolean {
  if (Array.isArray(existingCodes)) {
    return existingCodes.includes(newCode);
  }
  return existingCodes.has(newCode);
}

/**
 * Calculates Gross Margin from collector sales:
 * Gross Margin = (Selling Price - Cost Price) * Weight
 */
export function calculateGrossMargin(
  weightKg: number,
  costPricePerKg: number,
  sellingPricePerKg: number
): { totalCost: number; totalRevenue: number; grossMargin: number; marginPercentage: number } {
  const totalCost = calculateDepositSubtotal(weightKg, costPricePerKg);
  const totalRevenue = calculateDepositSubtotal(weightKg, sellingPricePerKg);
  const grossMargin = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? Number(((grossMargin / totalRevenue) * 100).toFixed(1)) : 0;

  return { totalCost, totalRevenue, grossMargin, marginPercentage };
}

/**
 * Financial reconciliation model
 * Accurately separates deposits (wallet liabilities) from collector sales and net profit.
 */
export function calculateFinancialSummary(params: {
  totalDepositValue: number; // Nominal setoran (kewajiban nasabah)
  totalWalletBalances: number; // Saldo simpanan belum ditarik
  totalWithdrawalsPaid: number; // Saldo yang telah dicairkan tunai ke nasabah
  collectorSalesRevenue: number; // Pendapatan dari pengepul
  collectorSalesCost: number; // HPP barang yang terjual
  operationalExpenses: number; // Biaya operasional
}) {
  const realizedGrossMargin = params.collectorSalesRevenue - params.collectorSalesCost;
  const netOperationalProfit = realizedGrossMargin - params.operationalExpenses;
  
  // Kas operasional = Penjualan Pengepul - Penarikan Nasabah yang Dibayarkan - Biaya Operasional
  const estimatedCashReserve = params.collectorSalesRevenue - params.totalWithdrawalsPaid - params.operationalExpenses;

  return {
    realizedGrossMargin,
    netOperationalProfit,
    walletLiability: params.totalWalletBalances,
    estimatedCashReserve,
  };
}
