import React, { useEffect, useState } from 'react';
import { Port, PortStatus } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { Anchor, Plus, Search, Edit2, Trash2, X, CheckCircle, RefreshCw } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const PortsView: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [formData, setFormData] = useState<Partial<Port>>({
    name: '',
    port_code: '',
    city: '',
    province: '',
    country: 'Indonesia',
    port_type: 'Pelabuhan Komersial',
    status: 'Aktif',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { lastEvent, addToast } = useRealtime();

  const loadPorts = async () => {
    try {
      const res = await api.getPorts();
      if (res.success) setPorts(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPorts();
  }, []);

  useEffect(() => {
    if (lastEvent?.type?.startsWith('PORTS_')) {
      loadPorts();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingPort(null);
    setFormData({
      name: '',
      port_code: '',
      city: '',
      province: '',
      country: 'Indonesia',
      port_type: 'Pelabuhan Komersial',
      status: 'Aktif',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (port: Port) => {
    setEditingPort(port);
    setFormData({ ...port });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.port_code?.trim()) {
      setFormError('Nama dan Kode Pelabuhan wajib diisi!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingPort) {
        const res = await api.updatePort(editingPort.id, formData);
        setActionSuccess(`Pelabuhan ${res.data.name} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Data Pelabuhan Diperbarui', message: `Pelabuhan ${res.data.name} berhasil diubah.` });
      } else {
        const res = await api.createPort(formData);
        setActionSuccess(`Pelabuhan ${res.data.name} berhasil ditambahkan.`);
        addToast({ type: 'success', title: 'Pelabuhan Baru Ditambahkan', message: `Pelabuhan ${res.data.name} tersimpan di database.` });
      }
      setIsModalOpen(false);
      loadPorts();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan pelabuhan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deletePort(deleteId);
      setActionSuccess('Pelabuhan berhasil dihapus dari database.');
      addToast({ type: 'warning', title: 'Pelabuhan Dihapus', message: 'Data pelabuhan dihapus dari sistem.' });
      setDeleteId(null);
      loadPorts();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pelabuhan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPorts = ports.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.port_code || p.code || '').toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Master Data Pelabuhan</h2>
            <p className="text-xs text-slate-500">Daftar simpul dermaga keberangkatan dan tujuan pelayaran</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Pelabuhan
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelabuhan, kode (e.g. IDTPP), atau kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Pelabuhan</th>
                <th className="py-3 px-4">Kode Pelabuhan</th>
                <th className="py-3 px-4">Lokasi (Kota & Provinsi)</th>
                <th className="py-3 px-4">Jenis Pelabuhan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data pelabuhan...
                  </td>
                </tr>
              ) : filteredPorts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada pelabuhan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredPorts.map((port) => (
                  <tr key={port.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{port.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{port.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{port.port_code}</td>
                    <td className="py-3 px-4">
                      <div>{port.city}</div>
                      <div className="text-[10px] text-slate-500">
                        {port.province}, {port.country}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{port.port_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          port.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {port.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(port)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(port.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingPort ? `Edit Pelabuhan [${editingPort.name}]` : 'Tambah Pelabuhan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pelabuhan *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Tanjung Priok"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pelabuhan (UN/LOCODE) *</label>
                  <input
                    type="text"
                    required
                    value={formData.port_code || ''}
                    onChange={(e) => setFormData({ ...formData, port_code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: IDTPP"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PortStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Contoh: Jakarta Utara"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province || ''}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Negara</label>
                  <input
                    type="text"
                    value={formData.country || 'Indonesia'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Pelabuhan</label>
                  <input
                    type="text"
                    value={formData.port_type || 'Pelabuhan Utama Internasional'}
                    onChange={(e) => setFormData({ ...formData, port_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Data Pelabuhan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Pelabuhan"
        message="Yakin ingin menghapus pelabuhan ini? Data tidak dapat dihapus jika masih menjadi rute perjalanan kapal aktif."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
