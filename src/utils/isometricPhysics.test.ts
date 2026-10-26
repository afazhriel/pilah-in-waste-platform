import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeIsometricTilt,
  computeScaleIsometricMetrics,
  computeSiloIsometricHeights,
} from './isometricPhysics';

test('computeIsometricTilt: computes centered 0 tilt and clamps extreme pointer positions', () => {
  const rect = { left: 100, top: 100, width: 200, height: 100 };
  // Center pointer (200, 150) -> 0, 0
  const centered = computeIsometricTilt(200, 150, rect, 12);
  assert.deepEqual(centered, { rotateX: 0, rotateY: 0 });

  // Top-right corner (300, 100) -> rotateY = +12, rotateX = +12
  const topRight = computeIsometricTilt(300, 100, rect, 12);
  assert.deepEqual(topRight, { rotateX: 12, rotateY: 12 });

  // Out of bounds pointer clamps to maxDeg
  const clamped = computeIsometricTilt(900, -200, rect, 10);
  assert.deepEqual(clamped, { rotateX: 10, rotateY: 10 });

  // Zero-size rect returns 0 safely
  const zeroRect = computeIsometricTilt(50, 50, { left: 0, top: 0, width: 0, height: 0 }, 12);
  assert.deepEqual(zeroRect, { rotateX: 0, rotateY: 0 });
});

test('computeScaleIsometricMetrics: maps weight and thresholds to compression, layers, and severity', () => {
  // 0 kg idle
  const idle = computeScaleIsometricMetrics(0, 150, 80, 95);
  assert.equal(idle.compressionPx, 0);
  assert.equal(idle.cargoLayers, 0);
  assert.equal(idle.severity, 'idle');

  // 30 kg on 150 kg scale (20%) -> normal, 1 layer
  const normal = computeScaleIsometricMetrics(30, 150, 80, 95);
  assert.equal(normal.capacityPct, 20);
  assert.equal(normal.cargoLayers, 1);
  assert.equal(normal.severity, 'normal');
  assert.ok(normal.compressionPx >= 2);

  // 120 kg on 150 kg scale (80%) -> warning, 3 layers
  const warning = computeScaleIsometricMetrics(120, 150, 80, 95);
  assert.equal(warning.capacityPct, 80);
  assert.equal(warning.cargoLayers, 3);
  assert.equal(warning.severity, 'warning');
  assert.equal(warning.ledHex, '#F59E0B');

  // 145 kg on 150 kg scale (97%) -> critical, 3 layers
  const critical = computeScaleIsometricMetrics(145, 150, 80, 95);
  assert.equal(critical.capacityPct, 97);
  assert.equal(critical.cargoLayers, 3);
  assert.equal(critical.severity, 'critical');
  assert.equal(critical.ledHex, '#F43F5E');
});

test('computeSiloIsometricHeights: scales column heights proportionally and identifies dominant category', () => {
  const silos = computeSiloIsometricHeights(120, 180, 60, 48);
  assert.equal(silos.kertasHeightPx, 48);
  assert.ok(silos.plastikHeightPx < 48 && silos.plastikHeightPx > silos.logamHeightPx);
  assert.equal(silos.dominantCategory, 'Kertas & Kardus');
});
