/**
 * Pure math and state helpers for Interactive 3D Isometric Illustrations
 * in OverviewDashboard and Main Navigation (Pilah.in · Dalam Naungan Hafi Digital).
 */

export interface IsometricTilt {
  rotateX: number;
  rotateY: number;
}

export interface IsometricScaleMetrics {
  compressionPx: number;
  cargoLayers: number;
  capacityPct: number;
  severity: 'idle' | 'normal' | 'warning' | 'critical';
  ledHex: string;
}

export interface IsometricSiloHeights {
  plastikHeightPx: number;
  kertasHeightPx: number;
  logamHeightPx: number;
  dominantCategory: 'Plastik' | 'Kertas & Kardus' | 'Logam & Kaca';
}

/**
 * Calculates clamped 3D perspective tilt angles (rotateX, rotateY) from pointer coordinates.
 */
export function computeIsometricTilt(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  maxDeg: number = 12
): IsometricTilt {
  if (rect.width <= 0 || rect.height <= 0 || maxDeg <= 0) {
    return { rotateX: 0, rotateY: 0 };
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const normX = (clientX - centerX) / (rect.width / 2);
  const normY = (clientY - centerY) / (rect.height / 2);

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const rotateY = Number(clamp(normX * maxDeg, -maxDeg, maxDeg).toFixed(2));
  const rotateX = Number(clamp(-normY * maxDeg, -maxDeg, maxDeg).toFixed(2));

  return {
    rotateX: Object.is(rotateX, -0) ? 0 : rotateX,
    rotateY: Object.is(rotateY, -0) ? 0 : rotateY,
  };
}

/**
 * Derives 3D isometric weighing platform compression, cargo cube layer count,
 * and LED perimeter status from live sensor weight and capacity thresholds.
 */
export function computeScaleIsometricMetrics(
  weightKg: number,
  maxCapacityKg: number,
  warningThresholdPct: number = 80,
  criticalThresholdPct: number = 95
): IsometricScaleMetrics {
  const safeMax = Math.max(1, maxCapacityKg);
  const safeWeight = Math.max(0, weightKg);
  const rawPct = Math.round((safeWeight / safeMax) * 100);
  const capacityPct = Math.min(100, Math.max(0, rawPct));

  const compressionPx =
    safeWeight <= 0.01
      ? 0
      : Math.min(12, Math.max(2, Math.round((safeWeight / safeMax) * 12)));

  let cargoLayers = 0;
  if (safeWeight > 0.01 && capacityPct < 35) {
    cargoLayers = 1;
  } else if (capacityPct >= 35 && capacityPct < 75) {
    cargoLayers = 2;
  } else if (capacityPct >= 75) {
    cargoLayers = 3;
  }

  let severity: IsometricScaleMetrics['severity'] = 'idle';
  let ledHex = '#38BDF8'; // Sky blue idle

  if (safeWeight > 0.01) {
    if (capacityPct >= criticalThresholdPct) {
      severity = 'critical';
      ledHex = '#F43F5E'; // Rose critical
    } else if (capacityPct >= warningThresholdPct) {
      severity = 'warning';
      ledHex = '#F59E0B'; // Amber warning
    } else {
      severity = 'normal';
      ledHex = '#10B981'; // Emerald active/nominal
    }
  }

  return {
    compressionPx,
    cargoLayers,
    capacityPct,
    severity,
    ledHex,
  };
}

/**
 * Computes proportional 3D isometric silo pillar heights for warehouse material visualization.
 */
export function computeSiloIsometricHeights(
  plastikKg: number,
  kertasKg: number,
  logamKg: number,
  maxColumnHeightPx: number = 48
): IsometricSiloHeights {
  const p = Math.max(0, plastikKg);
  const k = Math.max(0, kertasKg);
  const l = Math.max(0, logamKg);
  const maxVal = Math.max(1, p, k, l);
  const minFloorPx = 10;

  const scale = (v: number) =>
    v <= 0
      ? minFloorPx
      : Math.round(minFloorPx + (v / maxVal) * (maxColumnHeightPx - minFloorPx));

  let dominantCategory: IsometricSiloHeights['dominantCategory'] = 'Plastik';
  if (k >= p && k >= l) {
    dominantCategory = 'Kertas & Kardus';
  } else if (l >= p && l >= k) {
    dominantCategory = 'Logam & Kaca';
  }

  return {
    plastikHeightPx: scale(p),
    kertasHeightPx: scale(k),
    logamHeightPx: scale(l),
    dominantCategory,
  };
}
