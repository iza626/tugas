import React from 'react';
import {
  LayoutDashboard,
  Ship,
  Anchor,
  Users,
  Package,
  Building2,
  Navigation,
  Ticket,
  Truck,
  FileCheck2,
  BarChart3,
  FileText,
  ShieldCheck,
  LogOut,
  X,
  Compass,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentMenu: string;
  onSelectMenu: (menuKey: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onCloseMobile,
}) => {
  const { logout, user } = useAuth();

  const menuSections = [
    {
      title: 'UTAMA',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { key: 'master-ships', label: 'Data Kapal', icon: Ship },
        { key: 'master-ports', label: 'Data Pelabuhan', icon: Anchor },
        { key: 'master-passengers', label: 'Data Penumpang', icon: Users },
        { key: 'master-cargo-types', label: 'Jenis Muatan', icon: Package },
        { key: 'master-customers', label: 'Customer / Shipper', icon: Building2 },
      ],
    },
    {
      title: 'TRANSAKSI DATA',
      items: [
        { key: 'trans-voyages', label: 'Perjalanan Kapal', icon: Navigation },
        { key: 'trans-passengers', label: 'Transaksi Penumpang', icon: Ticket },
        { key: 'trans-cargo', label: 'Transaksi Muatan', icon: Truck },
        { key: 'trans-manifest', label: 'Manifest Kapal', icon: FileCheck2 },
      ],
    },
    {
      title: 'LAPORAN OPERASIONAL',
      items: [
        { key: 'report-passengers', label: 'Laporan Penumpang', icon: FileText },
        { key: 'report-cargo', label: 'Laporan Muatan', icon: FileText },
        { key: 'report-voyages', label: 'Laporan Perjalanan', icon: FileText },
        { key: 'report-manifest', label: 'Laporan Manifest', icon: BarChart3 },
      ],
    },
    {
      title: 'SISTEM & KEAMANAN',
      items: [
        { key: 'audit', label: 'Audit Trail Log', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-600/20 border border-sky-400/30">
              <Compass className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">PORTIVA</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  MARITIME
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Manajemen Muatan & Penumpang</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {menuSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {sec.title}
              </h3>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentMenu === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onSelectMenu(item.key);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Admin Status & Logout */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="truncate">
              <p className="font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-sky-400 font-mono truncate">{user?.role}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Logout dari Sistem"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
