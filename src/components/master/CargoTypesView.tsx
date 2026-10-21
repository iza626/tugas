import React, { useEffect, useState } from 'react';
import { CargoType, CargoCategory } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { Package, Plus, Search, Edit2, Trash2, X, CheckCircle, RefreshCw } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const CargoTypesView: React.FC = () => {
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoType | null>(null);
  const [formData, setFormData] = useState<Partial<CargoType>>({
    name: '',
    category: 'Container',
    unit: 'TEU / Box',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { lastEvent, addToast } = useRealtime();

  const loadData = async () => {
    try {
      const res = await api.getCargoTypes();
      if (res.success) setCargoTypes(res.data);
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
    if (lastEvent?.type?.startsWith('CARGO_TYPES_')) {
      loadData();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Container',
      unit: 'TEU / Box',
      description: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CargoType) => {
    setEditingItem(c);
    setFormData({ ...c });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.unit?.trim()) {
      setFormError('Nama/Jenis Muatan dan Satuan wajib diisi!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        const res = await api.updateCargoType(editingItem.id, formData);
        setActionSuccess(`Jenis muatan ${res.data.name} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Jenis Muatan Diperbarui', message: `Data ${res.data.name} berhasil disimpan.` });
      } else {
        const res = await api.createCargoType(formData);
        setActionSuccess(`Jenis muatan ${res.data.name} berhasil ditambahkan.`);
        addToast({ type: 'success', title: 'Jenis Muatan Baru', message: `Data ${res.data.name} tersimpan di database.` });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan jenis muatan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteCargoType(deleteId);
      setActionSuccess('Jenis muatan berhasil dihapus dari database.');
      addToast({ type: 'warning', title: 'Jenis Muatan Dihapus', message: 'Data jenis muatan telah dihapus.' });
      setDeleteId(null);
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jenis muatan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = cargoTypes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.unit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Master Data Jenis Muatan</h2>
            <p className="text-xs text-slate-500">Kategori, klasifikasi, dan satuan standar muatan barang kapal</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Jenis Muatan
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
            placeholder="Cari jenis muatan, kategori, atau satuan..."
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
                <th className="py-3 px-4">Nama / Jenis Muatan</th>
                <th className="py-3 px-4">Kategori Muatan</th>
                <th className="py-3 px-4">Satuan Ukuran</th>
                <th className="py-3 px-4">Keterangan Spesifikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat jenis muatan...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ditemukan jenis muatan.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{c.unit}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs">{c.description || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingItem ? `Edit Jenis Muatan [${editingItem.name}]` : 'Tambah Jenis Muatan Baru'}
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
                <label className="block font-semibold text-slate-700 mb-1">Nama / Deskripsi Jenis Muatan *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kontainer Kering 20ft (FCL)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Muatan</label>
                  <select
                    value={formData.category || 'Container'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CargoCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="General Cargo">General Cargo</option>
                    <option value="Container">Container</option>
                    <option value="Bulk Cargo">Bulk Cargo</option>
                    <option value="Liquid Cargo">Liquid Cargo</option>
                    <option value="Dangerous Goods">Dangerous Goods</option>
                    <option value="Kendaraan">Kendaraan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Standar *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Contoh: TEU / Box, Ton, Unit"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Instruksi penanganan atau karakteristik muatan..."
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
                  {submitting ? 'Menyimpan...' : 'Simpan Jenis Muatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Jenis Muatan"
        message="Yakin ingin menghapus jenis muatan ini? Aksi ini akan dicatat dalam Audit Trail."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
