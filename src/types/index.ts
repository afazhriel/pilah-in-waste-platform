export type WasteUnit = 'kg' | 'gram' | 'liter' | 'buah';

export interface WasteCategory {
  id: string;
  code: string;
  name: string;
  categoryGroup: 'Plastik' | 'Kertas' | 'Logam' | 'Kaca' | 'Minyak' | 'Elektronik' | 'Lainnya';
  unit: WasteUnit;
  buyPricePerKg: number; // Harga beli dari nasabah (Rp/kg)
  sellPricePerKg: number; // Harga jual ke pengepul (Rp/kg)
  description?: string;
  color: string;
  iconName: string;
  isActive: boolean;
  minDepositKg: number;
  lastUpdated: string;
}

export interface CategoryPriceHistory {
  id: string;
  categoryId: string;
  previousBuyPrice: number;
  newBuyPrice: number;
  previousSellPrice: number;
  newSellPrice: number;
  changedBy: string;
  reason: string;
  effectiveDate: string;
}

export interface Member {
  id: string;
  memberCode: string; // e.g. "PLH-0021"
  nik?: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  rtRw: string;
  kelurahan: string;
  branchId: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'suspended';
  avatarUrl?: string;
  qrCodeToken?: string;
  totalDepositCount: number;
  totalWeightKg: number;
  totalDepositValue: number;
  walletBalance: number;
  notes?: string;
}

export interface DepositItem {
  id: string;
  depositId: string;
  categoryId: string;
  categoryName: string;
  weightKg: number;
  pricePerKgSnapshot: number; // snapshot harga saat transaksi
  subtotal: number;
  notes?: string;
}

export interface DepositTransaction {
  id: string;
  transactionCode: string; // e.g. "TRX-20261025-001"
  memberId: string;
  memberName: string;
  memberCode: string;
  branchId: string;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  items: DepositItem[];
  totalWeightKg: number;
  totalValue: number;
  paymentMethod: 'tabungan' | 'tunai';
  status: 'completed' | 'cancelled' | 'pending';
  weighingStationId?: string; // id device jika via IoT
  isIotVerified: boolean;
  cancellationReason?: string;
}

export type WalletLedgerType = 'deposit' | 'withdrawal' | 'adjustment' | 'bonus' | 'reversal';

export interface WalletLedgerEntry {
  id: string;
  memberId: string;
  referenceType: WalletLedgerType;
  referenceId: string; // id transaksi setoran atau penarikan
  referenceCode: string;
  timestamp: string;
  amount: number; // positif untuk kredit, negatif untuk debit
  balanceBefore: number;
  balanceAfter: number;
  operatorName: string;
  description: string;
}

export interface WithdrawalRequest {
  id: string;
  withdrawalCode: string; // e.g. "WDR-20261025-01"
  memberId: string;
  memberName: string;
  memberCode: string;
  amount: number;
  requestDate: string;
  processedDate?: string;
  operatorName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  payoutMethod: 'tunai' | 'transfer_bank' | 'emoney';
  accountDetails?: string;
  notes?: string;
}

export interface InventoryStock {
  categoryId: string;
  categoryName: string;
  categoryGroup: string;
  currentStockKg: number;
  reservedStockKg: number; // dialokasikan untuk pengepul
  availableStockKg: number;
  avgBuyPricePerKg: number;
  estimatedValuation: number;
  minThresholdKg: number;
  unit: WasteUnit;
  lastMovementTimestamp: string;
}

export type StockMovementType = 'deposit' | 'collector_sale' | 'adjustment_plus' | 'adjustment_minus' | 'damage_loss';

export interface InventoryMovement {
  id: string;
  timestamp: string;
  categoryId: string;
  categoryName: string;
  movementType: StockMovementType;
  referenceId: string;
  referenceCode: string;
  quantityKg: number; // positif untuk masuk, negatif untuk keluar
  stockBeforeKg: number;
  stockAfterKg: number;
  costPerKgSnapshot: number;
  totalValuationChange: number;
  operatorName: string;
  notes?: string;
}

export interface Collector {
  id: string;
  code: string;
  name: string;
  companyName: string;
  phoneNumber: string;
  address: string;
  categoriesHandled: string[]; // nama jenis sampah yang diterima
  paymentTerms: 'tunai' | 'tempo_7' | 'tempo_14' | 'transfer';
  status: 'active' | 'inactive';
}

export interface CollectorSaleItem {
  id: string;
  saleId: string;
  categoryId: string;
  categoryName: string;
  weightKg: number;
  costPricePerKg: number; // HPP (harga beli dari nasabah)
  sellingPricePerKg: number; // Harga jual ke pengepul
  totalCost: number;
  totalRevenue: number;
  grossMargin: number;
}

export interface CollectorSale {
  id: string;
  invoiceCode: string; // e.g. "SLS-20261025-01"
  collectorId: string;
  collectorName: string;
  timestamp: string;
  branchId: string;
  operatorName: string;
  items: CollectorSaleItem[];
  totalWeightKg: number;
  totalCostAmount: number; // total HPP
  totalSaleAmount: number; // total pendapatan kotor
  totalGrossMargin: number; // laba kotor
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod: 'transfer' | 'tunai' | 'giro';
  vehicleNumber?: string;
  driverName?: string;
  notes?: string;
}

export interface OperationalExpense {
  id: string;
  expenseCode: string;
  date: string;
  category: 'operasional' | 'transportasi' | 'peralatan' | 'gaji' | 'konsumsi' | 'lainnya';
  amount: number;
  description: string;
  operatorName: string;
  receiptNumber?: string;
}

export type DeviceStatus = 'online' | 'offline' | 'calibrating' | 'error';
export type ScaleState = 'IDLE' | 'MEASURING' | 'STABLE' | 'CONFIRMING' | 'COMPLETED' | 'OVERLOAD';

export interface WeighingDevice {
  id: string;
  deviceCode: string; // e.g. "ESP32-SCALE-01"
  name: string;
  macAddress: string;
  firmwareVersion: string;
  location: string;
  status: DeviceStatus;
  lastHeartbeat: string;
  maxCapacityKg: number;
  precisionGram: number;
  calibrationFactor: number;
  tareOffset: number;
  isSimulated: boolean;
  batteryLevel?: number; // %
  signalStrengthDbm?: number; // dBm
}

export interface TelemetryReading {
  deviceId: string;
  timestamp: string;
  rawAdcValue: number;
  weightKg: number;
  isStable: boolean;
  stabilityScore: number; // 0 - 100%
  temperatureC?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  isActive: boolean;
}
