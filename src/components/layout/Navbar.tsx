import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutGrid,
  Scale,
  Cpu,
  Users,
  Tags,
  Wallet,
  Boxes,
  Truck,
  Landmark,
  FileBarChart,
  Sliders,
  Settings,
  Search,
  Bell,
  Building2,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';
import { formatTimeOnlyID } from '../../utils/formatters';
import {
  IsometricBrandEmblem3D,
  IsometricNavClusterIcon3D,
} from '../visuals/Isometric3DScene';

interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const MODULE_SHELF_ITEMS: Array<{
  id: NavTab;
  label: string;
  shortLabel: string;
  group: string;
  clusterKey: 'overview' | 'operasional' | 'gudang' | 'finansial' | 'laporan';
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Ringkasan Eksekutif', shortLabel: 'Overview', group: 'Ikhtisar', clusterKey: 'overview', icon: LayoutGrid },
  { id: 'timbangan', label: 'Stasiun Timbangan IoT', shortLabel: 'Timbangan IoT', group: 'Operasional', clusterKey: 'operasional', icon: Cpu },
  { id: 'setoran', label: 'Setoran Sampah', shortLabel: 'Setoran', group: 'Operasional', clusterKey: 'operasional', icon: Scale },
  { id: 'nasabah', label: 'Direktori Nasabah', shortLabel: 'Nasabah', group: 'Operasional', clusterKey: 'operasional', icon: Users },
  { id: 'harga', label: 'Katalog & Harga', shortLabel: 'Harga', group: 'Operasional', clusterKey: 'operasional', icon: Tags },
  { id: 'tabungan', label: 'Tabungan Digital', shortLabel: 'Tabungan', group: 'Finansial', clusterKey: 'finansial', icon: Wallet },
  { id: 'inventaris', label: 'Inventaris Gudang', shortLabel: 'Inventaris', group: 'Logistik', clusterKey: 'gudang', icon: Boxes },
  { id: 'penjualan', label: 'Penjualan Pengepul', shortLabel: 'Pengepul', group: 'Logistik', clusterKey: 'gudang', icon: Truck },
  { id: 'keuangan', label: 'Laporan Keuangan', shortLabel: 'Keuangan', group: 'Finansial', clusterKey: 'finansial', icon: Landmark },
  { id: 'laporan', label: 'Analitik & Ekspor', shortLabel: 'Laporan', group: 'Sistem', clusterKey: 'laporan', icon: FileBarChart },
  { id: 'perangkat', label: 'Kalibrasi Perangkat', shortLabel: 'Kalibrasi', group: 'Sistem', clusterKey: 'laporan', icon: Sliders },
  { id: 'pengaturan', label: 'Pengaturan & Audit', shortLabel: 'Pengaturan', group: 'Sistem', clusterKey: 'laporan', icon: Settings },
];

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const {
    activeTab,
    setActiveTab,
    branches,
    currentBranchId,
    setCurrentBranchId,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    activeToastAlerts,
    dismissToastAlert,
    capacityWarningThresholdPct,
    capacityCriticalThresholdPct,
    currentCapacityPct,
    devices,
    activeDeviceId,
    setActiveDeviceId,
    apiStatus,
    apiLatencyMs,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [is3DClusterOpen, setIs3DClusterOpen] = useState(false);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnreadCritical = notifications.some(
    (n) => !n.read && (n.type === 'alert' || n.type === 'warning')
  );

  const topGroupLinks: Array<{
    label: string;
    desc: string;
    clusterKey: 'overview' | 'operasional' | 'gudang' | 'finansial' | 'laporan';
    target: NavTab;
    activeTabs: NavTab[];
  }> = [
    {
      label: 'OVERVIEW',
      desc: 'Diorama IoT 3D & metrik eksekutif real-time',
      clusterKey: 'overview',
      target: 'overview',
      activeTabs: ['overview'],
    },
    {
      label: 'OPERASIONAL',
      desc: 'Timbangan ESP32, Setoran QR & Nasabah',
      clusterKey: 'operasional',
      target: 'setoran',
      activeTabs: ['setoran', 'timbangan', 'nasabah', 'harga'],
    },
    {
      label: 'GUDANG & MITRA',
      desc: 'Silo inventaris material & pengiriman pengepul',
      clusterKey: 'gudang',
      target: 'inventaris',
      activeTabs: ['inventaris', 'penjualan'],
    },
    {
      label: 'FINANSIAL',
      desc: 'Brankas tabungan warga & neraca kas unit',
      clusterKey: 'finansial',
      target: 'tabungan',
      activeTabs: ['tabungan', 'keuangan'],
    },
    {
      label: 'LAPORAN & IOT',
      desc: 'Ekspor PDF/Excel, kalibrasi sensor & audit',
      clusterKey: 'laporan',
      target: 'laporan',
      activeTabs: ['laporan', 'perangkat', 'pengaturan'],
    },
  ];

  return (
    <>
      {/* Floffice + ssych Inspired Architectural Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Brand Mark + Branch Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleMobileMenu}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Buka Menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 text-left group cursor-pointer leading-none shrink-0"
            >
              <IsometricBrandEmblem3D size="md" isActive={activeTab === 'overview'} />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold tracking-tight text-slate-950">
                    Pilah.in
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#009CAC]">
                    IoT
                  </span>
                </div>
                <span className="text-[8.5px] font-semibold tracking-wider uppercase text-slate-400 mt-0.5 whitespace-nowrap">
                  Dalam Naungan Hafi Digital
                </span>
              </div>
            </button>

            <span className="hidden md:inline-block h-3.5 w-px bg-slate-200 shrink-0" />

            {/* Clean Branch Selector */}
            <div className="relative hidden md:block shrink-0">
              <button
                onClick={() => {
                  setIsBranchDropdownOpen(!isBranchDropdownOpen);
                  setIsDeviceDropdownOpen(false);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="whitespace-nowrap">
                  {branches.find((b) => b.id === currentBranchId)?.name.replace('Bank Sampah Pilah.in ', '')}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </button>

              {isBranchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setCurrentBranchId(b.id);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        b.id === currentBranchId
                          ? 'bg-slate-900 text-white font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate">{b.name}</p>
                        <p
                          className={`text-[10px] truncate ${
                            b.id === currentBranchId ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {b.address}
                        </p>
                      </div>
                      {b.id === currentBranchId && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Interactive 3D Isometric Category Cluster Links */}
          <nav className="hidden xl:flex items-center gap-2.5 shrink-0" aria-label="Klaster Navigasi Utama">
            {topGroupLinks.map((grp) => {
              const isActive = grp.activeTabs.includes(activeTab);
              return (
                <button
                  key={grp.label}
                  onClick={() => setActiveTab(grp.target)}
                  className={`group flex items-center gap-1 text-[10.5px] tracking-[0.08em] uppercase transition-colors cursor-pointer whitespace-nowrap py-1 ${
                    isActive
                      ? 'font-semibold text-slate-950 underline decoration-[#009CAC] decoration-2 underline-offset-8'
                      : 'font-medium text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <IsometricNavClusterIcon3D
                    cluster={grp.clusterKey}
                    isActive={isActive}
                    size="sm"
                  />
                  <span>{grp.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIs3DClusterOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                is3DClusterOpen
                  ? 'border-[#009CAC] bg-[#0C2D57] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>Peta 3D</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  is3DClusterOpen ? 'rotate-180 text-teal-300' : 'text-slate-400'
                }`}
              />
            </button>
          </nav>

          {/* Right: Search, Live IoT Status, Notifications & Floffice Circular-Arrow CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Expandable Search */}
            <div className="relative hidden md:flex items-center">
              {isSearchExpanded || searchQuery ? (
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setIsSearchExpanded(false);
                    }}
                    autoFocus
                    placeholder="Cari nasabah, TRX..."
                    className="w-44 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-6 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchExpanded(false);
                      }}
                      className="absolute right-2 text-slate-400 hover:text-slate-600"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Cari</span>
                </button>
              )}
            </div>

            {/* Live IoT Telemetry Status Selector */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setIsDeviceDropdownOpen(!isDeviceDropdownOpen);
                  setIsBranchDropdownOpen(false);
                  setIsNotifOpen(false);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  currentCapacityPct >= capacityCriticalThresholdPct
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : currentCapacityPct >= capacityWarningThresholdPct
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    currentCapacityPct >= capacityCriticalThresholdPct
                      ? 'bg-rose-500 animate-ping'
                      : currentCapacityPct >= capacityWarningThresholdPct
                      ? 'bg-amber-500 animate-pulse'
                      : activeDevice.status === 'online'
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-[11px] font-medium whitespace-nowrap">{activeDevice.deviceCode}</span>
                {currentCapacityPct > 0 && (
                  <span className="text-[11px] font-semibold whitespace-nowrap">· {currentCapacityPct}%</span>
                )}
              </button>

              {isDeviceDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                    <span>Node Timbangan IoT</span>
                    <button
                      onClick={() => {
                        setActiveTab('perangkat');
                        setIsDeviceDropdownOpen(false);
                      }}
                      className="text-[#009CAC] hover:underline"
                    >
                      Kalibrasi
                    </button>
                  </div>
                  {devices.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setActiveDeviceId(d.id);
                        setIsDeviceDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                        d.id === activeDeviceId ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {d.deviceCode}{' '}
                          <span className={d.id === activeDeviceId ? 'text-slate-300' : 'text-slate-400'}>
                            ({d.maxCapacityKg}kg)
                          </span>
                        </p>
                        <p className={`text-[10px] ${d.id === activeDeviceId ? 'text-slate-300' : 'text-slate-400'}`}>
                          {d.location}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          d.status === 'online'
                            ? d.id === activeDeviceId
                              ? 'text-teal-300'
                              : 'text-emerald-700'
                            : 'text-rose-500'
                        }`}
                      >
                        {d.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </button>
                  ))}

                  <div className="mt-1 border-t border-slate-100 pt-1.5 px-2 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-500">
                      API: {apiStatus === 'online' ? `ONLINE (${apiLatencyMs}ms)` : apiStatus.toUpperCase()}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('pengaturan');
                        setIsDeviceDropdownOpen(false);
                      }}
                      className="font-semibold text-[#009CAC] hover:underline cursor-pointer"
                    >
                      Konsol API
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsBranchDropdownOpen(false);
                  setIsDeviceDropdownOpen(false);
                }}
                className={`relative rounded-full border p-2 transition-colors cursor-pointer ${
                  hasUnreadCritical
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-label="Pemberitahuan Sistem"
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                      hasUnreadCritical ? 'bg-rose-600 animate-pulse' : 'bg-[#009CAC]'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">Notifikasi & Ambang IoT</span>
                      <p className="text-[10px] text-slate-400">
                        Peringatan ≥{capacityWarningThresholdPct}% · Kritis ≥{capacityCriticalThresholdPct}%
                      </p>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
                      >
                        Bersihkan
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                    {notifications.length === 0 ? (
                      <p className="py-5 text-center text-xs text-slate-400">Belum ada notifikasi kapasitas.</p>
                    ) : (
                      notifications.map((n) => {
                        const isAlert = n.type === 'alert';
                        const isWarn = n.type === 'warning';
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.actionTab) {
                                setActiveTab(n.actionTab);
                                setIsNotifOpen(false);
                              }
                            }}
                            className={`cursor-pointer p-2.5 transition-colors rounded-xl my-0.5 ${
                              n.read
                                ? 'opacity-65 hover:bg-slate-50'
                                : isAlert
                                ? 'bg-rose-50/70 hover:bg-rose-50'
                                : isWarn
                                ? 'bg-amber-50/70 hover:bg-amber-50'
                                : 'bg-teal-50/40 hover:bg-teal-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {isAlert && <AlertOctagon className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                                {isWarn && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                                <p
                                  className={`text-xs font-semibold ${
                                    isAlert ? 'text-rose-900' : isWarn ? 'text-amber-900' : 'text-slate-800'
                                  }`}
                                >
                                  {n.title}
                                </p>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {formatTimeOnlyID(n.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Signature Floffice Dark Pill CTA Button with Circular Arrow */}
            <button
              onClick={() => setActiveTab('timbangan')}
              className="hidden 2xl:inline-flex items-center gap-2.5 rounded-full bg-[#1C1D1F] hover:bg-slate-800 pl-4 pr-2 py-1.5 text-[11px] font-medium tracking-wider uppercase text-white transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">TIMBANGAN IOT</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-white/5 shrink-0">
                <ArrowRight className="h-3 w-3 text-white" />
              </span>
            </button>
          </div>
        </div>

        {/* Interactive 3D Isometric Cluster Explorer Mega-Bar (Expandable) */}
        <AnimatePresence>
          {is3DClusterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden border-t border-slate-200 bg-[#0B0E14] text-white"
            >
              <div className="mx-auto max-w-[1360px] px-4 sm:px-8 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[11px] font-medium tracking-wider uppercase text-teal-300">
                    <span>PETA KLASTER ISOMETRIK 3D · EKOSISTEM HAFI DIGITAL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIs3DClusterOpen(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Tutup Peta 3D
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topGroupLinks.map((grp) => {
                    const isActive = grp.activeTabs.includes(activeTab);
                    return (
                      <motion.button
                        key={grp.label}
                        type="button"
                        whileHover={{ y: -3, rotateX: 6, rotateY: -6 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        style={{ transformStyle: 'preserve-3d' }}
                        onClick={() => {
                          setActiveTab(grp.target);
                          setIs3DClusterOpen(false);
                        }}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                          isActive
                            ? 'border-teal-400/60 bg-white/10 shadow-md'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]'
                        }`}
                      >
                        <IsometricNavClusterIcon3D
                          cluster={grp.clusterKey}
                          isActive={isActive}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tracking-wide text-white truncate">
                            {grp.label}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2 leading-snug">
                            {grp.desc}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 21st.dev @ssychui Inspired Interactive Icon-Tile Module Shelf with 3D Isometric Tilt */}
        <div className="border-t border-slate-200/60 bg-[#FAFAFA]">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between gap-1 min-w-max">
              {MODULE_SHELF_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ y: -1.5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-xs font-medium'
                        : 'bg-transparent text-slate-500 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        isActive
                          ? 'border-white/20 bg-white/10 text-teal-300'
                          : 'border-slate-200/90 bg-white text-slate-500 group-hover:border-slate-300 group-hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="whitespace-nowrap">{item.shortLabel}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Real-Time Capacity Threshold Toast Alerts */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {activeToastAlerts.map((toast) => {
            const isCritical = toast.type === 'alert';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-xs ${
                  isCritical
                    ? 'border-rose-300 bg-rose-950/95 text-white'
                    : 'border-amber-300 bg-white text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold">{toast.title}</span>
                  </div>
                  <button
                    onClick={() => dismissToastAlert(toast.id)}
                    className={`rounded-md p-0.5 transition-colors ${
                      isCritical ? 'text-rose-300 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    aria-label="Tutup Peringatan"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p
                  className={`mt-1.5 text-[11px] leading-relaxed ${
                    isCritical ? 'text-rose-100' : 'text-slate-600'
                  }`}
                >
                  {toast.message}
                </p>

                {typeof toast.capacityPct === 'number' && (
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] font-medium mb-1">
                      <span>Utilisasi Kapasitas Sensor</span>
                      <span>{toast.capacityPct}%</span>
                    </div>
                    <div
                      className={`h-1.5 w-full rounded-full overflow-hidden ${
                        isCritical ? 'bg-rose-900' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCritical ? 'bg-rose-400' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, toast.capacityPct)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      markNotificationAsRead(toast.id);
                      dismissToastAlert(toast.id);
                      setActiveTab('timbangan');
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      isCritical
                        ? 'bg-white text-rose-950 hover:bg-rose-50'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    <span>Pantau Stasiun</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
};
