/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

const DashboardContent: React.FC = () => {
  const { activeTab } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar onToggleMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {renderActiveScreen()}
          </div>
        </main>
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
