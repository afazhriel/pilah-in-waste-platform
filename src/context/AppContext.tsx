import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Branch,
  Member,
  WasteCategory,
  CategoryPriceHistory,
  WeighingDevice,
  Collector,
  DepositTransaction,
  DepositItem,
  WalletLedgerEntry,
  InventoryStock,
  InventoryMovement,
  CollectorSale,
  OperationalExpense,
  WithdrawalRequest,
  AuditLog,
  ScaleState,
} from '../types';
import {
  initialBranches,
  initialWasteCategories,
  initialMembers,
  initialDevices,
  initialCollectors,
  initialInventoryStocks,
  initialDeposits,
  initialWalletLedger,
  initialInventoryMovements,
  initialCollectorSales,
  initialExpenses,
  initialWithdrawalRequests,
  initialAuditLogs,
} from '../data/seedData';
import { calculateDepositSubtotal, evaluateWeightStability, isDuplicateTransaction } from '../utils/calculations';

export type NavTab =
  | 'overview'
  | 'setoran'
  | 'timbangan'
  | 'nasabah'
  | 'harga'
  | 'tabungan'
  | 'inventaris'
  | 'penjualan'
  | 'keuangan'
  | 'laporan'
  | 'perangkat'
  | 'pengaturan';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  read: boolean;
  deviceCode?: string;
  capacityPct?: number;
  actionTab?: NavTab;
}

export interface ApiRequestLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  source: 'WEB-CLIENT' | 'ESP32-NODE' | 'SYSTEM';
  summary: string;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  branches: Branch[];
  currentBranchId: string;
  setCurrentBranchId: (id: string) => void;
  currentBranch: Branch;
  currentUser: { id: string; name: string; role: string; email: string };
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  activeToastAlerts: NotificationItem[];
  dismissToastAlert: (id: string) => void;
  capacityWarningThresholdPct: number;
  capacityCriticalThresholdPct: number;
  setCapacityThresholds: (warningPct: number, criticalPct: number) => void;
  currentCapacityPct: number;
  
  // Domain State
  wasteCategories: WasteCategory[];
  priceHistory: CategoryPriceHistory[];
  members: Member[];
  deposits: DepositTransaction[];
  walletLedger: WalletLedgerEntry[];
  inventoryStocks: InventoryStock[];
  inventoryMovements: InventoryMovement[];
  collectors: Collector[];
  collectorSales: CollectorSale[];
  expenses: OperationalExpense[];
  withdrawalRequests: WithdrawalRequest[];
  devices: WeighingDevice[];
  auditLogs: AuditLog[];

  // Mutating Actions
  recordDeposit: (payload: {
    memberId: string;
    items: Array<{ categoryId: string; weightKg: number }>;
    paymentMethod: 'tabungan' | 'tunai';
    weighingStationId?: string;
    isIotVerified?: boolean;
  }) => { success: boolean; transaction?: DepositTransaction; error?: string };

  updateCategoryPrice: (
    categoryId: string,
    newBuyPrice: number,
    newSellPrice: number,
    reason: string
  ) => { success: boolean; error?: string };

  addMember: (data: Omit<Member, 'id' | 'memberCode' | 'registrationDate' | 'totalDepositCount' | 'totalWeightKg' | 'totalDepositValue' | 'walletBalance'>) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;

  requestWithdrawal: (memberId: string, amount: number, payoutMethod: 'tunai' | 'transfer_bank' | 'emoney', notes?: string) => { success: boolean; error?: string };
  processWithdrawal: (withdrawalId: string, approve: boolean, rejectionReason?: string) => { success: boolean; error?: string };

  recordCollectorSale: (payload: {
    collectorId: string;
    items: Array<{ categoryId: string; weightKg: number }>;
    paymentMethod: 'transfer' | 'tunai' | 'giro';
    vehicleNumber?: string;
    driverName?: string;
    notes?: string;
  }) => { success: boolean; sale?: CollectorSale; error?: string };

  adjustInventoryStock: (categoryId: string, quantityKgDelta: number, reason: string) => void;
  addOperationalExpense: (data: Omit<OperationalExpense, 'id' | 'expenseCode'>) => void;
  resetToDemoData: () => void;

  // IoT Live Simulator
  activeDeviceId: string;
  setActiveDeviceId: (id: string) => void;
  simulatedWeightKg: number;
  setSimulatedWeight: (kg: number) => void;
  scaleStabilityScore: number;
  isScaleStable: boolean;
  scaleState: ScaleState;
  setScaleState: (state: ScaleState) => void;
  tareScale: () => void;
  toggleDeviceStatus: (deviceId: string) => void;
  pushWeightSample: (targetKg: number, forceStable?: boolean) => void;

  // QR Member Identification
  scannedMemberId: string | null;
  setScannedMemberId: (id: string | null) => void;
  recordQrMemberScan: (member: Member, source: string) => void;

  // Backend & REST API Integration
  apiStatus: 'connecting' | 'online' | 'offline';
  apiLatencyMs: number;
  lastSyncedAt: string | null;
  apiRequestLogs: ApiRequestLog[];
  refreshFromBackend: () => Promise<void>;
  sendIotTelemetryWebhook: (payload?: {
    deviceCode?: string;
    weightKg?: number;
    isStable?: boolean;
  }) => Promise<{ success: boolean; message: string; statusCode: number }>;
  calibrateDeviceViaApi: (
    deviceId: string,
    referenceWeightKg: number,
    customFactor?: number
  ) => Promise<{ success: boolean; message: string; newFactor?: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'pilahin_app_data_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [branches] = useState<Branch[]>(initialBranches);
  const [currentBranchId, setCurrentBranchId] = useState<string>('b-01');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scannedMemberId, setScannedMemberId] = useState<string | null>(null);

  const currentUser = {
    id: 'op-01',
    name: 'Budi Santoso',
    role: 'Operator Petugas',
    email: 'budi.santoso@pilah.in',
  };

  // State initialization with localStorage fallback
  const [wasteCategories, setWasteCategories] = useState<WasteCategory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : initialWasteCategories;
  });

  const [priceHistory, setPriceHistory] = useState<CategoryPriceHistory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_price_history`);
    return saved ? JSON.parse(saved) : [];
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_members`);
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [deposits, setDeposits] = useState<DepositTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_deposits`);
    return saved ? JSON.parse(saved) : initialDeposits;
  });

  const [walletLedger, setWalletLedger] = useState<WalletLedgerEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ledger`);
    return saved ? JSON.parse(saved) : initialWalletLedger;
  });

  const [inventoryStocks, setInventoryStocks] = useState<InventoryStock[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_stocks`);
    return saved ? JSON.parse(saved) : initialInventoryStocks;
  });

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_movements`);
    return saved ? JSON.parse(saved) : initialInventoryMovements;
  });

  const [collectors] = useState<Collector[]>(initialCollectors);

  const [collectorSales, setCollectorSales] = useState<CollectorSale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sales`);
    return saved ? JSON.parse(saved) : initialCollectorSales;
  });

  const [expenses, setExpenses] = useState<OperationalExpense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_withdrawals`);
    return saved ? JSON.parse(saved) : initialWithdrawalRequests;
  });

  const [devices, setDevices] = useState<WeighingDevice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_devices`);
    return saved ? JSON.parse(saved) : initialDevices;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Timbangan IoT Terhubung',
      message: 'ESP32-SCALE-01 siap menerima penimbangan dengan stabilitas sinyal 94%.',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      deviceCode: 'ESP32-SCALE-01',
      actionTab: 'timbangan',
    },
    {
      id: 'notif-2',
      title: 'Stok Kardus Siap Angkut',
      message: 'Stok kardus telah mencapai 480 kg, direkomendasikan jadwal jemput pengepul.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      actionTab: 'penjualan',
    },
  ]);

  const [activeToastAlerts, setActiveToastAlerts] = useState<NotificationItem[]>([]);
  const [capacityWarningThresholdPct, setCapacityWarningThresholdPct] = useState<number>(80);
  const [capacityCriticalThresholdPct, setCapacityCriticalThresholdPct] = useState<number>(95);
  const [lastDeviceAlertZone, setLastDeviceAlertZone] = useState<Record<string, 'normal' | 'warning' | 'critical'>>({});

  // IoT Station state
  const [activeDeviceId, setActiveDeviceId] = useState<string>('dev-01');
  const [simulatedWeightKg, setSimulatedWeightKg] = useState<number>(0.0);
  const [weightWindow, setWeightWindow] = useState<number[]>([0, 0, 0, 0]);
  const [scaleStabilityScore, setScaleStabilityScore] = useState<number>(100);
  const [isScaleStable, setIsScaleStable] = useState<boolean>(true);
  const [scaleState, setScaleState] = useState<ScaleState>('IDLE');

  // Backend API Connection State
  const [apiStatus, setApiStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [apiLatencyMs, setApiLatencyMs] = useState<number>(8);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [apiRequestLogs, setApiRequestLogs] = useState<ApiRequestLog[]>([]);
  const [isHydratedFromApi, setIsHydratedFromApi] = useState<boolean>(false);

  const appendClientApiLog = (entry: Omit<ApiRequestLog, 'id' | 'timestamp'>) => {
    setApiRequestLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...prev.slice(0, 39),
    ]);
  };

  const refreshFromBackend = async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/bootstrap', {
        headers: { Accept: 'application/json' },
      });
      const latency = Math.max(1, Math.round(performance.now() - start));
      if (!res.ok) {
        setApiStatus('offline');
        return;
      }
      const json = await res.json();
      if (json && json.success && json.data) {
        const d = json.data;
        if (Array.isArray(d.wasteCategories)) setWasteCategories(d.wasteCategories);
        if (Array.isArray(d.priceHistory)) setPriceHistory(d.priceHistory);
        if (Array.isArray(d.members)) setMembers(d.members);
        if (Array.isArray(d.deposits)) setDeposits(d.deposits);
        if (Array.isArray(d.walletLedger)) setWalletLedger(d.walletLedger);
        if (Array.isArray(d.inventoryStocks)) setInventoryStocks(d.inventoryStocks);
        if (Array.isArray(d.inventoryMovements)) setInventoryMovements(d.inventoryMovements);
        if (Array.isArray(d.collectorSales)) setCollectorSales(d.collectorSales);
        if (Array.isArray(d.expenses)) setExpenses(d.expenses);
        if (Array.isArray(d.withdrawalRequests)) setWithdrawalRequests(d.withdrawalRequests);
        if (Array.isArray(d.devices)) setDevices(d.devices);
        if (Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
        if (Array.isArray(json.recentLogs)) setApiRequestLogs(json.recentLogs);
        setApiStatus('online');
        setApiLatencyMs(latency);
        setLastSyncedAt(json.updatedAt || new Date().toISOString());
        setIsHydratedFromApi(true);
      }
    } catch {
      setApiStatus('offline');
      setIsHydratedFromApi(true);
    }
  };

  // Initial Hydration from Express Backend (/api/bootstrap)
  useEffect(() => {
    refreshFromBackend();
  }, []);

  // Sync to localStorage AND Express Backend (/api/sync) on state mutations
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(wasteCategories));
      localStorage.setItem(`${STORAGE_KEY}_members`, JSON.stringify(members));
      localStorage.setItem(`${STORAGE_KEY}_deposits`, JSON.stringify(deposits));
      localStorage.setItem(`${STORAGE_KEY}_ledger`, JSON.stringify(walletLedger));
      localStorage.setItem(`${STORAGE_KEY}_stocks`, JSON.stringify(inventoryStocks));
      localStorage.setItem(`${STORAGE_KEY}_movements`, JSON.stringify(inventoryMovements));
      localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(collectorSales));
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${STORAGE_KEY}_withdrawals`, JSON.stringify(withdrawalRequests));
      localStorage.setItem(`${STORAGE_KEY}_devices`, JSON.stringify(devices));
      localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
      localStorage.setItem(`${STORAGE_KEY}_price_history`, JSON.stringify(priceHistory));
    } catch {
      // storage quota or private browsing mode
    }

    if (!isHydratedFromApi) return;

    const timer = setTimeout(async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/sync', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wasteCategories,
            priceHistory,
            members,
            deposits,
            walletLedger,
            inventoryStocks,
            inventoryMovements,
            collectorSales,
            expenses,
            withdrawalRequests,
            devices,
            auditLogs,
          }),
        });
        const latency = Math.max(1, Math.round(performance.now() - start));
        if (res.ok) {
          const data = await res.json();
          setApiStatus('online');
          setApiLatencyMs(latency);
          setLastSyncedAt(data.updatedAt || new Date().toISOString());
        }
      } catch {
        setApiStatus('offline');
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [
    isHydratedFromApi,
    wasteCategories,
    members,
    deposits,
    walletLedger,
    inventoryStocks,
    inventoryMovements,
    collectorSales,
    expenses,
    withdrawalRequests,
    devices,
    auditLogs,
    priceHistory,
  ]);

  const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0];

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setActiveToastAlerts([]);
  };

  const dismissToastAlert = (id: string) => {
    setActiveToastAlerts((prev) => prev.filter((t) => t.id !== id));
  };

  const setCapacityThresholds = (warningPct: number, criticalPct: number) => {
    const safeWarn = Math.max(50, Math.min(90, warningPct));
    const safeCrit = Math.max(safeWarn + 5, Math.min(100, criticalPct));
    setCapacityWarningThresholdPct(safeWarn);
    setCapacityCriticalThresholdPct(safeCrit);
  };

  const activeDeviceObj = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const currentCapacityPct =
    activeDeviceObj && activeDeviceObj.maxCapacityKg > 0
      ? Math.round((simulatedWeightKg / activeDeviceObj.maxCapacityKg) * 100)
      : 0;

  // IoT Simulation Methods with Real-Time Capacity Threshold Alerting
  const pushWeightSample = (targetKg: number, forceStable: boolean = false) => {
    setSimulatedWeightKg(targetKg);
    const newWindow = forceStable
      ? [targetKg, targetKg, targetKg, targetKg]
      : [...weightWindow.slice(1), targetKg];
    setWeightWindow(newWindow);
    const evalResult = evaluateWeightStability(newWindow, 0.05);
    const stable = forceStable || evalResult.isStable;
    setIsScaleStable(stable);
    setScaleStabilityScore(forceStable ? 100 : evalResult.stabilityScore);

    const activeDev = devices.find((d) => d.id === activeDeviceId) || devices[0];
    const maxCap = activeDev ? activeDev.maxCapacityKg : 150;
    const loadPct = maxCap > 0 ? Math.round((targetKg / maxCap) * 100) : 0;

    if (targetKg <= 0.01) {
      setScaleState('IDLE');
    } else if (loadPct >= 100) {
      setScaleState('OVERLOAD');
    } else if (stable) {
      setScaleState('STABLE');
    } else {
      setScaleState('MEASURING');
    }

    // Real-time Capacity Threshold Detection
    const prevZone = lastDeviceAlertZone[activeDev.id] || 'normal';
    let nextZone: 'normal' | 'warning' | 'critical' = 'normal';
    if (loadPct >= capacityCriticalThresholdPct) {
      nextZone = 'critical';
    } else if (loadPct >= capacityWarningThresholdPct) {
      nextZone = 'warning';
    }

    if (nextZone !== prevZone) {
      setLastDeviceAlertZone((prev) => ({ ...prev, [activeDev.id]: nextZone }));

      if (nextZone === 'critical') {
        const critNotif: NotificationItem = {
          id: `notif-cap-crit-${Date.now()}`,
          title: `Kapasitas Kritis (${loadPct}%): ${activeDev.deviceCode}`,
          message: `Beban pada ${activeDev.name.split(' (')[0]} mencapai ${targetKg.toFixed(1)} kg dari batas maksimal ${maxCap} kg (ambang kritis ≥${capacityCriticalThresholdPct}%). Segera proses atau kurangi beban.`,
          type: 'alert',
          timestamp: new Date().toISOString(),
          read: false,
          deviceCode: activeDev.deviceCode,
          capacityPct: loadPct,
          actionTab: 'timbangan',
        };
        setNotifications((prev) => [critNotif, ...prev]);
        setActiveToastAlerts((prev) => [critNotif, ...prev.slice(0, 2)]);
      } else if (nextZone === 'warning') {
        const warnNotif: NotificationItem = {
          id: `notif-cap-warn-${Date.now()}`,
          title: `Peringatan Kapasitas (${loadPct}%): ${activeDev.deviceCode}`,
          message: `Stasiun ${activeDev.deviceCode} mencapai ${targetKg.toFixed(1)} kg / ${maxCap} kg (melewati ambang peringatan ${capacityWarningThresholdPct}%).`,
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false,
          deviceCode: activeDev.deviceCode,
          capacityPct: loadPct,
          actionTab: 'timbangan',
        };
        setNotifications((prev) => [warnNotif, ...prev]);
        setActiveToastAlerts((prev) => [warnNotif, ...prev.slice(0, 2)]);
      }
    }
  };

  const tareScale = () => {
    pushWeightSample(0.0);
    setScaleState('IDLE');
    setLastDeviceAlertZone((prev) => ({ ...prev, [activeDeviceId]: 'normal' }));
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'TARE_SCALE',
        entityType: 'WeighingDevice',
        entityId: activeDeviceId,
        description: `Perintah TARE / Nol Timbangan berhasil dilakukan pada perangkat ${activeDeviceId}.`,
      },
      ...prev,
    ]);
  };

  const toggleDeviceStatus = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, status: d.status === 'online' ? 'offline' : 'online', lastHeartbeat: new Date().toISOString() }
          : d
      )
    );
  };

  // ATOMIC RECORD DEPOSIT
  const recordDeposit = (payload: {
    memberId: string;
    items: Array<{ categoryId: string; weightKg: number }>;
    paymentMethod: 'tabungan' | 'tunai';
    weighingStationId?: string;
    isIotVerified?: boolean;
  }) => {
    const member = members.find((m) => m.id === payload.memberId);
    if (!member) {
      return { success: false, error: 'Nasabah tidak ditemukan.' };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Setoran harus memiliki setidaknya satu jenis sampah.' };
    }

    // Generate unique idempotency transaction code
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const transactionCode = `TRX-${dateStr}-${randSuffix}`;

    // Duplicate check
    const existingCodes = deposits.map((d) => d.transactionCode);
    if (isDuplicateTransaction(existingCodes, transactionCode)) {
      return { success: false, error: 'Transaksi duplikat terdeteksi.' };
    }

    const depositId = `dep-${Date.now()}`;
    let totalWeight = 0;
    let totalValue = 0;

    // Snapshot prices for each item
    const depositItems: DepositItem[] = payload.items.map((item, idx) => {
      const cat = wasteCategories.find((c) => c.id === item.categoryId);
      const buyPrice = cat ? cat.buyPricePerKg : 0;
      const subtotal = calculateDepositSubtotal(item.weightKg, buyPrice);
      totalWeight += item.weightKg;
      totalValue += subtotal;

      return {
        id: `item-${Date.now()}-${idx}`,
        depositId,
        categoryId: item.categoryId,
        categoryName: cat ? cat.name : 'Unknown',
        weightKg: item.weightKg,
        pricePerKgSnapshot: buyPrice,
        subtotal,
      };
    });

    const newTransaction: DepositTransaction = {
      id: depositId,
      transactionCode,
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode,
      branchId: currentBranchId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      timestamp: now.toISOString(),
      items: depositItems,
      totalWeightKg: Number(totalWeight.toFixed(3)),
      totalValue,
      paymentMethod: payload.paymentMethod,
      status: 'completed',
      weighingStationId: payload.weighingStationId || activeDeviceId,
      isIotVerified: payload.isIotVerified || false,
    };

    // 1. Update Deposits
    setDeposits((prev) => [newTransaction, ...prev]);

    // 2. If tabungan, atomically append to Wallet Ledger & update member balance
    if (payload.paymentMethod === 'tabungan') {
      const ledgerEntry: WalletLedgerEntry = {
        id: `ledg-${Date.now()}`,
        memberId: member.id,
        referenceType: 'deposit',
        referenceId: depositId,
        referenceCode: transactionCode,
        timestamp: now.toISOString(),
        amount: totalValue,
        balanceBefore: member.walletBalance,
        balanceAfter: member.walletBalance + totalValue,
        operatorName: currentUser.name,
        description: `Setoran sampah: ${depositItems.map((i) => `${i.categoryName} (${i.weightKg} kg)`).join(', ')}`,
      };
      setWalletLedger((prev) => [ledgerEntry, ...prev]);

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                walletBalance: m.walletBalance + totalValue,
                totalDepositValue: m.totalDepositValue + totalValue,
                totalWeightKg: Number((m.totalWeightKg + totalWeight).toFixed(3)),
                totalDepositCount: m.totalDepositCount + 1,
              }
            : m
        )
      );
    } else {
      // Tunai: still update member statistics
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                totalDepositValue: m.totalDepositValue + totalValue,
                totalWeightKg: Number((m.totalWeightKg + totalWeight).toFixed(3)),
                totalDepositCount: m.totalDepositCount + 1,
              }
            : m
        )
      );
    }

    // 3. Update Inventory Stock and Movements
    const newMovements: InventoryMovement[] = depositItems.map((item) => {
      const currentStockObj = inventoryStocks.find((s) => s.categoryId === item.categoryId);
      const stockBefore = currentStockObj ? currentStockObj.currentStockKg : 0;
      const stockAfter = Number((stockBefore + item.weightKg).toFixed(3));

      return {
        id: `mov-${Date.now()}-${item.categoryId}`,
        timestamp: now.toISOString(),
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        movementType: 'deposit',
        referenceId: depositId,
        referenceCode: transactionCode,
        quantityKg: item.weightKg,
        stockBeforeKg: stockBefore,
        stockAfterKg: stockAfter,
        costPerKgSnapshot: item.pricePerKgSnapshot,
        totalValuationChange: item.subtotal,
        operatorName: currentUser.name,
        notes: payload.isIotVerified ? 'Tervalidasi Timbangan IoT' : 'Pencatatan manual',
      };
    });

    setInventoryMovements((prev) => [...newMovements, ...prev]);

    setInventoryStocks((prev) =>
      prev.map((stock) => {
        const matchingItem = depositItems.find((i) => i.categoryId === stock.categoryId);
        if (matchingItem) {
          const updatedStock = Number((stock.currentStockKg + matchingItem.weightKg).toFixed(3));
          return {
            ...stock,
            currentStockKg: updatedStock,
            availableStockKg: updatedStock - stock.reservedStockKg,
            estimatedValuation: Math.round(updatedStock * stock.avgBuyPricePerKg),
            lastMovementTimestamp: now.toISOString(),
          };
        }
        return stock;
      })
    );

    // 4. Audit Log
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: now.toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'CREATE_DEPOSIT',
        entityType: 'DepositTransaction',
        entityId: transactionCode,
        description: `Setoran nasabah ${member.fullName} (${member.memberCode}) berhasil dicatat. Total ${totalWeight.toFixed(2)} kg senilai Rp ${totalValue.toLocaleString('id-ID')}.`,
      },
      ...prev,
    ]);

    // 5. Add UI notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Setoran Berhasil Disimpan',
        message: `${member.fullName} menyetor ${totalWeight.toFixed(2)} kg (${payload.paymentMethod === 'tabungan' ? 'Saldo Tabungan Bertambah' : 'Pembayaran Tunai'}).`,
        type: 'success',
        timestamp: now.toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return { success: true, transaction: newTransaction };
  };

  // UPDATE CATEGORY PRICE WITH SNAPSHOT AUDIT
  const updateCategoryPrice = (
    categoryId: string,
    newBuyPrice: number,
    newSellPrice: number,
    reason: string
  ) => {
    const category = wasteCategories.find((c) => c.id === categoryId);
    if (!category) return { success: false, error: 'Kategori tidak ditemukan' };
    if (newBuyPrice <= 0 || newSellPrice <= 0) return { success: false, error: 'Harga harus lebih besar dari 0' };
    if (newSellPrice < newBuyPrice) return { success: false, error: 'Harga jual ke pengepul tidak boleh lebih rendah dari harga beli!' };

    const now = new Date();
    const historyEntry: CategoryPriceHistory = {
      id: `prc-${Date.now()}`,
      categoryId,
      previousBuyPrice: category.buyPricePerKg,
      newBuyPrice,
      previousSellPrice: category.sellPricePerKg,
      newSellPrice,
      changedBy: currentUser.name,
      reason,
      effectiveDate: now.toISOString(),
    };

    setPriceHistory((prev) => [historyEntry, ...prev]);

    setWasteCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              buyPricePerKg: newBuyPrice,
              sellPricePerKg: newSellPrice,
              lastUpdated: now.toISOString(),
            }
          : c
      )
    );

    // Also update average inventory valuation
    setInventoryStocks((prev) =>
      prev.map((s) =>
        s.categoryId === categoryId
          ? {
              ...s,
              avgBuyPricePerKg: newBuyPrice,
              estimatedValuation: Math.round(s.currentStockKg * newBuyPrice),
            }
          : s
      )
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: now.toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'UPDATE_PRICE',
        entityType: 'WasteCategory',
        entityId: category.code,
        description: `Penyesuaian harga ${category.name}: Beli Rp ${category.buyPricePerKg} -> Rp ${newBuyPrice}, Jual Rp ${category.sellPricePerKg} -> Rp ${newSellPrice}. Alasan: ${reason}`,
      },
      ...prev,
    ]);

    return { success: true };
  };

  // ADD MEMBER
  const addMember = (
    data: Omit<
      Member,
      | 'id'
      | 'memberCode'
      | 'registrationDate'
      | 'totalDepositCount'
      | 'totalWeightKg'
      | 'totalDepositValue'
      | 'walletBalance'
    >
  ) => {
    const nextNum = members.length + 1;
    const memberCode = `PLH-${String(nextNum).padStart(4, '0')}`;
    const newMember: Member = {
      ...data,
      id: `mem-${Date.now()}`,
      memberCode,
      registrationDate: new Date().toISOString().slice(0, 10),
      totalDepositCount: 0,
      totalWeightKg: 0,
      totalDepositValue: 0,
      walletBalance: 0,
    };

    setMembers((prev) => [newMember, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'CREATE_MEMBER',
        entityType: 'Member',
        entityId: memberCode,
        description: `Pendaftaran nasabah baru: ${newMember.fullName} (${memberCode}).`,
      },
      ...prev,
    ]);

    return newMember;
  };

  const updateMember = (id: string, data: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  // DIGITAL WALLET WITHDRAWAL WORKFLOW
  const requestWithdrawal = (
    memberId: string,
    amount: number,
    payoutMethod: 'tunai' | 'transfer_bank' | 'emoney',
    notes?: string
  ) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return { success: false, error: 'Nasabah tidak ditemukan' };
    if (amount <= 0) return { success: false, error: 'Nominal penarikan harus lebih dari 0' };
    if (amount > member.walletBalance) {
      return {
        success: false,
        error: `Saldo tidak mencukupi. Saldo saat ini: Rp ${member.walletBalance.toLocaleString('id-ID')}`,
      };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(10 + Math.random() * 90);
    const withdrawalCode = `WDR-${dateStr}-${randSuffix}`;

    const newRequest: WithdrawalRequest = {
      id: `wdr-${Date.now()}`,
      withdrawalCode,
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode,
      amount,
      requestDate: now.toISOString(),
      operatorName: currentUser.name,
      status: 'pending',
      payoutMethod,
      notes,
    };

    setWithdrawalRequests((prev) => [newRequest, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: now.toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'REQUEST_WITHDRAWAL',
        entityType: 'WithdrawalRequest',
        entityId: withdrawalCode,
        description: `Pengajuan penarikan saldo nasabah ${member.fullName} sebesar Rp ${amount.toLocaleString('id-ID')}. Status: Menunggu persetujuan.`,
      },
      ...prev,
    ]);

    return { success: true };
  };

  const processWithdrawal = (withdrawalId: string, approve: boolean, rejectionReason?: string) => {
    const request = withdrawalRequests.find((w) => w.id === withdrawalId);
    if (!request) return { success: false, error: 'Pengajuan tidak ditemukan' };
    if (request.status !== 'pending') return { success: false, error: 'Pengajuan sudah diproses' };

    const member = members.find((m) => m.id === request.memberId);
    if (!member) return { success: false, error: 'Nasabah tidak ditemukan' };

    const now = new Date();

    if (approve) {
      if (member.walletBalance < request.amount) {
        return { success: false, error: 'Saldo nasabah sudah tidak mencukupi untuk penarikan ini.' };
      }

      // 1. Update request
      setWithdrawalRequests((prev) =>
        prev.map((w) =>
          w.id === withdrawalId
            ? { ...w, status: 'approved', processedDate: now.toISOString(), operatorName: currentUser.name }
            : w
        )
      );

      // 2. Append to Wallet Ledger (Negative / Debit)
      const ledgerEntry: WalletLedgerEntry = {
        id: `ledg-${Date.now()}`,
        memberId: member.id,
        referenceType: 'withdrawal',
        referenceId: request.id,
        referenceCode: request.withdrawalCode,
        timestamp: now.toISOString(),
        amount: -request.amount,
        balanceBefore: member.walletBalance,
        balanceAfter: member.walletBalance - request.amount,
        operatorName: currentUser.name,
        description: `Pencairan tabungan via ${request.payoutMethod}: Rp ${request.amount.toLocaleString('id-ID')}`,
      };
      setWalletLedger((prev) => [ledgerEntry, ...prev]);

      // 3. Deduct Member balance
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, walletBalance: m.walletBalance - request.amount } : m
        )
      );

      // 4. Audit Log
      setAuditLogs((prev) => [
        {
          id: `aud-${Date.now()}`,
          timestamp: now.toISOString(),
          actor: currentUser.name,
          role: currentUser.role,
          action: 'APPROVE_WITHDRAWAL',
          entityType: 'WithdrawalRequest',
          entityId: request.withdrawalCode,
          description: `Persetujuan pencairan saldo Rp ${request.amount.toLocaleString('id-ID')} untuk ${member.fullName}.`,
        },
        ...prev,
      ]);
    } else {
      setWithdrawalRequests((prev) =>
        prev.map((w) =>
          w.id === withdrawalId
            ? {
                ...w,
                status: 'rejected',
                processedDate: now.toISOString(),
                operatorName: currentUser.name,
                rejectionReason: rejectionReason || 'Ditolak oleh verifikator.',
              }
            : w
        )
      );

      setAuditLogs((prev) => [
        {
          id: `aud-${Date.now()}`,
          timestamp: now.toISOString(),
          actor: currentUser.name,
          role: currentUser.role,
          action: 'REJECT_WITHDRAWAL',
          entityType: 'WithdrawalRequest',
          entityId: request.withdrawalCode,
          description: `Penolakan pencairan saldo nasabah ${member.fullName}. Alasan: ${rejectionReason}`,
        },
        ...prev,
      ]);
    }

    return { success: true };
  };

  // RECORD COLLECTOR SALE (PENJUALAN KE PENGEPUL)
  const recordCollectorSale = (payload: {
    collectorId: string;
    items: Array<{ categoryId: string; weightKg: number }>;
    paymentMethod: 'transfer' | 'tunai' | 'giro';
    vehicleNumber?: string;
    driverName?: string;
    notes?: string;
  }) => {
    const collector = collectors.find((c) => c.id === payload.collectorId);
    if (!collector) return { success: false, error: 'Pengepul tidak ditemukan' };

    // Validate available inventory
    for (const item of payload.items) {
      const stock = inventoryStocks.find((s) => s.categoryId === item.categoryId);
      if (!stock || stock.currentStockKg < item.weightKg) {
        return {
          success: false,
          error: `Stok tidak mencukupi untuk ${stock?.categoryName || item.categoryId}. Tersedia: ${stock?.currentStockKg || 0} kg`,
        };
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(10 + Math.random() * 90);
    const invoiceCode = `SLS-${dateStr}-${randSuffix}`;
    const saleId = `sale-${Date.now()}`;

    let totalWeight = 0;
    let totalCostAmount = 0;
    let totalSaleAmount = 0;

    const saleItems = payload.items.map((item, idx) => {
      const cat = wasteCategories.find((c) => c.id === item.categoryId);
      const costPrice = cat ? cat.buyPricePerKg : 0;
      const sellingPrice = cat ? cat.sellPricePerKg : 0;
      const totalCost = calculateDepositSubtotal(item.weightKg, costPrice);
      const totalRevenue = calculateDepositSubtotal(item.weightKg, sellingPrice);
      const grossMargin = totalRevenue - totalCost;

      totalWeight += item.weightKg;
      totalCostAmount += totalCost;
      totalSaleAmount += totalRevenue;

      return {
        id: `sitem-${Date.now()}-${idx}`,
        saleId,
        categoryId: item.categoryId,
        categoryName: cat ? cat.name : 'Unknown',
        weightKg: item.weightKg,
        costPricePerKg: costPrice,
        sellingPricePerKg: sellingPrice,
        totalCost,
        totalRevenue,
        grossMargin,
      };
    });

    const newSale: CollectorSale = {
      id: saleId,
      invoiceCode,
      collectorId: collector.id,
      collectorName: collector.companyName,
      timestamp: now.toISOString(),
      branchId: currentBranchId,
      operatorName: currentUser.name,
      items: saleItems,
      totalWeightKg: Number(totalWeight.toFixed(3)),
      totalCostAmount,
      totalSaleAmount,
      totalGrossMargin: totalSaleAmount - totalCostAmount,
      paymentStatus: 'paid',
      paymentMethod: payload.paymentMethod,
      vehicleNumber: payload.vehicleNumber,
      driverName: payload.driverName,
      notes: payload.notes,
    };

    // 1. Save Sale
    setCollectorSales((prev) => [newSale, ...prev]);

    // 2. Atomically deduct inventory & record movements
    const newMovements: InventoryMovement[] = saleItems.map((item) => {
      const currentStockObj = inventoryStocks.find((s) => s.categoryId === item.categoryId);
      const stockBefore = currentStockObj ? currentStockObj.currentStockKg : 0;
      const stockAfter = Number((stockBefore - item.weightKg).toFixed(3));

      return {
        id: `mov-${Date.now()}-${item.categoryId}`,
        timestamp: now.toISOString(),
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        movementType: 'collector_sale',
        referenceId: saleId,
        referenceCode: invoiceCode,
        quantityKg: -item.weightKg, // Negative for outflow
        stockBeforeKg: stockBefore,
        stockAfterKg: stockAfter,
        costPerKgSnapshot: item.costPricePerKg,
        totalValuationChange: -item.totalCost,
        operatorName: currentUser.name,
        notes: `Penjualan ke ${collector.companyName} (${invoiceCode})`,
      };
    });

    setInventoryMovements((prev) => [...newMovements, ...prev]);

    setInventoryStocks((prev) =>
      prev.map((stock) => {
        const itemSold = saleItems.find((i) => i.categoryId === stock.categoryId);
        if (itemSold) {
          const newQty = Number(Math.max(0, stock.currentStockKg - itemSold.weightKg).toFixed(3));
          return {
            ...stock,
            currentStockKg: newQty,
            availableStockKg: newQty - stock.reservedStockKg,
            estimatedValuation: Math.round(newQty * stock.avgBuyPricePerKg),
            lastMovementTimestamp: now.toISOString(),
          };
        }
        return stock;
      })
    );

    // 3. Audit log
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: now.toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'COLLECTOR_SALE',
        entityType: 'CollectorSale',
        entityId: invoiceCode,
        description: `Penjualan ke ${collector.companyName} (${totalWeight.toFixed(2)} kg). Pendapatan: Rp ${totalSaleAmount.toLocaleString('id-ID')}, Laba Kotor: Rp ${(totalSaleAmount - totalCostAmount).toLocaleString('id-ID')}.`,
      },
      ...prev,
    ]);

    return { success: true, sale: newSale };
  };

  // ADJUST INVENTORY STOCK
  const adjustInventoryStock = (categoryId: string, quantityKgDelta: number, reason: string) => {
    const stock = inventoryStocks.find((s) => s.categoryId === categoryId);
    if (!stock) return;

    const now = new Date();
    const stockBefore = stock.currentStockKg;
    const stockAfter = Number(Math.max(0, stockBefore + quantityKgDelta).toFixed(3));
    const movementType = quantityKgDelta >= 0 ? 'adjustment_plus' : 'adjustment_minus';
    const adjCode = `ADJ-${Date.now().toString().slice(-6)}`;

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      timestamp: now.toISOString(),
      categoryId,
      categoryName: stock.categoryName,
      movementType,
      referenceId: adjCode,
      referenceCode: adjCode,
      quantityKg: quantityKgDelta,
      stockBeforeKg: stockBefore,
      stockAfterKg: stockAfter,
      costPerKgSnapshot: stock.avgBuyPricePerKg,
      totalValuationChange: Math.round(quantityKgDelta * stock.avgBuyPricePerKg),
      operatorName: currentUser.name,
      notes: reason,
    };

    setInventoryMovements((prev) => [movement, ...prev]);

    setInventoryStocks((prev) =>
      prev.map((s) =>
        s.categoryId === categoryId
          ? {
              ...s,
              currentStockKg: stockAfter,
              availableStockKg: stockAfter - s.reservedStockKg,
              estimatedValuation: Math.round(stockAfter * s.avgBuyPricePerKg),
              lastMovementTimestamp: now.toISOString(),
            }
          : s
      )
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: now.toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'ADJUST_INVENTORY',
        entityType: 'InventoryStock',
        entityId: stock.categoryName,
        description: `Penyesuaian stok ${stock.categoryName}: ${quantityKgDelta > 0 ? '+' : ''}${quantityKgDelta} kg. Alasan: ${reason}.`,
      },
      ...prev,
    ]);
  };

  // OPERATIONAL EXPENSE
  const addOperationalExpense = (data: Omit<OperationalExpense, 'id' | 'expenseCode'>) => {
    const expCode = `EXP-${Date.now().toString().slice(-6)}`;
    const newExp: OperationalExpense = {
      ...data,
      id: `exp-${Date.now()}`,
      expenseCode: expCode,
    };

    setExpenses((prev) => [newExp, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUser.name,
        role: currentUser.role,
        action: 'ADD_EXPENSE',
        entityType: 'OperationalExpense',
        entityId: expCode,
        description: `Pencatatan beban operasional: ${data.description} (Rp ${data.amount.toLocaleString('id-ID')}).`,
      },
      ...prev,
    ]);
  };

  // RESET DEMO DATA
  const resetToDemoData = () => {
    localStorage.clear();
    setWasteCategories(initialWasteCategories);
    setMembers(initialMembers);
    setDeposits(initialDeposits);
    setWalletLedger(initialWalletLedger);
    setInventoryStocks(initialInventoryStocks);
    setInventoryMovements(initialInventoryMovements);
    setCollectorSales(initialCollectorSales);
    setExpenses(initialExpenses);
    setWithdrawalRequests(initialWithdrawalRequests);
    setDevices(initialDevices);
    setAuditLogs(initialAuditLogs);
    setPriceHistory([]);

    fetch('/api/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setLastSyncedAt(new Date().toISOString());
          appendClientApiLog({
            method: 'POST',
            endpoint: '/api/reset',
            statusCode: 200,
            latencyMs: 6,
            source: 'SYSTEM',
            summary: 'Reset database server ke kondisi awal standar unit',
          });
        }
      })
      .catch(() => {});
  };

  // SEND REAL IOT TELEMETRY WEBHOOK TO BACKEND (/api/iot/telemetry)
  const sendIotTelemetryWebhook = async (payload?: {
    deviceCode?: string;
    weightKg?: number;
    isStable?: boolean;
  }): Promise<{ success: boolean; message: string; statusCode: number }> => {
    const activeDev = devices.find((d) => d.id === activeDeviceId) || devices[0];
    const targetWeight =
      typeof payload?.weightKg === 'number'
        ? payload.weightKg
        : simulatedWeightKg > 0
        ? simulatedWeightKg
        : Number((8.5 + Math.random() * 14).toFixed(2));
    const targetDeviceCode = payload?.deviceCode || activeDev.deviceCode;
    const isStable = payload?.isStable ?? true;

    const start = performance.now();
    try {
      const res = await fetch('/api/iot/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hafi-Signature': 'sha256:pilahin-esp32-hmac-v2',
        },
        body: JSON.stringify({
          device_code: targetDeviceCode,
          timestamp: new Date().toISOString(),
          telemetry: {
            weight_kg: targetWeight,
            raw_adc: Math.round(targetWeight * 21540 + 820),
            is_stable: isStable,
            stability_score: isStable ? 99 : 72,
            battery_pct: activeDev.batteryLevel || 94,
            rssi_dbm: activeDev.signalStrengthDbm || -58,
            ambient_temp_c: 29.4,
          },
        }),
      });
      const latency = Math.max(1, Math.round(performance.now() - start));
      const data = await res.json();

      if (res.ok && data.success) {
        const httpStatus = res.status || 200;
        pushWeightSample(targetWeight, isStable);
        setApiStatus('online');
        setApiLatencyMs(latency);
        setLastSyncedAt(new Date().toISOString());
        appendClientApiLog({
          method: 'POST',
          endpoint: '/api/iot/telemetry',
          statusCode: httpStatus,
          latencyMs: latency,
          source: 'ESP32-NODE',
          summary: `Ingesti telemetri ${targetDeviceCode}: ${targetWeight.toFixed(2)} kg (Stabil 99%)`,
        });
        return {
          success: true,
          message: data.message || `Telemetri ${targetDeviceCode} (${targetWeight} kg) berhasil dikirim.`,
          statusCode: httpStatus,
        };
      }
      return {
        success: false,
        message: data.error || 'Gagal mengirim telemetri IoT.',
        statusCode: res.status || 400,
      };
    } catch {
      setApiStatus('offline');
      return {
        success: false,
        message: 'Tidak dapat terhubung ke endpoint /api/iot/telemetry.',
        statusCode: 503,
      };
    }
  };

  // CALIBRATE DEVICE VIA BACKEND API (/api/iot/calibrate)
  const calibrateDeviceViaApi = async (
    deviceId: string,
    referenceWeightKg: number,
    customFactor?: number
  ): Promise<{ success: boolean; message: string; newFactor?: number }> => {
    const start = performance.now();
    try {
      const res = await fetch('/api/iot/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          referenceWeightKg,
          measuredWeightKg: referenceWeightKg,
          customFactor,
        }),
      });
      const latency = Math.max(1, Math.round(performance.now() - start));
      const data = await res.json();

      if (res.ok && data.success) {
        const httpStatus = res.status || 200;
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  calibrationFactor: data.calibration.newFactor,
                  lastHeartbeat: new Date().toISOString(),
                }
              : d
          )
        );
        if (data.auditEntry) {
          setAuditLogs((prev) => [data.auditEntry, ...prev]);
        }
        setApiStatus('online');
        setApiLatencyMs(latency);
        setLastSyncedAt(new Date().toISOString());
        appendClientApiLog({
          method: 'POST',
          endpoint: '/api/iot/calibrate',
          statusCode: httpStatus,
          latencyMs: latency,
          source: 'ESP32-NODE',
          summary: `Kalibrasi sensor ${data.device?.deviceCode || deviceId}: Faktor ${data.calibration.newFactor}`,
        });
        return {
          success: true,
          message: `Kalibrasi REST API berhasil: Faktor baru ${data.calibration.newFactor} (Deviasi ${data.calibration.deviationPct}%).`,
          newFactor: data.calibration.newFactor,
        };
      }
      return {
        success: false,
        message: data.error || 'Gagal mengkalibrasi perangkat via API.',
      };
    } catch {
      return {
        success: false,
        message: 'Koneksi ke endpoint /api/iot/calibrate terputus.',
      };
    }
  };

  const recordQrMemberScan = (member: Member, source: string) => {
    setScannedMemberId(member.id);
    const nowIso = new Date().toISOString();
    setAuditLogs((prev) => [
      {
        id: `aud-qr-${Date.now()}`,
        timestamp: nowIso,
        actor: currentUser.name,
        role: currentUser.role,
        action: 'SCAN_MEMBER_QR',
        entityType: 'Member',
        entityId: member.memberCode,
        description: `Identifikasi Kartu QR Nasabah ${member.fullName} (${member.memberCode}) berhasil via ${source} — Dalam Naungan Hafi Digital.`,
      },
      ...prev,
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        branches,
        currentBranchId,
        setCurrentBranchId,
        currentBranch,
        currentUser,
        isDemoMode,
        setIsDemoMode,
        searchQuery,
        setSearchQuery,
        notifications,
        markNotificationAsRead,
        clearNotifications,
        activeToastAlerts,
        dismissToastAlert,
        capacityWarningThresholdPct,
        capacityCriticalThresholdPct,
        setCapacityThresholds,
        currentCapacityPct,
        wasteCategories,
        priceHistory,
        members,
        deposits,
        walletLedger,
        inventoryStocks,
        inventoryMovements,
        collectors,
        collectorSales,
        expenses,
        withdrawalRequests,
        devices,
        auditLogs,
        recordDeposit,
        updateCategoryPrice,
        addMember,
        updateMember,
        requestWithdrawal,
        processWithdrawal,
        recordCollectorSale,
        adjustInventoryStock,
        addOperationalExpense,
        resetToDemoData,
        activeDeviceId,
        setActiveDeviceId,
        simulatedWeightKg,
        setSimulatedWeight: pushWeightSample,
        scaleStabilityScore,
        isScaleStable,
        scaleState,
        setScaleState,
        tareScale,
        toggleDeviceStatus,
        pushWeightSample,
        scannedMemberId,
        setScannedMemberId,
        recordQrMemberScan,
        apiStatus,
        apiLatencyMs,
        lastSyncedAt,
        apiRequestLogs,
        refreshFromBackend,
        sendIotTelemetryWebhook,
        calibrateDeviceViaApi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
