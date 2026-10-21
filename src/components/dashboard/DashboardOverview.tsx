import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import {
  Ship,
  Users,
  Package,
  Navigation,
  ArrowUpRight,
  ArrowDownLeft,
  FileCheck2,
  RefreshCw,
  Clock,
  Compass,
  Anchor,
  TrendingUp,
  Radio,
} from 'lucide-react';

export const DashboardOverview: React.FC<{ onNavigate: (menu: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useRealtime();

  const loadStats = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Real-time re-fetch when relevant events arrive
  useEffect(() => {
    if (lastEvent) {
      loadStats();
    }
  }, [lastEvent]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-medium">Memuat data real-time dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Kapal',
      value: stats?.totalShips || 0,
      subtext: `${stats?.activeShips || 0} Aktif · ${stats?.maintenanceShips || 0} Maintenance`,
      icon: Ship,
      color: 'from-blue-600 to-sky-700',
      menu: 'master-ships',
    },
    {
      title: 'Total Penumpang',
      value: stats?.totalPassengers || 0,
      subtext: `${stats?.boardedPassengers || 0} Penumpang Boarded`,
      icon: Users,
      color: 'from-indigo-600 to-blue-700',
      menu: 'trans-passengers',
    },
    {
      title: 'Total Muatan',
      value: `${stats?.totalCargoWeight || 0} Ton`,
      subtext: `${stats?.totalCargoVolume || 0} m³ · ${stats?.totalCargoTrans || 0} Transaksi`,
      icon: Package,
      color: 'from-cyan-600 to-teal-700',
      menu: 'trans-cargo',
    },
    {
      title: 'Total Perjalanan',
      value: stats?.totalVoyages || 0,
      subtext: `${stats?.scheduledVoyages || 0} Terjadwal Aktif`,
      icon: Navigation,
      color: 'from-sky-600 to-indigo-700',
      menu: 'trans-voyages',
    },
    {
      title: 'Kapal Berangkat',
      value: stats?.departedVoyages || 0,
      subtext: 'Sedang berlayar di laut',
      icon: ArrowUpRight,
      color: 'from-amber-600 to-orange-700',
      menu: 'trans-voyages',
    },
    {
      title: 'Kapal Tiba',
      value: stats?.arrivedVoyages || 0,
      subtext: 'Berlabuh di dermaga tujuan',
      icon: ArrowDownLeft,
      color: 'from-emerald-600 to-teal-700',
      menu: 'trans-voyages',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Maritime Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Compass className="w-72 h-72 text-sky-400" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              SISTEM MARITIM REAL-TIME
            </span>
            <span className="text-xs text-slate-400">Pembaruan Database Otomatis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pusat Komando Operasional Pelabuhan & Pelayaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Pantau pergerakan kapal, muatan kargo, manifes penumpang, serta status pengesahan dokumen
            Syahbandar secara akurat, aman, dan tersinkronisasi.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('trans-manifest')}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              Kelola Manifest Kapal
            </button>
            <button
              onClick={() => onNavigate('trans-voyages')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              Jadwal Perjalanan
            </button>
          </div>
        </div>
      </div>

      {/* 6 Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.menu)}
              className="group cursor-pointer bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all hover:border-blue-400 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight group-hover:text-blue-900 transition-colors">
                    {card.value}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">{card.subtext}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md shadow-blue-900/10 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphs & Operational Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Passengers Per Voyage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Jumlah Penumpang per Perjalanan
              </h4>
              <p className="text-[11px] text-slate-500">Distribusi tiket penumpang per nomor pelayaran</p>
            </div>
            <button
              onClick={() => onNavigate('trans-passengers')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Lihat Detail &rarr;
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {stats?.passengersPerVoyage && stats.passengersPerVoyage.length > 0 ? (
              stats.passengersPerVoyage.map((item, i) => {
                const maxPassengers = 1500;
                const percentage = Math.min(100, Math.max(8, (item.passenger_count / 10) * 100));
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.voyage_number}</span>
                      <span className="font-mono text-blue-900 font-bold">{item.passenger_count} Penumpang</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-600 block">{item.ship_name}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada data perjalanan penumpang.</p>
            )}
          </div>
        </div>

        {/* Graph 2: Cargo Weight Per Voyage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-600" />
                Tonase Muatan per Perjalanan
              </h4>
              <p className="text-[11px] text-slate-500">Total berat muatan (Ton) yang diangkut kapal</p>
            </div>
            <button
              onClick={() => onNavigate('trans-cargo')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Lihat Detail &rarr;
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {stats?.cargoPerVoyage && stats.cargoPerVoyage.length > 0 ? (
              stats.cargoPerVoyage.map((item, i) => {
                const percentage = Math.min(100, Math.max(10, (item.cargo_weight_ton / 150) * 100));
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.voyage_number}</span>
                      <span className="font-mono text-cyan-800 font-bold">{item.cargo_weight_ton} Ton</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-600 block">{item.ship_name}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada data muatan kapal.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Operational Voyages */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Anchor className="w-5 h-5 text-blue-700" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Perjalanan Kapal Aktif Terkini</h4>
              <p className="text-[11px] text-slate-500">Status keberangkatan dan estimasi waktu kedatangan</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('trans-voyages')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Kelola Semua Perjalanan &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Pelayaran</th>
                <th className="py-2.5 px-3">Waktu Berangkat</th>
                <th className="py-2.5 px-3">Estimasi Tiba</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recentVoyages && stats.recentVoyages.length > 0 ? (
                stats.recentVoyages.map((v) => {
                  let badge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (v.status === 'Scheduled') badge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (v.status === 'Boarding') badge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (v.status === 'Departed') badge = 'bg-purple-50 text-purple-700 border-purple-200';
                  if (v.status === 'Arrived') badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (v.status === 'Cancelled') badge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{v.voyage_number}</td>
                      <td className="py-3 px-3">
                        {v.departure_date} pukul {v.departure_time}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{v.estimated_arrival}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onNavigate('trans-manifest')}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors"
                        >
                          Manifest
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Tidak ada jadwal perjalanan aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
