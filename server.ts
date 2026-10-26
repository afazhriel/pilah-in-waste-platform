import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
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
} from './src/types/index';
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
} from './src/data/seedData';
import { calculateDepositSubtotal } from './src/utils/calculations';
import {
  validateTelemetryPayload,
  validateDepositPayload,
  validateCategoryPriceUpdate,
  computeCalibrationAdjustment,
  NormalizedTelemetryPayload,
} from './src/utils/apiPayload';

export interface ApiRequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  source: 'WEB-CLIENT' | 'ESP32-NODE' | 'SYSTEM';
  summary: string;
}

export interface PersistentDatabaseSchema {
  version: string;
  updatedAt: string;
  branches: Branch[];
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
  latestTelemetry: NormalizedTelemetryPayload;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'pilahin-db.json');

function createSeedDatabase(): PersistentDatabaseSchema {
  return {
    version: '2.1.0-hafi-digital',
    updatedAt: new Date().toISOString(),
    branches: structuredClone(initialBranches),
    wasteCategories: structuredClone(initialWasteCategories),
    priceHistory: [],
    members: structuredClone(initialMembers),
    deposits: structuredClone(initialDeposits),
    walletLedger: structuredClone(initialWalletLedger),
    inventoryStocks: structuredClone(initialInventoryStocks),
    inventoryMovements: structuredClone(initialInventoryMovements),
    collectors: structuredClone(initialCollectors),
    collectorSales: structuredClone(initialCollectorSales),
    expenses: structuredClone(initialExpenses),
    withdrawalRequests: structuredClone(initialWithdrawalRequests),
    devices: structuredClone(initialDevices),
    auditLogs: structuredClone(initialAuditLogs),
    latestTelemetry: {
      deviceCode: 'ESP32-SCALE-01',
      weightKg: 0.0,
      rawAdc: 820,
      isStable: true,
      stabilityScore: 100,
      batteryPct: 94,
      rssiDbm: -58,
      ambientTempC: 29.4,
      timestamp: new Date().toISOString(),
    },
  };
}

function loadDatabase(): PersistentDatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistentDatabaseSchema>;
      const seed = createSeedDatabase();
      return {
        ...seed,
        ...parsed,
        branches: parsed.branches?.length ? parsed.branches : seed.branches,
        wasteCategories: parsed.wasteCategories?.length ? parsed.wasteCategories : seed.wasteCategories,
        members: parsed.members?.length ? parsed.members : seed.members,
        devices: parsed.devices?.length ? parsed.devices : seed.devices,
        collectors: parsed.collectors?.length ? parsed.collectors : seed.collectors,
      };
    }
  } catch (err) {
    console.error('[Pilah.in DB] Failed to load existing DB, initializing seed:', err);
  }
  const initial = createSeedDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: PersistentDatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.updatedAt = new Date().toISOString();
    const tmpPath = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_FILE_PATH);
  } catch (err) {
    console.error('[Pilah.in DB] Failed to persist database:', err);
  }
}

let db: PersistentDatabaseSchema = loadDatabase();
const serverStartTime = Date.now();
const apiRequestLogs: ApiRequestLogEntry[] = [
  {
    id: `req-init-1`,
    timestamp: new Date().toISOString(),
    method: 'POST',
    endpoint: '/api/iot/telemetry',
    statusCode: 200,
    latencyMs: 4,
    source: 'ESP32-NODE',
    summary: 'Heartbeat ESP32-SCALE-01 (RSSI -58dBm, Baterai 94%)',
  },
];

function recordApiLog(entry: Omit<ApiRequestLogEntry, 'id' | 'timestamp'>) {
  apiRequestLogs.unshift({
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (apiRequestLogs.length > 40) {
    apiRequestLogs.length = 40;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Middleware to log API calls and measure latency
  app.use('/api', (req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
      // Avoid polluting logs with frequent polling of /api/health or /api/iot/logs unless it's a mutation or bootstrap
      const isPolledGet =
        req.method === 'GET' &&
        (req.path === '/health' || req.path === '/iot/logs' || req.path === '/iot/telemetry');
      if (!isPolledGet) {
        const latencyMs = Math.max(1, Math.round(performance.now() - start));
        const cleanSubPath = req.path.replace(/^\/api/, '');
        const fullEndpoint = `/api${cleanSubPath}`;
        const isEsp32 =
          cleanSubPath.startsWith('/iot') || Boolean(req.headers['x-hafi-signature']);
        recordApiLog({
          method: req.method,
          endpoint: fullEndpoint,
          statusCode: res.statusCode || 200,
          latencyMs,
          source: isEsp32 ? 'ESP32-NODE' : 'WEB-CLIENT',
          summary: `${req.method} ${fullEndpoint} -> HTTP ${res.statusCode || 200}`,
        });
      }
    });
    next();
  });

  // 1. GET /api/health
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'Pilah.in Smart Waste Banking & IoT API Gateway',
      patronage: 'Dalam Naungan Hafi Digital',
      version: db.version,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      updatedAt: db.updatedAt,
      storageEngine: 'Persistent JSON-WAL + PostgreSQL Schema Ready',
      metrics: {
        branches: db.branches.length,
        members: db.members.length,
        deposits: db.deposits.length,
        categories: db.wasteCategories.length,
        devicesOnline: db.devices.filter((d) => d.status === 'online').length,
        totalDevices: db.devices.length,
      },
      latestTelemetry: db.latestTelemetry,
      recentLogs: apiRequestLogs.slice(0, 15),
    });
  });

  // 2. GET /api/bootstrap - Hydrate complete application state
  app.get('/api/bootstrap', (_req, res) => {
    res.json({
      success: true,
      patronage: 'Dalam Naungan Hafi Digital',
      updatedAt: db.updatedAt,
      data: db,
      recentLogs: apiRequestLogs.slice(0, 20),
    });
  });

  // 3. PUT /api/sync - Atomic state synchronization from client mutations
  app.put('/api/sync', (req, res) => {
    const body = req.body as Partial<PersistentDatabaseSchema>;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ success: false, error: 'Payload sinkronisasi tidak valid.' });
      return;
    }

    if (Array.isArray(body.wasteCategories)) db.wasteCategories = body.wasteCategories;
    if (Array.isArray(body.priceHistory)) db.priceHistory = body.priceHistory;
    if (Array.isArray(body.members)) db.members = body.members;
    if (Array.isArray(body.deposits)) db.deposits = body.deposits;
    if (Array.isArray(body.walletLedger)) db.walletLedger = body.walletLedger;
    if (Array.isArray(body.inventoryStocks)) db.inventoryStocks = body.inventoryStocks;
    if (Array.isArray(body.inventoryMovements)) db.inventoryMovements = body.inventoryMovements;
    if (Array.isArray(body.collectorSales)) db.collectorSales = body.collectorSales;
    if (Array.isArray(body.expenses)) db.expenses = body.expenses;
    if (Array.isArray(body.withdrawalRequests)) db.withdrawalRequests = body.withdrawalRequests;
    if (Array.isArray(body.devices)) db.devices = body.devices;
    if (Array.isArray(body.auditLogs)) db.auditLogs = body.auditLogs;

    saveDatabase(db);
    res.json({
      success: true,
      updatedAt: db.updatedAt,
    });
  });

  // 4. GET & POST /api/iot/telemetry - Real ESP32 HX711 Hardware & Webhook Telemetry
  app.get('/api/iot/telemetry', (_req, res) => {
    res.json({
      success: true,
      telemetry: db.latestTelemetry,
      devices: db.devices,
    });
  });

  app.post('/api/iot/telemetry', (req, res) => {
    const validation = validateTelemetryPayload(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({
        success: false,
        error: validation.error || 'Payload telemetri ESP32 tidak valid.',
      });
      return;
    }

    const telemetry = validation.data;
    db.latestTelemetry = telemetry;

    // Update target device status & heartbeat
    db.devices = db.devices.map((dev) =>
      dev.deviceCode === telemetry.deviceCode
        ? {
            ...dev,
            status: 'online',
            lastHeartbeat: telemetry.timestamp,
            batteryLevel: telemetry.batteryPct,
            signalStrengthDbm: telemetry.rssiDbm,
          }
        : dev
    );

    saveDatabase(db);

    res.json({
      success: true,
      message: `Telemetri ${telemetry.deviceCode} (${telemetry.weightKg} kg) diterima oleh Pilah.in IoT Gateway.`,
      telemetry,
      device: db.devices.find((d) => d.deviceCode === telemetry.deviceCode) || db.devices[0],
    });
  });

  // 5. POST /api/iot/calibrate - Calibrate load cell sensor
  app.post('/api/iot/calibrate', (req, res) => {
    const { deviceId, deviceCode, referenceWeightKg, measuredWeightKg, customFactor } =
      req.body as {
        deviceId?: string;
        deviceCode?: string;
        referenceWeightKg?: number;
        measuredWeightKg?: number;
        customFactor?: number;
      };

    const targetDevice = db.devices.find(
      (d) => d.id === deviceId || d.deviceCode === deviceCode
    );
    if (!targetDevice) {
      res.status(404).json({ success: false, error: 'Perangkat timbangan tidak ditemukan.' });
      return;
    }

    const refKg = Number(referenceWeightKg) || 20.0;
    const measKg = Number(measuredWeightKg) || refKg;
    const calc = computeCalibrationAdjustment(refKg, measKg, targetDevice.calibrationFactor);
    const finalFactor =
      typeof customFactor === 'number' && Number.isFinite(customFactor) && customFactor > 0
        ? Number(customFactor.toFixed(4))
        : calc.newFactor;

    const oldFactor = targetDevice.calibrationFactor;
    targetDevice.calibrationFactor = finalFactor;
    targetDevice.lastHeartbeat = new Date().toISOString();

    const auditEntry: AuditLog = {
      id: `aud-cal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Budi Santoso',
      role: 'Operator Petugas',
      action: 'CALIBRATE_DEVICE',
      entityType: 'WeighingDevice',
      entityId: targetDevice.deviceCode,
      description: `Kalibrasi API sensor ${targetDevice.deviceCode} dengan beban acuan ${refKg} kg: Faktor ${oldFactor} -> ${finalFactor} (Deviasi ${calc.deviationPct}%).`,
    };
    db.auditLogs.unshift(auditEntry);

    saveDatabase(db);
    res.json({
      success: true,
      device: targetDevice,
      calibration: {
        oldFactor,
        newFactor: finalFactor,
        deviationPct: calc.deviationPct,
        referenceWeightKg: refKg,
      },
      auditEntry,
    });
  });

  // 6. POST /api/iot/tare - Tare / Zero Scale via API
  app.post('/api/iot/tare', (req, res) => {
    const { deviceId, deviceCode } = (req.body || {}) as {
      deviceId?: string;
      deviceCode?: string;
    };
    const targetDevice =
      db.devices.find((d) => d.id === deviceId || d.deviceCode === deviceCode) || db.devices[0];

    db.latestTelemetry = {
      ...db.latestTelemetry,
      deviceCode: targetDevice.deviceCode,
      weightKg: 0.0,
      rawAdc: 820,
      isStable: true,
      stabilityScore: 100,
      timestamp: new Date().toISOString(),
    };

    const auditEntry: AuditLog = {
      id: `aud-tare-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Budi Santoso',
      role: 'Operator Petugas',
      action: 'TARE_SCALE_API',
      entityType: 'WeighingDevice',
      entityId: targetDevice.deviceCode,
      description: `Perintah TARE / Reset Nol via REST API berhasil pada ${targetDevice.deviceCode}.`,
    };
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);

    res.json({
      success: true,
      deviceCode: targetDevice.deviceCode,
      telemetry: db.latestTelemetry,
    });
  });

  // 7. GET & POST /api/deposits - Server-validated atomic waste deposit
  app.get('/api/deposits', (_req, res) => {
    res.json({
      success: true,
      count: db.deposits.length,
      deposits: db.deposits,
    });
  });

  app.post('/api/deposits', (req, res) => {
    const validation = validateDepositPayload(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({
        success: false,
        error: validation.error || 'Payload setoran tidak valid.',
      });
      return;
    }

    const payload = validation.data;
    const member = db.members.find((m) => m.id === payload.memberId);
    if (!member) {
      res.status(404).json({ success: false, error: 'Nasabah tidak ditemukan.' });
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const transactionCode = `TRX-${dateStr}-${randSuffix}`;
    const depositId = `dep-${Date.now()}`;

    let totalWeight = 0;
    let totalValue = 0;

    const depositItems: DepositItem[] = payload.items.map((item, idx) => {
      const cat = db.wasteCategories.find((c) => c.id === item.categoryId);
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
      branchId: member.branchId || 'b-01',
      operatorId: 'op-01',
      operatorName: 'Budi Santoso',
      timestamp: now.toISOString(),
      items: depositItems,
      totalWeightKg: Number(totalWeight.toFixed(3)),
      totalValue,
      paymentMethod: payload.paymentMethod,
      status: 'completed',
      weighingStationId: payload.weighingStationId || 'dev-01',
      isIotVerified: payload.isIotVerified,
    };

    db.deposits.unshift(newTransaction);

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
        operatorName: 'Budi Santoso',
        description: `Setoran API: ${depositItems.map((i) => `${i.categoryName} (${i.weightKg} kg)`).join(', ')}`,
      };
      db.walletLedger.unshift(ledgerEntry);
      member.walletBalance += totalValue;
    }

    member.totalDepositValue += totalValue;
    member.totalWeightKg = Number((member.totalWeightKg + totalWeight).toFixed(3));
    member.totalDepositCount += 1;

    for (const item of depositItems) {
      const stockObj = db.inventoryStocks.find((s) => s.categoryId === item.categoryId);
      const stockBefore = stockObj ? stockObj.currentStockKg : 0;
      const stockAfter = Number((stockBefore + item.weightKg).toFixed(3));

      db.inventoryMovements.unshift({
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
        operatorName: 'Budi Santoso',
        notes: payload.isIotVerified ? 'Tervalidasi Timbangan IoT (API)' : 'Pencatatan REST API',
      });

      if (stockObj) {
        stockObj.currentStockKg = stockAfter;
        stockObj.availableStockKg = stockAfter - stockObj.reservedStockKg;
        stockObj.estimatedValuation = Math.round(stockAfter * stockObj.avgBuyPricePerKg);
        stockObj.lastMovementTimestamp = now.toISOString();
      }
    }

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now.toISOString(),
      actor: 'Budi Santoso',
      role: 'Operator Petugas',
      action: 'CREATE_DEPOSIT_API',
      entityType: 'DepositTransaction',
      entityId: transactionCode,
      description: `Setoran via REST API untuk ${member.fullName} (${member.memberCode}): ${totalWeight.toFixed(2)} kg senilai Rp ${totalValue.toLocaleString('id-ID')}.`,
    });

    saveDatabase(db);
    res.status(201).json({
      success: true,
      transaction: newTransaction,
      member,
    });
  });

  // 8. GET & POST /api/members
  app.get('/api/members', (_req, res) => {
    res.json({
      success: true,
      count: db.members.length,
      members: db.members,
    });
  });

  app.post('/api/members', (req, res) => {
    const body = req.body as Partial<Member>;
    if (!body || !body.fullName || !body.phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'Nama lengkap (fullName) dan nomor telepon (phoneNumber) wajib diisi.',
      });
      return;
    }

    const nextNum = db.members.length + 1;
    const memberCode = body.memberCode || `PLH-${String(nextNum).padStart(4, '0')}`;
    const newMember: Member = {
      id: body.id || `mem-${Date.now()}`,
      memberCode,
      nik: body.nik || '',
      fullName: body.fullName,
      phoneNumber: body.phoneNumber,
      address: body.address || 'Jl. Lingkungan Unit Bank Sampah',
      rtRw: body.rtRw || 'RT 01 / RW 01',
      kelurahan: body.kelurahan || 'Sukamaju',
      branchId: body.branchId || 'b-01',
      registrationDate: body.registrationDate || new Date().toISOString().slice(0, 10),
      status: body.status || 'active',
      totalDepositCount: 0,
      totalWeightKg: 0,
      totalDepositValue: 0,
      walletBalance: 0,
      notes: body.notes || '',
    };

    db.members.unshift(newMember);
    db.auditLogs.unshift({
      id: `aud-mem-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Budi Santoso',
      role: 'Operator Petugas',
      action: 'CREATE_MEMBER_API',
      entityType: 'Member',
      entityId: memberCode,
      description: `Pendaftaran nasabah baru via API: ${newMember.fullName} (${memberCode}).`,
    });

    saveDatabase(db);
    res.status(201).json({
      success: true,
      member: newMember,
    });
  });

  // 9. GET & PUT /api/categories/:id
  app.get('/api/categories', (_req, res) => {
    res.json({
      success: true,
      categories: db.wasteCategories,
      priceHistory: db.priceHistory,
    });
  });

  app.put('/api/categories/:id', (req, res) => {
    const categoryId = req.params.id;
    const category = db.wasteCategories.find((c) => c.id === categoryId);
    if (!category) {
      res.status(404).json({ success: false, error: 'Kategori sampah tidak ditemukan.' });
      return;
    }

    const validation = validateCategoryPriceUpdate(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const { newBuyPrice, newSellPrice, reason } = validation.data;
    const nowIso = new Date().toISOString();

    const historyEntry: CategoryPriceHistory = {
      id: `prc-${Date.now()}`,
      categoryId,
      previousBuyPrice: category.buyPricePerKg,
      newBuyPrice,
      previousSellPrice: category.sellPricePerKg,
      newSellPrice,
      changedBy: 'Budi Santoso',
      reason,
      effectiveDate: nowIso,
    };

    db.priceHistory.unshift(historyEntry);
    category.buyPricePerKg = newBuyPrice;
    category.sellPricePerKg = newSellPrice;
    category.lastUpdated = nowIso;

    db.inventoryStocks = db.inventoryStocks.map((s) =>
      s.categoryId === categoryId
        ? {
            ...s,
            avgBuyPricePerKg: newBuyPrice,
            estimatedValuation: Math.round(s.currentStockKg * newBuyPrice),
          }
        : s
    );

    db.auditLogs.unshift({
      id: `aud-prc-${Date.now()}`,
      timestamp: nowIso,
      actor: 'Budi Santoso',
      role: 'Operator Petugas',
      action: 'UPDATE_PRICE_API',
      entityType: 'WasteCategory',
      entityId: category.code,
      description: `Update harga API ${category.name}: Beli Rp ${newBuyPrice}/kg, Jual Rp ${newSellPrice}/kg (${reason}).`,
    });

    saveDatabase(db);
    res.json({
      success: true,
      category,
      historyEntry,
    });
  });

  // 10. GET /api/iot/logs - Recent API & Webhook request logs
  app.get('/api/iot/logs', (_req, res) => {
    res.json({
      success: true,
      logs: apiRequestLogs,
    });
  });

  // 11. POST /api/reset - Reset server database to factory seed
  app.post('/api/reset', (_req, res) => {
    db = createSeedDatabase();
    saveDatabase(db);
    recordApiLog({
      method: 'POST',
      endpoint: '/api/reset',
      statusCode: 200,
      latencyMs: 5,
      source: 'SYSTEM',
      summary: 'Reset database server ke data standar unit kerja',
    });
    res.json({
      success: true,
      message: 'Database server berhasil dipulihkan ke kondisi awal.',
      data: db,
    });
  });

  // Mount Vite dev server middleware or static production build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pilah.in Backend API] Server running on http://0.0.0.0:${PORT} (Dalam Naungan Hafi Digital)`);
  });
}

startServer();
