/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { SmartWeighingStation } from './components/iot/SmartWeighingStation';
import { DepositManager } from './components/deposit/DepositManager';
import { MemberDirectory } from './components/members/MemberDirectory';
import { CategoryPricing } from './components/categories/CategoryPricing';
import { DigitalWallet } from './components/wallet/DigitalWallet';
import { InventoryManager } from './components/inventory/InventoryManager';
import { CollectorSales } from './components/sales/CollectorSales';
import { FinanceModule } from './components/finance/FinanceModule';
import { ReportingModule } from './components/reports/ReportingModule';
import { DeviceCalibration } from './components/devices/DeviceCalibration';
import { SettingsModule } from './components/settings/SettingsModule';
import { CinematicFooter } from '@/components/ui/motion-footer';

const DashboardContent: React.FC = () => {
  const { activeTab, setActiveTab, currentBranch } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'setoran':
        return <DepositManager />;
      case 'timbangan':
        return <SmartWeighingStation />;
      case 'nasabah':
        return <MemberDirectory />;
      case 'harga':
        return <CategoryPricing />;
      case 'tabungan':
        return <DigitalWallet />;
      case 'inventaris':
        return <InventoryManager />;
      case 'penjualan':
        return <CollectorSales />;
      case 'keuangan':
        return <FinanceModule />;
      case 'laporan':
        return <ReportingModule />;
      case 'perangkat':
        return <DeviceCalibration />;
      case 'pengaturan':
        return <SettingsModule />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEDE8] text-slate-900 selection:bg-[#009CAC] selection:text-white flex flex-col md:flex-row">
      {/* Collapsible Shadcn Sidebar (Desktop Hover-Expand + Mobile Drawer) */}
      <Sidebar isMobileOpen={isSidebarOpen} setIsMobileOpen={setIsSidebarOpen} />

      {/* Main Architectural Sheet Container */}
      <div className="flex-1 min-w-0 min-h-screen bg-white shadow-[0_0_60px_rgba(15,23,42,0.06)] border-x border-slate-200/80 flex flex-col">
        <Navbar onToggleMobileMenu={() => setIsSidebarOpen((prev) => !prev)} />

        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderActiveScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Cinematic GSAP Motion Footer under Hafi Digital */}
        <CinematicFooter
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          branchName={currentBranch.name}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
