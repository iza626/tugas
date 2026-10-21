import React, { useEffect, useState } from 'react';
import { Ship, ShipStatus } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import {
  Ship as ShipIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  X,
  CheckCircle,
} from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const ShipsView: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);
  const [formData, setFormData] = useState<Partial<Ship>>({
    name: '',
    imo_number: '',
    ship_type: 'Roll-on/Roll-off (Ro-Ro)',
    flag: 'Indonesia (ID)',
    gt: 5000,
    dwt: 3000,
    passenger_capacity: 500,
    cargo_capacity: 2500,
    build_year: 2018,
    status: 'Aktif',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { lastEvent, addToast } = useRealtime();

  const loadShips = async () => {
    try {
      const res = await api.getShips();
      if (res.success) setShips(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShips();
  }, []);

  useEffect(() => {
    if (lastEvent?.type?.startsWith('SHIPS_')) {
      loadShips();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingShip(null);
    setFormData({
      name: '',
      imo_number: '',
      ship_type: 'Roll-on/Roll-off (Ro-Ro)',
      flag: 'Indonesia (ID)',
      gt: 5000,
      dwt: 3000,
      passenger_capacity: 500,
      cargo_capacity: 2500,
      build_year: 2020,
      status: 'Aktif',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ship: Ship) => {
    setEditingShip(ship);
    setFormData({ ...ship });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.imo_number?.trim()) {
      setFormError('Nama Kapal dan IMO Number wajib diisi!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingShip) {
        const res = await api.updateShip(editingShip.id, formData);
        setActionSuccess(`Kapal ${res.data.name} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Data Kapal Diperbarui', message: `Kapal ${res.data.name} berhasil diubah.` });
      } else {
        const res = await api.createShip(formData);
        setActionSuccess(`Kapal ${res.data.name} berhasil ditambahkan ke database.`);
        addToast({ type: 'success', title: 'Data Kapal Baru', message: `Kapal ${res.data.name} berhasil disimpan.` });
      }
      setIsModalOpen(false);
      loadShips();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data kapal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteShip(deleteId);
      setActionSuccess('Kapal berhasil dihapus dari database.');
      addToast({ type: 'warning', title: 'Kapal Dihapus', message: 'Data kapal telah dihapus dari sistem.' });
      setDeleteId(null);
      loadShips();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kapal.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredShips = ships.filter((ship) => {
    const matchesSearch =
      ship.name.toLowerCase().includes(search.toLowerCase()) ||
      ship.imo_number.toLowerCase().includes(search.toLowerCase()) ||
      ship.ship_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <ShipIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Master Data Kapal</h2>
            <p className="text-xs text-slate-500">
              Registrasi dan manajemen spesifikasi armada kapal pelayaran
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Kapal Baru
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kapal, IMO number, atau jenis kapal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Status Kapal</option>
            <option value="Aktif">Aktif</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Ships Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID & Nama Kapal</th>
                <th className="py-3 px-4">IMO Number</th>
                <th className="py-3 px-4">Jenis & Bendera</th>
                <th className="py-3 px-4">GT / DWT</th>
                <th className="py-3 px-4">Kapasitas</th>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data kapal...
                  </td>
                </tr>
              ) : filteredShips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data kapal yang cocok.
                  </td>
                </tr>
              ) : (
                filteredShips.map((ship) => {
                  let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (ship.status === 'Aktif') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (ship.status === 'Maintenance') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (ship.status === 'Tidak Aktif') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={ship.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ship.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ship.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{ship.imo_number}</td>
                      <td className="py-3 px-4">
                        <div>{ship.ship_type}</div>
                        <div className="text-[10px] text-slate-500">{ship.flag}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>GT: {Number(ship.gt).toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-slate-500">DWT: {Number(ship.dwt).toLocaleString('id-ID')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{ship.passenger_capacity} Penumpang</div>
                        <div className="text-[10px] text-slate-500">{ship.cargo_capacity} Ton Muatan</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ship.build_year}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(ship)}
                            title="Edit Kapal"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(ship.id)}
                            title="Hapus Kapal"
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

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingShip ? `Edit Data Kapal [${editingShip.name}]` : 'Tambah Kapal Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kapal *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: KM Samudera Raya"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IMO Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.imo_number || ''}
                    onChange={(e) => setFormData({ ...formData, imo_number: e.target.value })}
                    placeholder="Contoh: 9248102"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kapal</label>
                  <select
                    value={formData.ship_type || 'General Cargo'}
                    onChange={(e) => setFormData({ ...formData, ship_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Roll-on/Roll-off (Ro-Ro)">Roll-on/Roll-off (Ro-Ro)</option>
                    <option value="Container Ship">Container Ship</option>
                    <option value="Kapal Penumpang & Muatan">Kapal Penumpang & Muatan</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="Oil/Chemical Tanker">Oil/Chemical Tanker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bendera Kapal</label>
                  <input
                    type="text"
                    value={formData.flag || 'Indonesia (ID)'}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gross Tonnage (GT)</label>
                  <input
                    type="number"
                    value={formData.gt || 0}
                    onChange={(e) => setFormData({ ...formData, gt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadweight Tonnage (DWT)</label>
                  <input
                    type="number"
                    value={formData.dwt || 0}
                    onChange={(e) => setFormData({ ...formData, dwt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kapasitas Penumpang (Orang)</label>
                  <input
                    type="number"
                    value={formData.passenger_capacity || 0}
                    onChange={(e) => setFormData({ ...formData, passenger_capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kapasitas Muatan (Ton)</label>
                  <input
                    type="number"
                    value={formData.cargo_capacity || 0}
                    onChange={(e) => setFormData({ ...formData, cargo_capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={formData.build_year || 2020}
                    onChange={(e) => setFormData({ ...formData, build_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kapal</label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ShipStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
                  {submitting ? 'Menyimpan...' : 'Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Data Kapal"
        message="Apakah Anda yakin ingin menghapus data kapal ini dari database? Aksi ini akan dicatat dalam Audit Trail."
        confirmLabel="Ya, Hapus Kapal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
