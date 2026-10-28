import React, { useEffect, useState } from 'react';
import { PassengerTransaction, Voyage, Passenger, TicketClass, PaymentStatus, BoardingStatus, Ship } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { Ticket, Plus, Search, Edit2, Trash2, X, CheckCircle, RefreshCw, Users, QrCode } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { QRModal } from '../ui/QRModal';

export const PassengerTransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<PassengerTransaction[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVoyageFilter, setSelectedVoyageFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PassengerTransaction | null>(null);
  const [formData, setFormData] = useState<Partial<PassengerTransaction>>({
    voyage_id: '',
    passenger_id: '',
    ticket_number: '',
    class: 'Ekonomi',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_status: 'Paid',
    boarding_status: 'Booked',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<any>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { lastEvent, addToast } = useRealtime();

  const loadData = async () => {
    try {
      const [tRes, vRes, pRes, sRes] = await Promise.all([
        api.getPassengerTransactions(),
        api.getVoyages(),
        api.getPassengers(),
        api.getShips(),
      ]);
      if (tRes.success) setTransactions(tRes.data);
      if (vRes.success) setVoyages(vRes.data);
      if (pRes.success) setPassengers(pRes.data);
      if (sRes.success) setShips(sRes.data);
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
    if (lastEvent?.type?.startsWith('PASSENGER_TRANSACTIONS_')) {
      loadData();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    const randomTicket = `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({
      voyage_id: voyages[0]?.id || '',
      passenger_id: passengers[0]?.id || '',
      ticket_number: randomTicket,
      class: 'Ekonomi',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_status: 'Paid',
      boarding_status: 'Booked',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: PassengerTransaction) => {
    setEditingItem(t);
    setFormData({ ...t });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voyage_id || !formData.passenger_id || !formData.ticket_number?.trim()) {
      setFormError('Perjalanan, Penumpang, dan Nomor Tiket wajib diisi!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        const res = await api.updatePassengerTransaction(editingItem.id, formData);
        setActionSuccess(`Transaksi tiket ${res.data.ticket_number} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Tiket Diperbarui', message: `Tiket ${res.data.ticket_number} berhasil disimpan.` });
      } else {
        const res = await api.createPassengerTransaction(formData);
        setActionSuccess(`Tiket ${res.data.ticket_number} berhasil diterbitkan.`);
        addToast({ type: 'success', title: 'Tiket Baru Terbit', message: `Tiket ${res.data.ticket_number} tersimpan di database.` });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi tiket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deletePassengerTransaction(deleteId);
      setActionSuccess('Transaksi tiket penumpang berhasil dihapus.');
      addToast({ type: 'warning', title: 'Tiket Dihapus', message: 'Data tiket dihapus dari sistem.' });
      setDeleteId(null);
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tiket.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const passenger = passengers.find((p) => p.id === t.passenger_id);
    const voyage = voyages.find((v) => v.id === t.voyage_id);

    const matchesSearch =
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (passenger && passenger.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (voyage && voyage.voyage_number.toLowerCase().includes(search.toLowerCase()));

    const matchesVoyage = selectedVoyageFilter === 'ALL' || t.voyage_id === selectedVoyageFilter;

    return matchesSearch && matchesVoyage;
  });

  const currentVoyageCount =
    selectedVoyageFilter !== 'ALL'
      ? transactions.filter((t) => t.voyage_id === selectedVoyageFilter).length
      : transactions.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Transaksi Tiket & Penumpang Kapal</h2>
            <p className="text-xs text-slate-500">Pencatatan manifes tiket, kelas kabin, dan status boarding penumpang</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Terbitkan Tiket Penumpang
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Count Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no. tiket, nama penumpang, atau nomor pelayaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedVoyageFilter}
              onChange={(e) => setSelectedVoyageFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Perjalanan Kapal</option>
              {voyages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.voyage_number} ({v.departure_date})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-sky-200 uppercase font-semibold">Total Penumpang Terdata</p>
            <h3 className="text-xl font-black mt-0.5">{currentVoyageCount} Orang</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-white/10 border border-white/20">
            <Users className="w-5 h-5 text-sky-300" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nomor Tiket</th>
                <th className="py-3 px-4">Nama Penumpang</th>
                <th className="py-3 px-4">Perjalanan Kapal</th>
                <th className="py-3 px-4">Kelas & Tanggal</th>
                <th className="py-3 px-4">Pembayaran</th>
                <th className="py-3 px-4">Status Boarding</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data tiket...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan tiket penumpang.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const passenger = passengers.find((p) => p.id === t.passenger_id);
                  const voyage = voyages.find((v) => v.id === t.voyage_id);
                  const ship = voyage ? ships.find((s) => s.id === voyage.ship_id) : null;

                  let boardingBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (t.boarding_status === 'Booked') boardingBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (t.boarding_status === 'Paid') boardingBadge = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                  if (t.boarding_status === 'Boarded') boardingBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (t.boarding_status === 'Cancelled') boardingBadge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{t.ticket_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{passenger?.full_name || 'Penumpang Tidak Ditemukan'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{passenger?.identity_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{voyage?.voyage_number || t.voyage_id}</div>
                        <div className="text-[10px] text-slate-500">{ship?.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{t.class}</div>
                        <div className="text-[10px] text-slate-500">{t.transaction_date}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.payment_status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {t.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${boardingBadge}`}>
                          {t.boarding_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const passenger = passengers.find((p) => p.id === t.passenger_id);
                              const voyage = voyages.find((v) => v.id === t.voyage_id);
                              const ship = voyage ? ships.find((s) => s.id === voyage.ship_id) : null;
                              setQrModalData({
                                manifestNumber: t.ticket_number,
                                voyageNumber: voyage?.voyage_number,
                                shipName: ship?.name,
                                qrDataString: `PORTIVA-AUTH:TICKET:${t.ticket_number}:NAME=${passenger?.full_name || ''}`,
                                certifiedBy: `Tiket Penumpang (${t.class}) - Status: ${t.boarding_status}`,
                                certifiedAt: t.transaction_date,
                                totalPassengers: 1,
                              });
                              setIsQrModalOpen(true);
                            }}
                            title="Tampilkan Kode QR Tiket Penumpang"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(t.id)}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingItem ? `Edit Tiket [${editingItem.ticket_number}]` : 'Terbitkan Tiket Penumpang Baru'}
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
                <label className="block font-semibold text-slate-700 mb-1">Pilih Perjalanan Kapal *</label>
                <select
                  required
                  value={formData.voyage_id || ''}
                  onChange={(e) => setFormData({ ...formData, voyage_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="">Pilih Jadwal Pelayaran...</option>
                  {voyages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.voyage_number} ({v.departure_date} pukul {v.departure_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Data Penumpang *</label>
                <select
                  required
                  value={formData.passenger_id || ''}
                  onChange={(e) => setFormData({ ...formData, passenger_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="">Pilih Penumpang...</option>
                  {passengers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} (NIK: {p.identity_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Tiket *</label>
                  <input
                    type="text"
                    required
                    value={formData.ticket_number || ''}
                    onChange={(e) => setFormData({ ...formData, ticket_number: e.target.value })}
                    placeholder="Contoh: TKT-2026-00123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas Kabin</label>
                  <select
                    value={formData.class || 'Ekonomi'}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value as TicketClass })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Bisnis">Bisnis</option>
                    <option value="VIP">VIP</option>
                    <option value="First Class">First Class</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.payment_status || 'Paid'}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Paid">Paid (Lunas)</option>
                    <option value="Unpaid">Unpaid (Belum Lunas)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Boarding</label>
                  <select
                    value={formData.boarding_status || 'Booked'}
                    onChange={(e) => setFormData({ ...formData, boarding_status: e.target.value as BoardingStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Booked">Booked</option>
                    <option value="Paid">Paid</option>
                    <option value="Boarded">Boarded (Di Atas Kapal)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Kursi / Kamar / Bagasi</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Dek 2 Kabin 14, Bagasi 20kg"
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
                  {submitting ? 'Menyimpan...' : 'Simpan Tiket Penumpang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Tiket Penumpang"
        message="Yakin ingin membatalkan dan menghapus tiket penumpang ini? Aksi ini akan dicatat dalam Audit Trail."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />

      {/* QR Code Boarding Pass Modal */}
      <QRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        manifestData={qrModalData}
      />
    </div>
  );
};
