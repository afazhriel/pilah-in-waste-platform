import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Building2,
  Cpu,
  ChevronDown,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTimeOnlyID } from '../../utils/formatters';

interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const {
    branches,
    currentBranchId,
    setCurrentBranchId,
    currentUser,
    isDemoMode,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    devices,
    activeDeviceId,
    setActiveDeviceId,
    resetToDemoData,
    setActiveTab,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      {/* Left section: Hamburger & Contextual Search */}
      <div className="flex items-center gap-3 lg:gap-6 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nasabah, kode setoran, sampah (contoh: Ratna, TRX, PET)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition-colors focus:border-[#009CAC] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009CAC]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right section: Branch, IoT status, Demo Badge, Notifications, User */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Branch Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setIsBranchDropdownOpen(!isBranchDropdownOpen);
              setIsDeviceDropdownOpen(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300"
          >
            <Building2 className="h-3.5 w-3.5 text-[#009CAC]" />
            <span className="truncate max-w-[130px]">
              {branches.find((b) => b.id === currentBranchId)?.name.replace('Bank Sampah ', '')}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                PILIH UNIT BANK SAMPAH
              </p>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setCurrentBranchId(b.id);
                    setIsBranchDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    b.id === currentBranchId
                      ? 'bg-teal-50 font-semibold text-[#009CAC]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-900">{b.name}</p>
                    <p className="text-[10px] text-slate-500">{b.address}</p>
                  </div>
                  {b.id === currentBranchId && <CheckCircle2 className="h-4 w-4 text-[#009CAC]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live IoT Status Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setIsDeviceDropdownOpen(!isDeviceDropdownOpen);
              setIsBranchDropdownOpen(false);
              setIsNotifOpen(false);
            }}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
              activeDevice.status === 'online'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {activeDevice.status === 'online' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  activeDevice.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="font-mono text-[11px] font-semibold">{activeDevice.deviceCode}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {isDeviceDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                <span>STASIUN TIMBANGAN IOT</span>
                <span
                  onClick={() => {
                    setActiveTab('perangkat');
                    setIsDeviceDropdownOpen(false);
                  }}
                  className="cursor-pointer text-[#009CAC] hover:underline"
                >
                  Kelola
                </span>
              </div>
              {devices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setActiveDeviceId(d.id);
                    setIsDeviceDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs transition-colors ${
                    d.id === activeDeviceId
                      ? 'bg-teal-50 text-[#0C2D57]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Cpu className="h-3.5 w-3.5 text-[#009CAC]" />
                      <span>{d.deviceCode}</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        ({d.maxCapacityKg}kg max)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{d.location}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Ping: {formatTimeOnlyID(d.lastHeartbeat)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      d.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {d.status.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Demo Mode Badge */}
        {isDemoMode && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>MODE DEMO</span>
            <button
              onClick={resetToDemoData}
              title="Reset data ke kondisi awal seed"
              className="ml-1 rounded p-0.5 text-amber-700 hover:bg-amber-200/60"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsBranchDropdownOpen(false);
              setIsDeviceDropdownOpen(false);
            }}
            className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Pemberitahuan Sistem"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#009CAC] text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">Notifikasi Operasional</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Tidak ada notifikasi baru.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`cursor-pointer p-2.5 transition-colors rounded-lg ${
                        n.read ? 'opacity-60 hover:bg-slate-50' : 'bg-teal-50/40 hover:bg-teal-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {formatTimeOnlyID(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0C2D57] text-white font-bold text-xs shadow-xs">
            BS
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
            <p className="text-[10px] font-medium text-[#009CAC] leading-tight">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
