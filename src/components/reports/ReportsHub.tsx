import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Voyage, Ship, Port, PassengerTransaction, CargoTransaction, Manifest } from '../../types';
import {
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  Calendar,
  Ship as ShipIcon,
  Users,
  Package,
  Navigation,
  RefreshCw,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

type ReportTab = 'passengers' | 'cargo' | 'voyages' | 'manifest';

export const ReportsHub: React.FC<{ initialTab?: ReportTab; onNavigateToManifest?: (voyageId: string) => void }> = ({
  initialTab = 'passengers',
  onNavigateToManifest,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const [loading, setLoading] = useState(true);

  // Raw Database Records
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [passengerTrx, setPassengerTrx] = useState<PassengerTransaction[]>([]);
  const [cargoTrx, setCargoTrx] = useState<CargoTransaction[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [shipFilter, setShipFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes, pRes, ptRes, ctRes, mRes] = await Promise.all([
        api.getVoyages(),
        api.getShips(),
        api.getPorts(),
        api.getPassengerTransactions(),
        api.getCargoTransactions(),
        api.getManifests(),
      ]);
      if (vRes.success) setVoyages(vRes.data);
      if (sRes.success) setShips(sRes.data);
      if (pRes.success) setPorts(pRes.data);
      if (ptRes.success) setPassengerTrx(ptRes.data);
      if (ctRes.success) setCargoTrx(ctRes.data);
      if (mRes.success) setManifests(mRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handlePrint = () => {
    window.print();
  };

  // CSV Export utility
  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (activeTab === 'passengers') {
      const headers = ['No Tiket', 'Perjalanan', 'Kapal', 'Kelas', 'Tanggal', 'Pembayaran', 'Status Boarding'];
      const rows = passengerTrx.map((pt) => {
        const v = voyages.find((x) => x.id === pt.voyage_id);
        const s = v ? ships.find((ship) => ship.id === v.ship_id) : null;
        return [
          pt.ticket_number,
          v?.voyage_number || pt.voyage_id,
          s?.name || '-',
          pt.class,
          pt.transaction_date,
          pt.payment_status,
          pt.boarding_status,
        ];
      });
      exportCSV(`Laporan_Penumpang_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeTab === 'cargo') {
      const headers = ['No Dokumen', 'Nama Barang', 'Perjalanan', 'Berat (Ton)', 'Volume (m3)', 'Status Muatan'];
      const rows = cargoTrx.map((c) => {
        const v = voyages.find((x) => x.id === c.voyage_id);
        return [c.document_number, c.item_name, v?.voyage_number || c.voyage_id, c.weight_ton, c.volume_m3 || 0, c.status];
      });
      exportCSV(`Laporan_Muatan_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeTab === 'voyages') {
      const headers = ['No Pelayaran', 'Kapal', 'Pelabuhan Asal', 'Pelabuhan Tujuan', 'Tgl Berangkat', 'ETA', 'Status'];
      const rows = voyages.map((v) => {
        const s = ships.find((x) => x.id === v.ship_id);
        const o = ports.find((x) => x.id === v.origin_port_id);
        const d = ports.find((x) => x.id === v.destination_port_id);
        return [v.voyage_number, s?.name || '-', o?.name || '-', d?.name || '-', v.departure_date, v.estimated_arrival, v.status];
      });
      exportCSV(`Laporan_Perjalanan_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeTab === 'manifest') {
      const headers = ['No Manifest', 'No Pelayaran', 'Penumpang', 'Total Muatan (Ton)', 'Status', 'Pengesah'];
      const rows = manifests.map((m) => {
        const v = voyages.find((x) => x.id === m.voyage_id);
        return [m.manifest_number, v?.voyage_number || m.voyage_id, m.total_passengers, m.total_weight_ton, m.status, m.certified_by || '-'];
      });
      exportCSV(`Laporan_Manifest_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            Laporan Operasional Pelayaran
          </h2>
          <p className="text-xs text-slate-500">
            Pusat laporan resmi real-time penumpang, muatan kargo, perjalanan kapal, dan manifest
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV / Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-950/20"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan / PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 print:hidden overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('passengers')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'passengers'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Laporan Penumpang
        </button>
        <button
          onClick={() => setActiveTab('cargo')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'cargo'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          2. Laporan Muatan
        </button>
        <button
          onClick={() => setActiveTab('voyages')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'voyages'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" />
          3. Laporan Perjalanan
        </button>
        <button
          onClick={() => setActiveTab('manifest')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'manifest'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          4. Laporan Manifest
        </button>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pencarian umum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={shipFilter}
            onChange={(e) => setShipFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Kapal</option>
            {ships.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Dari Tanggal"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Sampai Tanggal"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Content Container (Printable Letterhead) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4">
          <h1 className="text-base font-black">PORTIVA - LAPORAN RESMI KESYAHBANDARAN</h1>
          <p className="text-xs text-slate-600">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Memuat data laporan langsung dari database...
          </div>
        ) : (
          <>
            {/* 1. LAPORAN PENUMPANG */}
            {activeTab === 'passengers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900">Rekapitulasi Data Tiket Penumpang</h3>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Total: {passengerTrx.length} Penumpang
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">No. Tiket</th>
                        <th className="py-2.5 px-3">Periode Tanggal</th>
                        <th className="py-2.5 px-3">Kapal</th>
                        <th className="py-2.5 px-3">Perjalanan</th>
                        <th className="py-2.5 px-3">Kelas</th>
                        <th className="py-2.5 px-3 text-right">Status Penumpang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {passengerTrx.map((pt) => {
                        const voyage = voyages.find((v) => v.id === pt.voyage_id);
                        const ship = voyage ? ships.find((s) => s.id === voyage.ship_id) : null;
                        return (
                          <tr key={pt.id}>
                            <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">{pt.ticket_number}</td>
                            <td className="py-2.5 px-3">{pt.transaction_date}</td>
                            <td className="py-2.5 px-3 font-medium">{ship?.name || '-'}</td>
                            <td className="py-2.5 px-3 font-mono">{voyage?.voyage_number || pt.voyage_id}</td>
                            <td className="py-2.5 px-3">{pt.class}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {pt.boarding_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. LAPORAN MUATAN */}
            {activeTab === 'cargo' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900">Rekapitulasi Manifest Kargo & Muatan</h3>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Total: {cargoTrx.length} Item Kargo
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">No. Dokumen</th>
                        <th className="py-2.5 px-3">Nama Muatan</th>
                        <th className="py-2.5 px-3">Kapal</th>
                        <th className="py-2.5 px-3">Berat (Ton)</th>
                        <th className="py-2.5 px-3">Volume (m³)</th>
                        <th className="py-2.5 px-3">Pelabuhan Muat &rarr; Bongkar</th>
                        <th className="py-2.5 px-3 text-right">Status Muatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {cargoTrx.map((c) => {
                        const voyage = voyages.find((v) => v.id === c.voyage_id);
                        const ship = voyage ? ships.find((s) => s.id === voyage.ship_id) : null;
                        const lp = ports.find((p) => p.id === c.loading_port_id);
                        const dp = ports.find((p) => p.id === c.discharge_port_id);
                        return (
                          <tr key={c.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{c.document_number}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{c.item_name}</td>
                            <td className="py-2.5 px-3">{ship?.name || '-'}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">{c.weight_ton} Ton</td>
                            <td className="py-2.5 px-3 font-mono">{c.volume_m3} m³</td>
                            <td className="py-2.5 px-3">
                              {lp?.name || '-'} &rarr; {dp?.name || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. LAPORAN PERJALANAN */}
            {activeTab === 'voyages' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900">Rekapitulasi Operasional Perjalanan Kapal</h3>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Total: {voyages.length} Pelayaran
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">No. Pelayaran</th>
                        <th className="py-2.5 px-3">Kapal</th>
                        <th className="py-2.5 px-3">Rute Dermaga</th>
                        <th className="py-2.5 px-3">Waktu Berangkat</th>
                        <th className="py-2.5 px-3">Estimasi Kedatangan</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {voyages.map((v) => {
                        const ship = ships.find((s) => s.id === v.ship_id);
                        const origin = ports.find((p) => p.id === v.origin_port_id);
                        const dest = ports.find((p) => p.id === v.destination_port_id);
                        return (
                          <tr key={v.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{v.voyage_number}</td>
                            <td className="py-2.5 px-3 font-medium text-blue-900">{ship?.name || '-'}</td>
                            <td className="py-2.5 px-3">
                              {origin?.name} &rarr; {dest?.name}
                            </td>
                            <td className="py-2.5 px-3">
                              {v.departure_date} ({v.departure_time})
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{v.estimated_arrival}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border">
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. LAPORAN MANIFEST */}
            {activeTab === 'manifest' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900">Arsip Manifest Kapal Terdaftar</h3>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Total: {manifests.length} Manifest
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Nomor Manifest</th>
                        <th className="py-2.5 px-3">Pelayaran</th>
                        <th className="py-2.5 px-3">Total Penumpang</th>
                        <th className="py-2.5 px-3">Total Berat (Ton)</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Pengesah</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {manifests.map((m) => {
                        const voyage = voyages.find((v) => v.id === m.voyage_id);
                        return (
                          <tr key={m.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{m.manifest_number}</td>
                            <td className="py-2.5 px-3">{voyage?.voyage_number || m.voyage_id}</td>
                            <td className="py-2.5 px-3 font-bold">{m.total_passengers} Orang</td>
                            <td className="py-2.5 px-3 font-bold font-mono">{m.total_weight_ton} Ton</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.status === 'Certified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{m.certified_by || '-'}</td>
                            <td className="py-2.5 px-3 text-right">
                              {onNavigateToManifest && (
                                <button
                                  onClick={() => onNavigateToManifest(m.voyage_id)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                                >
                                  Buka Dokumen &rarr;
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
