import React, { useEffect, useState } from 'react';
import { Database, Copy, Check, Download, Server, HardDrive, RefreshCw, X, Shield } from 'lucide-react';
import { api } from '../../services/api';

export const DatabaseSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getDatabaseSchemaInfo()
        .then((res) => {
          setDbInfo(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copySqlSchema = async () => {
    try {
      const res = await fetch('/supabase_schema.sql');
      const text = await res.text();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  const downloadSql = async () => {
    try {
      const res = await fetch('/supabase_schema.sql');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portiva_supabase_schema.sql';
      a.click();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-400/30">
              <Database className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Status Database & Integrasi Supabase</h3>
              <p className="text-xs text-sky-200">Real Database Persistent Relational Engine & Schema Export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Active Backend Engine Status */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-4 rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  DATABASE MANDIRI AKTIF (TANPA GOOGLE CLOUD PROJECT)
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Auto-Persistent
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-2">
              PORTIVA beroperasi menggunakan <strong>Database Server Mandiri</strong>. Anda <strong>tidak perlu mendaftar Google Cloud Project, akun cloud eksternal, ataupun kartu kredit</strong>. Seluruh data kapal, penumpang, muatan, dan manifest tersimpan secara permanen dan tersinkronisasi otomatis secara <strong>real-time di semua akun</strong>.
            </p>
          </div>

          {/* Table Record Statistics */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              Statistik Jumlah Data per Tabel Relasional
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {dbInfo?.stats ? (
                Object.entries(dbInfo.stats).map(([table, count]: [string, any]) => (
                  <div key={table} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                    <span className="text-[10px] text-slate-500 font-medium block truncate capitalize">
                      {table.replace(/_/g, ' ')}
                    </span>
                    <span className="text-base font-bold text-blue-900">{count}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-xs text-slate-400 text-center py-2">Memuat statistik database...</div>
              )}
            </div>
          </div>

          {/* Supabase Schema Section */}
          <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h5 className="font-semibold text-xs text-slate-200">Supabase / Neon DB Schema Script</h5>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copySqlSchema}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Salin SQL'}
                </button>
                <button
                  onClick={downloadSql}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh .sql
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              File <code className="text-sky-300">supabase_schema.sql</code> telah disediakan lengkap dengan struktur DDL
              11 tabel, primary key, foreign key cascading, constraint enum status, dan indeks query berkecepatan tinggi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
