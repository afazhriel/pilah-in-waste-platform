import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Sparkles, ArrowUpRight, RotateCcw } from 'lucide-react';
import { ScaleState } from '../../types';
import { NavTab } from '../../context/AppContext';
import {
  computeIsometricTilt,
  computeScaleIsometricMetrics,
  computeSiloIsometricHeights,
} from '../../utils/isometricPhysics';
import { formatIDR, formatWeight } from '../../utils/formatters';

export type IsometricNodeId = 'timbangan' | 'inventaris' | 'setoran' | 'tabungan';

export interface IsometricEcosystemProps {
  weightKg: number;
  maxCapacityKg: number;
  warningThresholdPct: number;
  criticalThresholdPct: number;
  scaleState: ScaleState;
  isStable: boolean;
  plastikStockKg: number;
  kertasStockKg: number;
  logamStockKg: number;
  activeMembersCount: number;
  todayDepositsCount: number;
  totalWalletBalance: number;
  onSelectModule: (tab: NavTab) => void;
}

/**
 * Interactive 3D Isometric Brand Emblem for Main Navigation (Navbar & Sidebar).
 * Multi-layered isometric cube that tilts and elevates its layers on hover.
 */
export const IsometricBrandEmblem3D: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}> = ({ size = 'md', isActive = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const dims =
    size === 'sm'
      ? 'h-7 w-7'
      : size === 'lg'
      ? 'h-10 w-10'
      : 'h-8 w-8';

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        rotateX: isHovered ? 14 : 0,
        rotateY: isHovered ? -16 : 0,
        scale: isHovered ? 1.06 : 1,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      style={{ perspective: '400px', transformStyle: 'preserve-3d' }}
      className={`relative ${dims} flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0B192C] via-[#0C2D57] to-[#009CAC] shadow-xs border border-teal-400/30 select-none shrink-0`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full p-1 overflow-visible" fill="none">
        {/* Base Isometric Shadow */}
        <ellipse cx="32" cy="54" rx="18" ry="5" fill="#020617" fillOpacity="0.55" />

        {/* Layer 1: Deep Navy IoT Base */}
        <motion.g
          animate={{ y: isHovered ? 3 : 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        >
          <polygon points="32,30 52,40 32,50 12,40" fill="#0EA5E9" />
          <polygon points="12,40 32,50 32,56 12,46" fill="#0284C7" />
          <polygon points="52,40 32,50 32,56 52,46" fill="#0369A1" />
        </motion.g>

        {/* Layer 2: Middle Teal Sorting Matrix */}
        <motion.g
          animate={{ y: isHovered ? -1 : 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        >
          <polygon points="32,20 49,28.5 32,37 15,28.5" fill="#2DD4BF" />
          <polygon points="15,28.5 32,37 32,43 15,34.5" fill="#009CAC" />
          <polygon points="49,28.5 32,37 32,43 49,34.5" fill="#0F766E" />
        </motion.g>

        {/* Layer 3: Top Emerald Eco Cap */}
        <motion.g
          animate={{ y: isHovered || isActive ? -5 : -1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 15 }}
        >
          <polygon points="32,10 45,16.5 32,23 19,16.5" fill="#6EE7B7" />
          <polygon points="19,16.5 32,23 32,28 19,21.5" fill="#10B981" />
          <polygon points="45,16.5 32,23 32,28 45,21.5" fill="#047857" />
          {/* Hafi Digital Core Diamond */}
          <polygon points="32,13.5 38,16.5 32,19.5 26,16.5" fill="#FFFFFF" />
        </motion.g>
      </svg>
    </motion.div>
  );
};

/**
 * Compact 3D Isometric Cluster Icon for Main Navigation items & Mega-Preview Cards.
 */
export const IsometricNavClusterIcon3D: React.FC<{
  cluster: 'overview' | 'operasional' | 'gudang' | 'finansial' | 'laporan';
  isActive?: boolean;
  size?: 'sm' | 'md';
}> = ({ cluster, isActive = false, size = 'sm' }) => {
  const palette = {
    overview: { top: '#6EE7B7', left: '#10B981', right: '#047857', accent: '#38BDF8' },
    operasional: { top: '#7DD3FC', left: '#009CAC', right: '#0C2D57', accent: '#34D399' },
    gudang: { top: '#FDE68A', left: '#F59E0B', right: '#B45309', accent: '#009CAC' },
    finansial: { top: '#A7F3D0', left: '#059669', right: '#064E3B', accent: '#FBBF24' },
    laporan: { top: '#C4B5FD', left: '#6366F1', right: '#312E81', accent: '#2DD4BF' },
  }[cluster];

  const boxClass = size === 'md' ? 'h-11 w-11' : 'h-5 w-5';

  return (
    <motion.div
      animate={{
        y: isActive ? [-1, 1, -1] : 0,
        scale: isActive ? 1.08 : 1,
      }}
      transition={{
        y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
        scale: { duration: 0.15 },
      }}
      className={`${boxClass} flex items-center justify-center shrink-0 select-none`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible" fill="none">
        {/* Base Platform */}
        <polygon points="24,26 42,35 24,44 6,35" fill="#1E293B" fillOpacity="0.22" />
        {/* Main Isometric Cube */}
        <polygon points="24,8 40,16 24,24 8,16" fill={palette.top} />
        <polygon points="8,16 24,24 24,39 8,31" fill={palette.left} />
        <polygon points="40,16 24,24 24,39 40,31" fill={palette.right} />
        {/* Floating Satellite Micro-Node */}
        <polygon points="24,12 31,15.5 24,19 17,15.5" fill="#FFFFFF" fillOpacity="0.88" />
        <circle cx="37" cy="11" r="3" fill={palette.accent} />
      </svg>
    </motion.div>
  );
};

/**
 * Interactive 3D Isometric Command & Sorting Ecosystem Hub for OverviewDashboard.
 * Combines 3D perspective mouse tilt, exploding layer inspection, live sensor compression,
 * dynamic warehouse silo heights, and clickable isometric stations.
 */
export const IsometricEcosystemStage3D: React.FC<IsometricEcosystemProps> = ({
  weightKg,
  maxCapacityKg,
  warningThresholdPct,
  criticalThresholdPct,
  scaleState,
  isStable,
  plastikStockKg,
  kertasStockKg,
  logamStockKg,
  activeMembersCount,
  todayDepositsCount,
  totalWalletBalance,
  onSelectModule,
}) => {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [selectedNode, setSelectedNode] = useState<IsometricNodeId>('timbangan');
  const [isExplodedView, setIsExplodedView] = useState(false);

  const scaleMetrics = computeScaleIsometricMetrics(
    weightKg,
    maxCapacityKg,
    warningThresholdPct,
    criticalThresholdPct
  );

  const siloMetrics = computeSiloIsometricHeights(
    plastikStockKg,
    kertasStockKg,
    logamStockKg,
    44
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt(computeIsometricTilt(e.clientX, e.clientY, rect, 10));
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const nodeCards: Record<
    IsometricNodeId,
    {
      id: IsometricNodeId;
      code: string;
      title: string;
      subtitle: string;
      metricLabel: string;
      metricValue: string;
      statusText: string;
      targetTab: NavTab;
      ctaLabel: string;
      accentColor: string;
    }
  > = {
    timbangan: {
      id: 'timbangan',
      code: 'NODE-01 · LOAD CELL ESP32',
      title: 'Stasiun Timbangan Pintar IoT',
      subtitle: 'Kompresi platform 3D merespons beban aktual sensor secara real-time.',
      metricLabel: 'Beban & Utilisasi',
      metricValue: `${weightKg.toFixed(2).replace('.', ',')} kg (${scaleMetrics.capacityPct}%)`,
      statusText:
        scaleMetrics.severity === 'critical'
          ? 'Kapasitas Kritis'
          : scaleMetrics.severity === 'warning'
          ? 'Ambang Peringatan'
          : isStable
          ? 'Terkunci Stabil'
          : 'Mengukur Beban',
      targetTab: 'timbangan',
      ctaLabel: 'Buka Stasiun Timbangan',
      accentColor: scaleMetrics.ledHex,
    },
    inventaris: {
      id: 'inventaris',
      code: 'NODE-02 · SILO GUDANG 3D',
      title: 'Silo Pilah Material Daur Ulang',
      subtitle: `Tinggi kolom 3D proporsional terhadap stok gudang (Dominan: ${siloMetrics.dominantCategory}).`,
      metricLabel: 'Total Stok Siap Jual',
      metricValue: formatWeight(plastikStockKg + kertasStockKg + logamStockKg),
      statusText: `Plastik ${Math.round(plastikStockKg)}kg · Kertas ${Math.round(kertasStockKg)}kg · Logam ${Math.round(logamStockKg)}kg`,
      targetTab: 'inventaris',
      ctaLabel: 'Kelola Inventaris Gudang',
      accentColor: '#10B981',
    },
    setoran: {
      id: 'setoran',
      code: 'NODE-03 · TERMINAL QR WARGA',
      title: 'Kios Pemindai Kartu QR Nasabah',
      subtitle: 'Identifikasi instan kartu nasabah digital Dalam Naungan Hafi Digital.',
      metricLabel: 'Transaksi & Nasabah',
      metricValue: `${todayDepositsCount} Setoran · ${activeMembersCount} Nasabah`,
      statusText: 'Kamera & Dekoder QR Siap',
      targetTab: 'setoran',
      ctaLabel: 'Buka Modul Setoran & QR',
      accentColor: '#38BDF8',
    },
    tabungan: {
      id: 'tabungan',
      code: 'NODE-04 · BUKU BESAR CLOUD',
      title: 'Brankas Tabungan & Ledger Hafi Digital',
      subtitle: 'Sinkronisasi otomatis nilai timbangan ke saldo dompet digital warga.',
      metricLabel: 'Total Likuiditas Warga',
      metricValue: formatIDR(totalWalletBalance),
      statusText: 'Buku Besar Terverifikasi',
      targetTab: 'tabungan',
      ctaLabel: 'Buka Tabungan Digital',
      accentColor: '#F59E0B',
    },
  };

  const activeNodeInfo = nodeCards[selectedNode];
  const explodeOffset = isExplodedView ? -14 : 0;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#111622]/90 p-4 sm:p-5 flex flex-col justify-between"
      data-testid="isometric-ecosystem-stage"
    >
      {/* Top Bar: Interactive Node Pills + Explode 3D Layers Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'timbangan', label: '01. Timbangan 3D' },
              { id: 'inventaris', label: '02. Silo Gudang 3D' },
              { id: 'setoran', label: '03. Terminal QR 3D' },
              { id: 'tabungan', label: '04. Brankas Cloud 3D' },
            ] as Array<{ id: IsometricNodeId; label: string }>
          ).map((tab) => {
            const active = selectedNode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedNode(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#009CAC] text-white shadow-xs'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExplodedView((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
              isExplodedView
                ? 'border-teal-400/60 bg-teal-500/20 text-teal-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
            title="Pisahkan lapisan struktur isometrik 3D"
          >
            <Layers className="h-3 w-3" />
            <span>{isExplodedView ? 'Lapisan Terurai' : 'Urai Lapisan 3D'}</span>
          </button>
          {(tilt.rotateX !== 0 || tilt.rotateY !== 0) && (
            <button
              type="button"
              onClick={handleMouseLeave}
              className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-400 hover:text-white"
              aria-label="Reset sudut 3D"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Center Interactive 3D Isometric Viewport */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative my-3 flex h-56 sm:h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#0D1320] to-[#080C14] border border-white/5 select-none cursor-grab active:cursor-grabbing"
        style={{ perspective: '1000px' }}
      >
        {/* Subtle Isometric Coordinate Telemetry Overlay */}
        <div className="pointer-events-none absolute top-2.5 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>ISO-3D · HAFI DIGITAL</span>
          <span>·</span>
          <span className="tabular-nums">
            X:{tilt.rotateX.toFixed(1)}° Y:{tilt.rotateY.toFixed(1)}°
          </span>
        </div>

        <div className="pointer-events-none absolute top-2.5 right-3 flex items-center gap-1.5 text-[10px] text-teal-300/90">
          <Sparkles className="h-3 w-3" />
          <span>Klik node 3D untuk inspeksi</span>
        </div>

        <motion.div
          animate={{
            rotateX: tilt.rotateX,
            rotateY: tilt.rotateY,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="h-full w-full flex items-center justify-center"
        >
          <svg
            viewBox="0 0 460 250"
            className="h-full w-full max-w-[460px] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="boardTop" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#162238" />
                <stop offset="100%" stopColor="#0C1526" />
              </linearGradient>
              <linearGradient id="boardLeft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#009CAC" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#082F49" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="boardRight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Ambient Floor Glow */}
            <ellipse
              cx="230"
              cy="205"
              rx="170"
              ry="34"
              fill={activeNodeInfo.accentColor}
              fillOpacity="0.14"
            />

            {/* Main Isometric Smart Platform Chassis */}
            <g transform={`translate(0, ${isExplodedView ? 10 : 0})`} className="transition-transform duration-300">
              <polygon points="230,96 410,172 230,242 50,172" fill="url(#boardTop)" stroke="#334155" strokeWidth="1" />
              <polygon points="50,172 230,242 230,254 50,184" fill="url(#boardLeft)" />
              <polygon points="410,172 230,242 230,254 410,184" fill="url(#boardRight)" />

              {/* Isometric Circuit Grid Lines */}
              <polygon
                points="230,108 382,172 230,230 78,172"
                fill="none"
                stroke="#009CAC"
                strokeWidth="0.9"
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />
              {/* Glowing Telemetry Conduit Paths connecting the 4 nodes */}
              <polyline
                points="145,168 230,136 315,168 230,198 145,168"
                fill="none"
                stroke={activeNodeInfo.accentColor}
                strokeWidth="1.8"
                strokeOpacity="0.75"
              />
            </g>

            {/* ============================================================
                NODE 1 (LEFT): STASIUN TIMBANGAN IOT ESP32 (Clickable)
               ============================================================ */}
            <g
              onClick={() => setSelectedNode('timbangan')}
              className="cursor-pointer"
              transform={`translate(0, ${
                (selectedNode === 'timbangan' ? -7 : 0) + explodeOffset
              })`}
            >
              {/* Selection Halo */}
              {selectedNode === 'timbangan' && (
                <polygon
                  points="145,134 205,160 145,186 85,160"
                  fill="none"
                  stroke={scaleMetrics.ledHex}
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {/* Fixed Load-Cell Base */}
              <polygon points="145,140 195,162 145,184 95,162" fill="#1E293B" />
              <polygon points="95,162 145,184 145,192 95,170" fill="#0F172A" />
              <polygon points="195,162 145,184 145,192 195,170" fill="#020617" />

              {/* LED Perimeter Strip */}
              <polygon
                points="145,138 195,160 145,182 95,160"
                fill="none"
                stroke={scaleMetrics.ledHex}
                strokeWidth="2.2"
              />

              {/* Depressible Weighing Platter + Dynamic Cargo Cube Layers */}
              <g transform={`translate(0, ${scaleMetrics.compressionPx * 0.55})`}>
                <polygon points="145,126 189,146 145,166 101,146" fill="#E2E8F0" />
                <polygon points="101,146 145,166 145,172 101,152" fill="#94A3B8" />
                <polygon points="189,146 145,166 145,172 189,152" fill="#64748B" />

                {/* Stacked Cargo Layers (1 to 3 based on weight) */}
                {Array.from({ length: scaleMetrics.cargoLayers }).map((_, layerIdx) => {
                  const yLift = layerIdx * 16;
                  return (
                    <g key={layerIdx} transform={`translate(0, -${yLift})`}>
                      <polygon
                        points="145,104 173,117 145,130 117,117"
                        fill={scaleState === 'COMPLETED' ? '#34D399' : '#2DD4BF'}
                      />
                      <polygon
                        points="117,117 145,130 145,146 117,133"
                        fill={scaleState === 'COMPLETED' ? '#10B981' : '#009CAC'}
                      />
                      <polygon
                        points="173,117 145,130 145,146 173,133"
                        fill={scaleState === 'COMPLETED' ? '#047857' : '#0E7490'}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Floating Callout Pill */}
              <g transform="translate(106, 74)">
                <rect width="78" height="18" rx="5" fill="#0F172A" stroke={scaleMetrics.ledHex} strokeWidth="1" />
                <text x="39" y="12" textAnchor="middle" fill="#F8FAFC" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                  {weightKg.toFixed(1)}kg · {scaleMetrics.capacityPct}%
                </text>
              </g>
            </g>

            {/* ============================================================
                NODE 2 (TOP CENTER): SILO PILAH MATERIAL GUDANG 3D (Clickable)
               ============================================================ */}
            <g
              onClick={() => setSelectedNode('inventaris')}
              className="cursor-pointer"
              transform={`translate(0, ${
                (selectedNode === 'inventaris' ? -7 : 0) + explodeOffset * 1.2
              })`}
            >
              {selectedNode === 'inventaris' && (
                <polygon
                  points="230,104 290,130 230,156 170,130"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {/* Silo 1: Plastik (#009CAC) */}
              <g transform="translate(-28, 8)">
                <polygon
                  points={`230,${122 - siloMetrics.plastikHeightPx} 248,${130 - siloMetrics.plastikHeightPx} 230,${138 - siloMetrics.plastikHeightPx} 212,${130 - siloMetrics.plastikHeightPx}`}
                  fill="#67E8F9"
                />
                <polygon
                  points={`212,${130 - siloMetrics.plastikHeightPx} 230,${138 - siloMetrics.plastikHeightPx} 230,138 212,130`}
                  fill="#009CAC"
                />
                <polygon
                  points={`248,${130 - siloMetrics.plastikHeightPx} 230,${138 - siloMetrics.plastikHeightPx} 230,138 248,130`}
                  fill="#0E7490"
                />
              </g>

              {/* Silo 2: Kertas & Kardus (#159B70) */}
              <g transform="translate(0, 0)">
                <polygon
                  points={`230,${118 - siloMetrics.kertasHeightPx} 248,${126 - siloMetrics.kertasHeightPx} 230,${134 - siloMetrics.kertasHeightPx} 212,${126 - siloMetrics.kertasHeightPx}`}
                  fill="#6EE7B7"
                />
                <polygon
                  points={`212,${126 - siloMetrics.kertasHeightPx} 230,${134 - siloMetrics.kertasHeightPx} 230,134 212,126`}
                  fill="#10B981"
                />
                <polygon
                  points={`248,${126 - siloMetrics.kertasHeightPx} 230,${134 - siloMetrics.kertasHeightPx} 230,134 248,126`}
                  fill="#047857"
                />
              </g>

              {/* Silo 3: Logam & Kaca (#38BDF8) */}
              <g transform="translate(28, 8)">
                <polygon
                  points={`230,${122 - siloMetrics.logamHeightPx} 248,${130 - siloMetrics.logamHeightPx} 230,${138 - siloMetrics.logamHeightPx} 212,${130 - siloMetrics.logamHeightPx}`}
                  fill="#BAE6FD"
                />
                <polygon
                  points={`212,${130 - siloMetrics.logamHeightPx} 230,${138 - siloMetrics.logamHeightPx} 230,138 212,130`}
                  fill="#0284C7"
                />
                <polygon
                  points={`248,${130 - siloMetrics.logamHeightPx} 230,${138 - siloMetrics.logamHeightPx} 230,138 248,130`}
                  fill="#1E3A8A"
                />
              </g>

              <g transform="translate(192, 42)">
                <rect width="76" height="18" rx="5" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                <text x="38" y="12" textAnchor="middle" fill="#A7F3D0" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                  SILO {Math.round(plastikStockKg + kertasStockKg + logamStockKg)}kg
                </text>
              </g>
            </g>

            {/* ============================================================
                NODE 3 (RIGHT): TERMINAL PEMINDAI QR NASABAH 3D (Clickable)
               ============================================================ */}
            <g
              onClick={() => setSelectedNode('setoran')}
              className="cursor-pointer"
              transform={`translate(0, ${
                (selectedNode === 'setoran' ? -7 : 0) + explodeOffset
              })`}
            >
              {selectedNode === 'setoran' && (
                <polygon
                  points="315,134 375,160 315,186 255,160"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {/* Isometric QR Kiosk Pedestal */}
              <polygon points="315,126 355,144 315,162 275,144" fill="#38BDF8" />
              <polygon points="275,144 315,162 315,184 275,166" fill="#0284C7" />
              <polygon points="355,144 315,162 315,184 355,166" fill="#0C2D57" />

              {/* Floating Isometric Member QR Card */}
              <polygon points="315,96 347,110 315,124 283,110" fill="#F8FAFC" stroke="#38BDF8" strokeWidth="1.2" />
              {/* Mini QR Matrix Squares on Isometric Card */}
              <polygon points="315,102 323,106 315,110 307,106" fill="#0C2D57" />
              <polygon points="303,108 309,111 303,114 297,111" fill="#009CAC" />
              <polygon points="327,108 333,111 327,114 321,111" fill="#009CAC" />

              <g transform="translate(278, 70)">
                <rect width="74" height="18" rx="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                <text x="37" y="12" textAnchor="middle" fill="#BAE6FD" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                  QR · {activeMembersCount} WARGA
                </text>
              </g>
            </g>

            {/* ============================================================
                NODE 4 (BOTTOM CENTER): BRANKAS CLOUD HAFI DIGITAL 3D (Clickable)
               ============================================================ */}
            <g
              onClick={() => setSelectedNode('tabungan')}
              className="cursor-pointer"
              transform={`translate(0, ${
                (selectedNode === 'tabungan' ? -7 : 0) + explodeOffset * 0.8
              })`}
            >
              {selectedNode === 'tabungan' && (
                <polygon
                  points="230,168 286,192 230,216 174,192"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {/* Isometric Vault Cube */}
              <polygon points="230,152 266,168 230,184 194,168" fill="#FDE68A" />
              <polygon points="194,168 230,184 230,208 194,192" fill="#F59E0B" />
              <polygon points="266,168 230,184 230,208 266,192" fill="#B45309" />
              <polygon points="230,159 248,168 230,177 212,168" fill="#FFFBEB" />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Bottom Live Selected Node Inspection Bar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeNodeInfo.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
        >
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase text-teal-300">
              <span>{activeNodeInfo.code}</span>
              <span>·</span>
              <span className="text-slate-300">{activeNodeInfo.statusText}</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">{activeNodeInfo.title}</p>
            <p className="text-[11px] text-slate-400 truncate">{activeNodeInfo.subtitle}</p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
            <div className="text-left sm:text-right">
              <span className="block text-[10px] text-slate-400">{activeNodeInfo.metricLabel}</span>
              <span className="text-xs font-semibold text-white tabular-nums">
                {activeNodeInfo.metricValue}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectModule(activeNodeInfo.targetTab)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#009CAC] hover:bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white transition cursor-pointer whitespace-nowrap"
            >
              <span>{activeNodeInfo.ctaLabel}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * Interactive 3D Isometric Eco-Fintech & IoT Scene for the Executive Overview Hero.
 * Responds to pointer movement with smooth 3D perspective tilt and floating layers.
 */
export const HeroEcoVault3D: React.FC = () => {
  const [rotate, setRotate] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRotate(computeIsometricTilt(e.clientX, e.clientY, rect, 12));
  };

  const handleMouseLeave = () => {
    setRotate({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex h-36 w-56 items-center justify-center select-none cursor-pointer"
      style={{ perspective: '800px' }}
      aria-hidden="true"
    >
      <motion.div
        animate={{
          rotateX: rotate.rotateX,
          rotateY: rotate.rotateY,
          y: [0, -5, 0],
        }}
        transition={{
          rotateX: { type: 'spring', stiffness: 180, damping: 18 },
          rotateY: { type: 'spring', stiffness: 180, damping: 18 },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-full w-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 240 160"
          className="h-full w-full overflow-visible drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="isoBaseTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DDF7EE" />
              <stop offset="100%" stopColor="#99F6E4" />
            </linearGradient>
            <linearGradient id="isoBaseLeft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009CAC" />
              <stop offset="100%" stopColor="#0E7490" />
            </linearGradient>
            <linearGradient id="isoBaseRight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0C2D57" />
              <stop offset="100%" stopColor="#061529" />
            </linearGradient>
            <linearGradient id="isoCubeTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          <ellipse cx="120" cy="136" rx="72" ry="18" fill="#041022" fillOpacity="0.45" />

          <polygon points="120,76 196,110 120,144 44,110" fill="url(#isoBaseTop)" />
          <polygon points="44,110 120,144 120,156 44,122" fill="url(#isoBaseLeft)" />
          <polygon points="196,110 120,144 120,156 196,122" fill="url(#isoBaseRight)" />

          <polygon
            points="120,84 178,110 120,136 62,110"
            fill="none"
            stroke="#0C2D57"
            strokeWidth="1.2"
            strokeOpacity="0.25"
          />

          <g className="transition-transform duration-300">
            <polygon points="120,36 162,56 120,76 78,56" fill="url(#isoCubeTop)" />
            <polygon points="78,56 120,76 120,114 78,94" fill="#159B70" />
            <polygon points="162,56 120,76 120,114 162,94" fill="#047857" />
            <polygon points="120,46 140,56 120,66 100,56" fill="#FFFFFF" fillOpacity="0.85" />
          </g>

          <g>
            <polygon points="62,52 82,62 62,72 42,62" fill="#38BDF8" />
            <polygon points="42,62 62,72 62,84 42,74" fill="#0284C7" />
            <polygon points="82,62 62,72 62,84 82,74" fill="#0369A1" />
          </g>

          <g>
            <polygon points="178,44 198,54 178,64 158,54" fill="#FBBF24" />
            <polygon points="158,54 178,64 178,74 158,64" fill="#D97706" />
            <polygon points="198,54 178,64 178,74 198,64" fill="#B45309" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

/**
 * Interactive 3D Isometric Weighing Scale Visualizer.
 * Reacts to live weightKg and scaleState (depresses platform under load and glows emerald when STABLE).
 */
export const InteractiveScale3D: React.FC<{
  weightKg: number;
  scaleState: ScaleState;
  isStable: boolean;
}> = ({ weightKg, scaleState, isStable }) => {
  const compressionOffset = Math.min(10, Math.round((weightKg / 60) * 10));
  const hasLoad = weightKg > 0.01;

  const glowColor = !hasLoad
    ? '#38BDF8'
    : isStable
    ? '#34D399'
    : '#FBBF24';

  return (
    <div className="relative flex h-36 w-44 items-center justify-center select-none" aria-hidden="true">
      <motion.div
        animate={{
          y: hasLoad ? compressionOffset : [0, -3, 0],
        }}
        transition={{
          y: hasLoad
            ? { type: 'spring', stiffness: 220, damping: 16 }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 200 150" className="w-full h-full overflow-visible" fill="none">
          <ellipse cx="100" cy="126" rx="64" ry="16" fill="#020813" fillOpacity="0.6" />

          <polygon points="100,82 164,110 100,138 36,110" fill="#1E293B" />
          <polygon points="36,110 100,138 100,148 36,120" fill="#0F172A" />
          <polygon points="164,110 100,138 100,148 164,120" fill="#020617" />

          <polygon
            points="100,79 164,107 100,135 36,107"
            fill="none"
            stroke={glowColor}
            strokeWidth="2.5"
            strokeOpacity="0.85"
          />

          <g transform={`translate(0, ${hasLoad ? Math.min(6, compressionOffset * 0.6) : 0})`}>
            <polygon points="100,64 158,90 100,116 42,90" fill="#E2E8F0" />
            <polygon points="42,90 100,116 100,123 42,97" fill="#94A3B8" />
            <polygon points="158,90 100,116 100,123 158,97" fill="#64748B" />

            <line x1="75" y1="82" x2="125" y2="104" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="85" y1="77" x2="135" y2="99" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="65" y1="87" x2="115" y2="109" stroke="#CBD5E1" strokeWidth="1.5" />

            {hasLoad && (
              <g>
                <polygon
                  points="100,26 136,43 100,60 64,43"
                  fill={scaleState === 'COMPLETED' ? '#34D399' : '#009CAC'}
                />
                <polygon
                  points="64,43 100,60 100,94 64,77"
                  fill={scaleState === 'COMPLETED' ? '#10B981' : '#0E7490'}
                />
                <polygon
                  points="136,43 100,60 100,94 136,77"
                  fill={scaleState === 'COMPLETED' ? '#059669' : '#155E75'}
                />
                <line x1="82" y1="34.5" x2="118" y2="51.5" stroke="#DDF7EE" strokeWidth="3" />
              </g>
            )}
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

/**
 * Compact 3D Isometric Empty State Illustration
 */
export const EmptyStateCube3D: React.FC = () => (
  <motion.div
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    className="mx-auto flex h-16 w-16 items-center justify-center"
    aria-hidden="true"
  >
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
      <polygon points="50,15 85,33 50,51 15,33" fill="#DDF7EE" />
      <polygon points="15,33 50,51 50,85 15,67" fill="#009CAC" />
      <polygon points="85,33 50,51 50,85 85,67" fill="#0C2D57" />
    </svg>
  </motion.div>
);
