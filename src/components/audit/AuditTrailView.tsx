import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, Filter, RefreshCw, Clock, ArrowRight, Eye, X } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs(tableFilter === 'ALL' ? undefined : tableFilter, 150);
      if (res.success) setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [tableFilter]);

  const filtered = logs.filter(
    (l) =>
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase()) ||
      l.record_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-sky-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Audit Trail & Integritas Data Sistem</h2>
            <p className="text-xs text-slate-500">
              Rekam jejak digital perubahan data, otorisasi pengguna, timestamp, dan perbandingan nilai lama vs baru
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Perbarui Log
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari user, ID data, atau deskripsi perubahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Modul / Tabel</option>
            <option value="manifests">manifests (Manifest Kapal)</option>
            <option value="cargo_transactions">cargo_transactions (Muatan)</option>
            <option value="passenger_transactions">passenger_transactions (Penumpang)</option>
            <option value="voyages">voyages (Perjalanan)</option>
            <option value="ships">ships (Kapal)</option>
            <option value="ports">ports (Pelabuhan)</option>
            <option value="admins">admins (Sistem User)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu (Timestamp)</th>
                <th className="py-3 px-4">Pengguna (User)</th>
                <th className="py-3 px-4">Modul / Tabel</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">ID Data</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat log audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada riwayat audit log.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  let actionBadge = 'bg-slate-100 text-slate-700';
                  if (log.action === 'CREATE') actionBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  if (log.action === 'UPDATE') actionBadge = 'bg-blue-50 text-blue-700 border border-blue-200';
                  if (log.action === 'DELETE') actionBadge = 'bg-rose-50 text-rose-700 border border-rose-200';
                  if (log.action === 'CERTIFY') actionBadge = 'bg-purple-50 text-purple-700 border border-purple-200 font-bold';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.user_name}</div>
                        <div className="text-[10px] text-slate-500">{log.user_role}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-900 font-medium">
                        {log.table_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${actionBadge}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{log.record_id}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-blue-600 hover:text-blue-800"
                          title="Lihat Perbandingan Nilai"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for Old vs New Value */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Audit Trail Detail [{selectedLog.record_id}]</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p>
                  <strong className="text-slate-700">Pelaku:</strong> {selectedLog.user_name} ({selectedLog.user_role})
                </p>
                <p>
                  <strong className="text-slate-700">Waktu:</strong> {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                </p>
                <p>
                  <strong className="text-slate-700">Tabel:</strong> {selectedLog.table_name}
                </p>
                <p>
                  <strong className="text-slate-700">Keterangan:</strong> {selectedLog.details}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Nilai Lama (Old Value):</h4>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono">
                    {selectedLog.old_value ? JSON.stringify(JSON.parse(selectedLog.old_value), null, 2) : 'Tidak ada (Baru Dibuat)'}
                  </pre>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Nilai Baru (New Value):</h4>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl overflow-x-auto text-[11px] font-mono">
                    {selectedLog.new_value ? JSON.stringify(JSON.parse(selectedLog.new_value), null, 2) : 'Tidak ada (Dihapus)'}
                  </pre>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
