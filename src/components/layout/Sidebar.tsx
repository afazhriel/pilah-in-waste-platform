import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MODULE_SHELF_ITEMS } from './Navbar';
import { IsometricBrandEmblem3D } from '../visuals/Isometric3DScene';
import {
  Sidebar as ShadcnSidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Logo = () => {
  return (
    <div className="font-normal flex items-center gap-2.5 text-sm text-slate-900 py-1 px-1.5 relative z-20">
      <IsometricBrandEmblem3D size="md" isActive />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col leading-tight whitespace-pre"
      >
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-slate-950 text-sm tracking-tight">
            Pilah.in
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-[#009CAC]">
            IoT
          </span>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Dalam Naungan Hafi Digital
        </span>
      </motion.div>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="font-normal flex items-center justify-center text-sm text-slate-900 py-1 relative z-20">
      <IsometricBrandEmblem3D size="md" />
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    withdrawalRequests,
    deposits,
    currentBranch,
  } = useApp();

  const pendingWithdrawalsCount = withdrawalRequests.filter(
    (w) => w.status === 'pending'
  ).length;
  const todayDepositsCount = deposits.filter((d) =>
    d.timestamp.startsWith(new Date().toISOString().slice(0, 10))
  ).length;

  const links = MODULE_SHELF_ITEMS.map((item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const badge =
      item.id === 'setoran'
        ? todayDepositsCount
        : item.id === 'tabungan'
        ? pendingWithdrawalsCount
        : undefined;

    return {
      label: item.label,
      href: `#${item.id}`,
      active: isActive,
      badge,
      onClick: () => {
        setActiveTab(item.id);
        if (window.innerWidth < 768) {
          setIsMobileOpen(false);
        }
      },
      icon: (
        <Icon
          className={`h-4 w-4 flex-shrink-0 transition-colors ${
            isActive
              ? 'text-teal-300'
              : 'text-slate-600 group-hover/sidebar:text-[#009CAC]'
          }`}
        />
      ),
    };
  });

  return (
    <ShadcnSidebar open={isMobileOpen} setOpen={setIsMobileOpen}>
      <SidebarBody className="justify-between gap-6 border-r border-slate-200/80 bg-[#F7F6F2] md:sticky md:top-0 md:h-screen no-print">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {isMobileOpen ? <Logo /> : <LogoIcon />}
          <div className="mt-6 flex flex-col gap-1">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-3">
          <SidebarLink
            link={{
              label: `${currentBranch.manager || 'Operator Utama'} · Hafi Digital`,
              href: '#pengaturan',
              onClick: () => setActiveTab('pengaturan'),
              icon: (
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-[#0C2D57] text-teal-300 flex items-center justify-center text-[10px] font-bold border border-teal-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              ),
            }}
          />
        </div>
      </SidebarBody>
    </ShadcnSidebar>
  );
};
