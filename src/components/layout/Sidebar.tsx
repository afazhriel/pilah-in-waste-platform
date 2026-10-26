import React from 'react';
import {
  LayoutDashboard,
  ArrowDownToLine,
  Cpu,
  Users,
  Tags,
  Wallet,
  Boxes,
  Truck,
  TrendingUp,
  BarChart3,
  Sliders,
  Settings,
  Recycle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, currentBranch, withdrawalRequests, isScaleStable, simulatedWeightKg } = useApp();

  const pendingWithdrawalsCount = withdrawalRequests.filter((w) => w.status === 'pending').length;

  const navGroups: Array<{
    groupTitle: string;
    items: Array<{
      id: NavTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string | number;
      badgeVariant?: 'teal' | 'warning' | 'mint';
    }>;
  }> = [
    {
      groupTitle: 'OPERASIONAL UTAMA',
      items: [
        { id: 'overview', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
        { id: 'setoran', label: 'Setoran Sampah', icon: ArrowDownToLine },
        {
          id: 'timbangan',
          label: 'Timbangan IoT',
          icon: Cpu,
          badge: simulatedWeightKg > 0 ? `${simulatedWeightKg.toFixed(1)} kg` : 'Live',
          badgeVariant: isScaleStable ? 'mint' : 'warning',
        },
      ],
    },
    {
      groupTitle: 'NASABAH & FINANSIAL',
      items: [
        { id: 'nasabah', label: 'Data Nasabah', icon: Users },
        { id: 'harga', label: 'Jenis & Harga Sampah', icon: Tags },
        {
          id: 'tabungan',
          label: 'Tabungan Digital',
          icon: Wallet,
          badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : undefined,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      groupTitle: 'GUDANG & PENJUALAN',
      items: [
        { id: 'inventaris', label: 'Inventaris & Gudang', icon: Boxes },
        { id: 'penjualan', label: 'Penjualan Pengepul', icon: Truck },
        { id: 'keuangan', label: 'Laporan Keuangan', icon: TrendingUp },
      ],
    },
    {
      groupTitle: 'SISTEM & ANALITIK',
      items: [
        { id: 'laporan', label: 'Analitik & Ekspor', icon: BarChart3 },
        { id: 'perangkat', label: 'Perangkat & Kalibrasi', icon: Sliders },
        { id: 'pengaturan', label: 'Pengaturan & Audit', icon: Settings },
      ],
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#0C2D57] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#009CAC] to-[#22c55e] shadow-lg shadow-teal-500/20">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white">Pilah</span>
                <span className="text-xl font-extrabold tracking-tight text-[#009CAC]">.in</span>
                <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#DDF7EE] tracking-wide">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300 line-clamp-1">
                Smart Waste Banking & IoT
              </p>
            </div>
          </div>
        </div>

        {/* Branch Context Card */}
        <div className="mx-4 my-3 rounded-xl bg-white/5 p-3 border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-teal-300">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" /> UNIT AKTIF
            </span>
            <span className="text-[11px] font-mono text-slate-300">{currentBranch.code}</span>
          </div>
          <p className="text-xs font-semibold text-white truncate">{currentBranch.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{currentBranch.address}</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.groupTitle}
              </p>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#009CAC] text-white shadow-md shadow-teal-900/30 font-semibold'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.badgeVariant === 'warning'
                              ? 'bg-amber-400/90 text-amber-950'
                              : item.badgeVariant === 'mint'
                              ? 'bg-[#DDF7EE] text-[#0C2D57]'
                              : 'bg-teal-400/20 text-teal-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <p className="font-semibold text-slate-200 text-[11px]">Sistem IoT Terkoneksi</p>
                <p className="text-[10px] text-slate-400 font-mono">ESP32 Ingestion 100%</p>
              </div>
            </div>
            <ShieldCheck className="h-4 w-4 text-teal-400" />
          </div>
        </div>
      </aside>
    </>
  );
};
