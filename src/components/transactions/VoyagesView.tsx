import React, { useEffect, useState } from 'react';
import { Voyage, VoyageStatus, Ship, Port } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { Navigation, Plus, Search, Edit2, Trash2, X, CheckCircle, RefreshCw, Calendar, ArrowRight, FileCheck } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const VoyagesView: React.FC<{ onNavigateToManifest?: (voyageId: string) => void }> = ({
  onNavigateToManifest,
}) => {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Voyage | null>(null);
  const [formData, setFormData] = useState<Partial<Voyage>>({
    voyage_number: '',
    ship_id: '',
    origin_port_id: '',
    destination_port_id: '',
    departure_date: new Date().toISOString().split('T')[0],
    departure_time: '10:00',
    estimated_arrival: '',
    status: 'Scheduled',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { lastEvent, addToast } = useRealtime();

  const loadAll = async () => {
    try {
      const [vRes, sRes, pRes] = await Promise.all([api.getVoyages(), api.getShips(), api.getPorts()]);
      if (vRes.success) setVoyages(vRes.data);
      if (sRes.success) setShips(sRes.data);
      if (pRes.success) setPorts(pRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (lastEvent?.type?.startsWith('VOYAGES_')) {
      loadAll();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      voyage_number: `VYG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      ship_id: ships[0]?.id || '',
      origin_port_id: ports[0]?.id || '',
      destination_port_id: ports[1]?.id || '',
      departure_date: new Date().toISOString().split('T')[0],
      departure_time: '08:00',
      estimated_arrival: 'Besok, 12:00',
      status: 'Scheduled',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Voyage) => {
    setEditingItem(v);
    setFormData({ ...v });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voyage_number?.trim() || !formData.ship_id || !formData.origin_port_id || !formData.destination_port_id) {
      setFormError('Nomor Pelayaran, Kapal, Pelabuhan Asal & Tujuan wajib dipilih!');
      return;
    }
    if (formData.origin_port_id === formData.destination_port_id) {
      setFormError('Pelabuhan Asal dan Pelabuhan Tujuan tidak boleh sama!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        const res = await api.updateVoyage(editingItem.id, formData);
        setActionSuccess(`Perjalanan ${res.data.voyage_number} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Perjalanan Diperbarui', message: `Status jadwal ${res.data.voyage_number} disimpan.` });
      } else {
        const res = await api.createVoyage(formData);
        setActionSuccess(`Perjalanan ${res.data.voyage_number} berhasil dijadwalkan.`);
        addToast({ type: 'success', title: 'Perjalanan Dijadwalkan', message: `Perjalanan ${res.data.voyage_number} tersimpan di database.` });
      }
      setIsModalOpen(false);
      loadAll();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan perjalanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteVoyage(deleteId);
      setActionSuccess('Perjalanan kapal berhasil dihapus dari database.');
      addToast({ type: 'warning', title: 'Perjalanan Dihapus', message: 'Data perjalanan kapal telah dihapus.' });
      setDeleteId(null);
      loadAll();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perjalanan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = voyages.filter((v) => {
    const ship = ships.find((s) => s.id === v.ship_id);
    const origin = ports.find((p) => p.id === v.origin_port_id);
    const dest = ports.find((p) => p.id === v.destination_port_id);

    const matchSearch =
      v.voyage_number.toLowerCase().includes(search.toLowerCase()) ||
      (ship && ship.name.toLowerCase().includes(search.toLowerCase())) ||
      (origin && origin.name.toLowerCase().includes(search.toLowerCase())) ||
      (dest && dest.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Transaksi Perjalanan Kapal (Voyages)</h2>
            <p className="text-xs text-slate-500">Jadwal pelayaran, rute dermaga asal-tujuan, dan kontrol status</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Jadwalkan Perjalanan Baru
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. pelayaran, nama kapal, atau nama pelabuhan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Status Perjalanan</option>
            <option value="Scheduled">Scheduled (Terjadwal)</option>
            <option value="Boarding">Boarding (Proses Naik)</option>
            <option value="Departed">Departed (Berlayar)</option>
            <option value="Arrived">Arrived (Tiba)</option>
            <option value="Cancelled">Cancelled (Dibatalkan)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Pelayaran</th>
                <th className="py-3 px-4">Armada Kapal</th>
                <th className="py-3 px-4">Rute (Asal &rarr; Tujuan)</th>
                <th className="py-3 px-4">Jadwal Keberangkatan</th>
                <th className="py-3 px-4">Estimasi Tiba</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data pelayaran...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data pelayaran yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const ship = ships.find((s) => s.id === v.ship_id);
                  const origin = ports.find((p) => p.id === v.origin_port_id);
                  const dest = ports.find((p) => p.id === v.destination_port_id);

                  let badge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (v.status === 'Scheduled') badge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (v.status === 'Boarding') badge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (v.status === 'Departed') badge = 'bg-purple-50 text-purple-700 border-purple-200';
                  if (v.status === 'Arrived') badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (v.status === 'Cancelled') badge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.voyage_number}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{v.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blue-900">{ship?.name || 'Kapal Tidak Ditemukan'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ship?.imo_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{origin?.name || v.origin_port_id}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{dest?.name || v.destination_port_id}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {origin?.port_code} &rarr; {dest?.port_code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{v.departure_date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Pukul {v.departure_time} WIB</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{v.estimated_arrival}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onNavigateToManifest && (
                            <button
                              onClick={() => onNavigateToManifest(v.id)}
                              title="Buka Dokumen Manifest"
                              className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Manifest
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(v)}
                            title="Edit Perjalanan"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(v.id)}
                            title="Hapus Perjalanan"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingItem ? `Edit Perjalanan [${editingItem.voyage_number}]` : 'Jadwalkan Perjalanan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Pelayaran / Voyage Number *</label>
                <input
                  type="text"
                  required
                  value={formData.voyage_number || ''}
                  onChange={(e) => setFormData({ ...formData, voyage_number: e.target.value })}
                  placeholder="Contoh: VYG/PRIOK-PERAK/082"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Armada Kapal *</label>
                <select
                  required
                  value={formData.ship_id || ''}
                  onChange={(e) => setFormData({ ...formData, ship_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="">Pilih Kapal...</option>
                  {ships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.ship_type}) - Status: {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pelabuhan Asal (Origin) *</label>
                  <select
                    required
                    value={formData.origin_port_id || ''}
                    onChange={(e) => setFormData({ ...formData, origin_port_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Pelabuhan Asal...</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.port_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pelabuhan Tujuan (Destination) *</label>
                  <select
                    required
                    value={formData.destination_port_id || ''}
                    onChange={(e) => setFormData({ ...formData, destination_port_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Pelabuhan Tujuan...</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.port_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Keberangkatan *</label>
                  <input
                    type="date"
                    required
                    value={formData.departure_date || ''}
                    onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu Keberangkatan *</label>
                  <input
                    type="time"
                    required
                    value={formData.departure_time || '08:00'}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Kedatangan (ETA)</label>
                  <input
                    type="text"
                    value={formData.estimated_arrival || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_arrival: e.target.value })}
                    placeholder="Contoh: 2026-10-09 14:00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Perjalanan</label>
                  <select
                    value={formData.status || 'Scheduled'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VoyageStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Scheduled">Scheduled (Terjadwal)</option>
                    <option value="Boarding">Boarding (Proses Naik)</option>
                    <option value="Departed">Departed (Berlayar)</option>
                    <option value="Arrived">Arrived (Tiba)</option>
                    <option value="Cancelled">Cancelled (Dibatalkan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan Operasional</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Kondisi cuaca, muatan khusus, atau instruksi Syahbandar..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-blue-900 hover:bg-blue-800 font-semibold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal Perjalanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Perjalanan Kapal"
        message="Yakin ingin menghapus perjalanan ini? Perjalanan tidak dapat dihapus jika sudah terdapat transaksi penumpang atau muatan kargo."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
