import React, { useEffect, useState } from 'react';
import { Passenger, Gender } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { Users, Plus, Search, Edit2, Trash2, X, CheckCircle, RefreshCw } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const PassengersView: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [formData, setFormData] = useState<Partial<Passenger>>({
    full_name: '',
    identity_number: '',
    gender: 'Laki-laki',
    birth_date: '1990-01-01',
    phone: '',
    address: '',
    nationality: 'Indonesia (WNI)',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { lastEvent, addToast } = useRealtime();

  const loadPassengers = async () => {
    try {
      const res = await api.getPassengers();
      if (res.success) setPassengers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengers();
  }, []);

  useEffect(() => {
    if (lastEvent?.type?.startsWith('PASSENGERS_')) {
      loadPassengers();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingPassenger(null);
    setFormData({
      full_name: '',
      identity_number: '',
      gender: 'Laki-laki',
      birth_date: '1990-01-01',
      phone: '',
      address: '',
      nationality: 'Indonesia (WNI)',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Passenger) => {
    setEditingPassenger(p);
    setFormData({ ...p });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name?.trim() || !formData.identity_number?.trim()) {
      setFormError('Nama Lengkap dan Nomor Identitas (NIK/Paspor) wajib diisi!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingPassenger) {
        const res = await api.updatePassenger(editingPassenger.id, formData);
        setActionSuccess(`Data penumpang ${res.data.full_name} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Data Penumpang Diperbarui', message: `Data ${res.data.full_name} berhasil disimpan.` });
      } else {
        const res = await api.createPassenger(formData);
        setActionSuccess(`Penumpang ${res.data.full_name} berhasil didaftarkan.`);
        addToast({ type: 'success', title: 'Penumpang Baru Terdaftar', message: `Data ${res.data.full_name} tersimpan di database.` });
      }
      setIsModalOpen(false);
      loadPassengers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan penumpang.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deletePassenger(deleteId);
      setActionSuccess('Data penumpang berhasil dihapus.');
      addToast({ type: 'warning', title: 'Penumpang Dihapus', message: 'Data penumpang telah dihapus dari sistem.' });
      setDeleteId(null);
      loadPassengers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data penumpang.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = passengers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.identity_number.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Master Data Penumpang</h2>
            <p className="text-xs text-slate-500">Pangkalan data identitas manifest penumpang kapal</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Penumpang
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
            placeholder="Cari berdasarkan nama lengkap, NIK/Paspor, atau no. telepon..."
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
                <th className="py-3 px-4">Nama Penumpang</th>
                <th className="py-3 px-4">Nomor Identitas (NIK/Paspor)</th>
                <th className="py-3 px-4">Gender & Tgl Lahir</th>
                <th className="py-3 px-4">Kontak Telepon</th>
                <th className="py-3 px-4">Alamat Domisili</th>
                <th className="py-3 px-4">Kewarganegaraan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data penumpang...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data penumpang.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{p.identity_number}</td>
                    <td className="py-3 px-4">
                      <div>{p.gender}</div>
                      <div className="text-[10px] text-slate-500">{p.birth_date}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.phone || '-'}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={p.address}>
                      {p.address || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.nationality}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
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
                {editingPassenger ? `Edit Penumpang [${editingPassenger.full_name}]` : 'Daftarkan Penumpang Baru'}
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
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Sesuai KTP/Paspor *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Identitas (NIK/Paspor) *</label>
                  <input
                    type="text"
                    required
                    value={formData.identity_number || ''}
                    onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })}
                    placeholder="16 Digit NIK"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender || 'Laki-laki'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.birth_date || '1990-01-01'}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap penumpang..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kewarganegaraan</label>
                <input
                  type="text"
                  value={formData.nationality || 'Indonesia (WNI)'}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Data Penumpang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Penumpang"
        message="Yakin ingin menghapus data penumpang ini? Aksi ini akan dicatat dalam Audit Trail."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
