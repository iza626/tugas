/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ShipsView } from './components/master/ShipsView';
import { PortsView } from './components/master/PortsView';
import { PassengersView } from './components/master/PassengersView';
import { CargoTypesView } from './components/master/CargoTypesView';
import { CustomersView } from './components/master/CustomersView';
import { VoyagesView } from './components/transactions/VoyagesView';
import { PassengerTransactionsView } from './components/transactions/PassengerTransactionsView';
import { CargoTransactionsView } from './components/transactions/CargoTransactionsView';
import { ManifestView } from './components/transactions/ManifestView';
import { ReportsHub } from './components/reports/ReportsHub';
import { AuditTrailView } from './components/audit/AuditTrailView';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentMenu, setCurrentMenu] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [targetVoyageId, setTargetVoyageId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 tracking-wider font-semibold uppercase">
          Menghubungkan ke PORTIVA System...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navigateToManifest = (voyageId: string) => {
    setTargetVoyageId(voyageId);
    setCurrentMenu('trans-manifest');
  };

  const getMenuTitle = (menu: string) => {
    switch (menu) {
      case 'dashboard':
        return 'Dashboard Ringkasan Operasional';
      case 'master-ships':
        return 'Master Data Kapal';
      case 'master-ports':
        return 'Master Data Pelabuhan';
      case 'master-passengers':
        return 'Master Data Penumpang';
      case 'master-cargo-types':
        return 'Master Jenis Muatan';
      case 'master-customers':
        return 'Master Customer / Shipper';
      case 'trans-voyages':
        return 'Transaksi Perjalanan Kapal';
      case 'trans-passengers':
        return 'Transaksi Tiket Penumpang';
      case 'trans-cargo':
        return 'Transaksi Muatan Kargo';
      case 'trans-manifest':
        return 'Manifest Kapal Resmi & QR Code';
      case 'report-passengers':
        return 'Laporan Operasional Penumpang';
      case 'report-cargo':
        return 'Laporan Operasional Muatan';
      case 'report-voyages':
        return 'Laporan Perjalanan Kapal';
      case 'report-manifest':
        return 'Laporan Manifest Kapal';
      case 'audit':
        return 'Audit Trail & Integritas Data';
      default:
        return 'PORTIVA Operasional';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <ToastContainer />

      {/* Sidebar Navigation */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menuKey) => {
          setCurrentMenu(menuKey);
          if (menuKey !== 'trans-manifest') {
            setTargetVoyageId(undefined);
          }
        }}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={(menu) => setCurrentMenu(menu)}
          currentMenuTitle={getMenuTitle(currentMenu)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentMenu === 'dashboard' && <DashboardOverview onNavigate={(menu) => setCurrentMenu(menu)} />}
          {currentMenu === 'master-ships' && <ShipsView />}
          {currentMenu === 'master-ports' && <PortsView />}
          {currentMenu === 'master-passengers' && <PassengersView />}
          {currentMenu === 'master-cargo-types' && <CargoTypesView />}
          {currentMenu === 'master-customers' && <CustomersView />}
          {currentMenu === 'trans-voyages' && (
            <VoyagesView onNavigateToManifest={(id) => navigateToManifest(id)} />
          )}
          {currentMenu === 'trans-passengers' && <PassengerTransactionsView />}
          {currentMenu === 'trans-cargo' && <CargoTransactionsView />}
          {currentMenu === 'trans-manifest' && (
            <ManifestView selectedVoyageId={targetVoyageId} />
          )}
          {currentMenu === 'report-passengers' && (
            <ReportsHub initialTab="passengers" onNavigateToManifest={(id) => navigateToManifest(id)} />
          )}
          {currentMenu === 'report-cargo' && (
            <ReportsHub initialTab="cargo" onNavigateToManifest={(id) => navigateToManifest(id)} />
          )}
          {currentMenu === 'report-voyages' && (
            <ReportsHub initialTab="voyages" onNavigateToManifest={(id) => navigateToManifest(id)} />
          )}
          {currentMenu === 'report-manifest' && (
            <ReportsHub initialTab="manifest" onNavigateToManifest={(id) => navigateToManifest(id)} />
          )}
          {currentMenu === 'audit' && <AuditTrailView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainApp />
      </RealtimeProvider>
    </AuthProvider>
  );
}
