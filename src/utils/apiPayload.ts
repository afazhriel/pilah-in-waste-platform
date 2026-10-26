export interface NormalizedTelemetryPayload {
  deviceCode: string;
  weightKg: number;
  rawAdc: number;
  isStable: boolean;
  stabilityScore: number;
  batteryPct: number;
  rssiDbm: number;
  ambientTempC: number;
  timestamp: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates and normalizes incoming ESP32 / HTTP Webhook IoT scale telemetry payload.
 * Supports both snake_case firmware payloads and camelCase web payloads.
 */
export function validateTelemetryPayload(
  payload: unknown
): ValidationResult<NormalizedTelemetryPayload> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload telemetri harus berupa objek JSON.' };
  }

  const raw = payload as Record<string, unknown>;
  const nestedTelemetry =
    raw.telemetry && typeof raw.telemetry === 'object'
      ? (raw.telemetry as Record<string, unknown>)
      : raw;

  const deviceCode = String(
    raw.device_code ?? raw.deviceCode ?? nestedTelemetry.device_code ?? 'ESP32-SCALE-01'
  ).trim();

  if (!deviceCode) {
    return { valid: false, error: 'Kode perangkat (device_code) wajib diisi.' };
  }

  const rawWeight = Number(
    nestedTelemetry.weight_kg ?? nestedTelemetry.weightKg ?? raw.weight_kg ?? raw.weightKg
  );

  if (!Number.isFinite(rawWeight) || rawWeight < 0 || rawWeight > 1000) {
    return {
      valid: false,
      error: 'Berat timbangan (weight_kg) harus berupa angka valid antara 0 hingga 1000 kg.',
    };
  }

  const weightKg = Number(rawWeight.toFixed(3));
  const rawAdc = Number.isFinite(Number(nestedTelemetry.raw_adc ?? nestedTelemetry.rawAdc))
    ? Math.round(Number(nestedTelemetry.raw_adc ?? nestedTelemetry.rawAdc))
    : Math.round(weightKg * 21540 + 820);

  const isStable =
    typeof nestedTelemetry.is_stable === 'boolean'
      ? nestedTelemetry.is_stable
      : typeof nestedTelemetry.isStable === 'boolean'
      ? nestedTelemetry.isStable
      : true;

  const rawScore = Number(
    nestedTelemetry.stability_score ?? nestedTelemetry.stabilityScore ?? (isStable ? 99 : 65)
  );
  const stabilityScore = Math.max(0, Math.min(100, Math.round(Number.isFinite(rawScore) ? rawScore : 99)));

  const batteryPct = Math.max(
    1,
    Math.min(100, Math.round(Number(nestedTelemetry.battery_pct ?? nestedTelemetry.batteryPct ?? 94)))
  );

  const rssiDbm = Math.round(Number(nestedTelemetry.rssi_dbm ?? nestedTelemetry.rssiDbm ?? -58));
  const ambientTempC = Number(
    Number(nestedTelemetry.ambient_temp_c ?? nestedTelemetry.ambientTempC ?? 29.4).toFixed(1)
  );

  return {
    valid: true,
    data: {
      deviceCode,
      weightKg,
      rawAdc,
      isStable,
      stabilityScore,
      batteryPct,
      rssiDbm,
      ambientTempC,
      timestamp:
        typeof raw.timestamp === 'string' && raw.timestamp.trim()
          ? raw.timestamp
          : new Date().toISOString(),
    },
  };
}

export interface ValidatedDepositRequest {
  memberId: string;
  items: Array<{ categoryId: string; weightKg: number }>;
  paymentMethod: 'tabungan' | 'tunai';
  weighingStationId?: string;
  isIotVerified: boolean;
}

/**
 * Validates incoming deposit transaction payload for POST /api/deposits.
 */
export function validateDepositPayload(
  payload: unknown
): ValidationResult<ValidatedDepositRequest> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload setoran tidak valid.' };
  }

  const body = payload as Record<string, unknown>;
  const memberId = typeof body.memberId === 'string' ? body.memberId.trim() : '';
  if (!memberId) {
    return { valid: false, error: 'ID Nasabah (memberId) wajib diisi.' };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { valid: false, error: 'Daftar item sampah (items) tidak boleh kosong.' };
  }

  const normalizedItems: Array<{ categoryId: string; weightKg: number }> = [];
  for (const rawItem of body.items) {
    if (!rawItem || typeof rawItem !== 'object') {
      return { valid: false, error: 'Format item setoran tidak valid.' };
    }
    const itemObj = rawItem as Record<string, unknown>;
    const categoryId = typeof itemObj.categoryId === 'string' ? itemObj.categoryId.trim() : '';
    const weightKg = Number(itemObj.weightKg);

    if (!categoryId) {
      return { valid: false, error: 'Setiap item wajib memiliki categoryId.' };
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1000) {
      return {
        valid: false,
        error: `Berat item untuk kategori ${categoryId} harus lebih besar dari 0 kg.`,
      };
    }

    normalizedItems.push({
      categoryId,
      weightKg: Number(weightKg.toFixed(3)),
    });
  }

  const paymentMethod =
    body.paymentMethod === 'tunai' ? 'tunai' : body.paymentMethod === 'tabungan' ? 'tabungan' : null;
  if (!paymentMethod) {
    return {
      valid: false,
      error: "Metode pembayaran harus 'tabungan' atau 'tunai'.",
    };
  }

  return {
    valid: true,
    data: {
      memberId,
      items: normalizedItems,
      paymentMethod,
      weighingStationId:
        typeof body.weighingStationId === 'string' ? body.weighingStationId : undefined,
      isIotVerified: Boolean(body.isIotVerified),
    },
  };
}

/**
 * Validates waste category price update payload for PUT /api/categories/:id.
 */
export function validateCategoryPriceUpdate(payload: unknown): ValidationResult<{
  newBuyPrice: number;
  newSellPrice: number;
  reason: string;
}> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload perubahan harga tidak valid.' };
  }

  const body = payload as Record<string, unknown>;
  const newBuyPrice = Math.round(Number(body.newBuyPrice));
  const newSellPrice = Math.round(Number(body.newSellPrice));
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!Number.isFinite(newBuyPrice) || newBuyPrice <= 0) {
    return { valid: false, error: 'Harga beli nasabah harus lebih besar dari Rp 0.' };
  }
  if (!Number.isFinite(newSellPrice) || newSellPrice <= 0) {
    return { valid: false, error: 'Harga jual pengepul harus lebih besar dari Rp 0.' };
  }
  if (newSellPrice < newBuyPrice) {
    return {
      valid: false,
      error: 'Harga jual ke pengepul tidak boleh lebih rendah dari harga beli nasabah.',
    };
  }

  return {
    valid: true,
    data: {
      newBuyPrice,
      newSellPrice,
      reason: reason || 'Penyesuaian harga pasar berkala via API',
    },
  };
}

/**
 * Computes new load-cell calibration multiplier and sensor deviation percentage.
 */
export function computeCalibrationAdjustment(
  referenceWeightKg: number,
  measuredWeightKg: number,
  currentFactor: number
): {
  newFactor: number;
  deviationPct: number;
  isWithinTolerance: boolean;
} {
  if (
    !Number.isFinite(referenceWeightKg) ||
    referenceWeightKg <= 0 ||
    !Number.isFinite(measuredWeightKg) ||
    measuredWeightKg <= 0 ||
    !Number.isFinite(currentFactor) ||
    currentFactor <= 0
  ) {
    return {
      newFactor: 1.0,
      deviationPct: 0,
      isWithinTolerance: true,
    };
  }

  const ratio = referenceWeightKg / measuredWeightKg;
  const newFactor = Number((currentFactor * ratio).toFixed(4));
  const deviationPct = Number(
    (Math.abs(measuredWeightKg - referenceWeightKg) / referenceWeightKg * 100).toFixed(2)
  );

  return {
    newFactor,
    deviationPct,
    isWithinTolerance: deviationPct <= 2.0,
  };
}

/**
 * Generates a ready-to-copy cURL command for testing Pilah.in Backend API endpoints.
 */
export function formatApiEndpointCurl(
  baseUrl: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH',
  sampleBody?: Record<string, unknown>
): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (method === 'GET' || !sampleBody) {
    return `curl -X ${method} "${cleanBase}${cleanPath}" -H "Accept: application/json"`;
  }
  return `curl -X ${method} "${cleanBase}${cleanPath}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Hafi-Signature: pilahin-iot-v2" \\\n  -d '${JSON.stringify(sampleBody)}'`;
}
