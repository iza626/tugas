import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import {
  Search,
  Bell,
  Radio,
  User,
  LogOut,
  QrCode,
  Database,
  Menu,
  ShieldCheck,
  Ship,
} from 'lucide-react';
import { QRScannerModal } from '../ui/QRModal';
import { DatabaseSettingsModal } from '../database/DatabaseSettingsModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (menu: string) => void;
  currentMenuTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate, currentMenuTitle }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useRealtime();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-md">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">PORTIVA</span>
              <span className="text-slate-600">/</span>
              <h1 className="text-base font-bold text-slate-100">{currentMenuTitle}</h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistem Manajemen Muatan Kapal, Manifest & Penumpang Terpadu
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Quick Scanner Action for Port Inspectors */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 border border-blue-500/30 text-xs font-medium transition-all shadow-sm"
            title="Scan / Validasi QR Manifest Resmi"
          >
            <QrCode className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Validasi QR Dokumen</span>
          </button>

          {/* Database Info Status */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 text-xs font-medium transition-all"
            title="Status Database & Schema Supabase"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Database Status</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-slate-200 block truncate max-w-[120px]">
                  {user?.full_name || 'Admin'}
                </span>
                <span className="text-[10px] text-sky-400 block -mt-0.5">{user?.role || 'Operator'}</span>
              </div>
            </button>

            {userDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-800/60 rounded text-[10px] font-medium">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      onNavigate('audit');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 text-slate-300 hover:text-white"
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Audit Trail Log</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      setIsDbModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 text-slate-300 hover:text-white"
                  >
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Konfigurasi Database</span>
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <DatabaseSettingsModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </>
  );
};
