import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTelemetryPayload,
  validateDepositPayload,
  validateCategoryPriceUpdate,
  computeCalibrationAdjustment,
  formatApiEndpointCurl,
} from './apiPayload';

test('validateTelemetryPayload parses nested ESP32 firmware telemetry correctly', () => {
  const result = validateTelemetryPayload({
    device_code: 'ESP32-SCALE-01',
    telemetry: {
      weight_kg: 18.4567,
      raw_adc: 398400,
      is_stable: true,
      stability_score: 98,
      battery_pct: 92,
      rssi_dbm: -56,
    },
  });

  assert.equal(result.valid, true);
  assert.equal(result.data?.deviceCode, 'ESP32-SCALE-01');
  assert.equal(result.data?.weightKg, 18.457);
  assert.equal(result.data?.rawAdc, 398400);
  assert.equal(result.data?.isStable, true);
  assert.equal(result.data?.stabilityScore, 98);
});

test('validateTelemetryPayload rejects negative or out-of-range weights', () => {
  const neg = validateTelemetryPayload({ device_code: 'ESP32-SCALE-01', weight_kg: -5 });
  assert.equal(neg.valid, false);

  const huge = validateTelemetryPayload({ device_code: 'ESP32-SCALE-01', weight_kg: 2500 });
  assert.equal(huge.valid, false);
});

test('validateDepositPayload validates valid deposit and rejects invalid ones', () => {
  const valid = validateDepositPayload({
    memberId: 'mem-001',
    paymentMethod: 'tabungan',
    isIotVerified: true,
    items: [
      { categoryId: 'cat-pet', weightKg: 12.5 },
      { categoryId: 'cat-kardus', weightKg: 8.25 },
    ],
  });

  assert.equal(valid.valid, true);
  assert.equal(valid.data?.items.length, 2);
  assert.equal(valid.data?.items[0].weightKg, 12.5);

  const emptyItems = validateDepositPayload({
    memberId: 'mem-001',
    paymentMethod: 'tabungan',
    items: [],
  });
  assert.equal(emptyItems.valid, false);
});

test('validateCategoryPriceUpdate enforces sellPrice >= buyPrice', () => {
  const bad = validateCategoryPriceUpdate({
    newBuyPrice: 6000,
    newSellPrice: 5000,
    reason: 'Salah input',
  });
  assert.equal(bad.valid, false);

  const good = validateCategoryPriceUpdate({
    newBuyPrice: 4800,
    newSellPrice: 7200,
    reason: 'Kenaikan harga pabrik daur ulang',
  });
  assert.equal(good.valid, true);
  assert.equal(good.data?.newBuyPrice, 4800);
  assert.equal(good.data?.newSellPrice, 7200);
});

test('computeCalibrationAdjustment calculates accurate factor and deviation percentage', () => {
  const res = computeCalibrationAdjustment(20.0, 19.8, 1.0);
  assert.equal(res.newFactor, 1.0101);
  assert.equal(res.deviationPct, 1.0);
  assert.equal(res.isWithinTolerance, true);
});

test('formatApiEndpointCurl generates valid cURL snippet', () => {
  const snippet = formatApiEndpointCurl(
    'http://localhost:3000',
    '/api/iot/telemetry',
    'POST',
    { device_code: 'ESP32-SCALE-01', weight_kg: 12.4 }
  );
  assert.ok(snippet.includes('curl -X POST "http://localhost:3000/api/iot/telemetry"'));
  assert.ok(snippet.includes('ESP32-SCALE-01'));
});
