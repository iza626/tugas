import React, { useEffect, useState } from 'react';
import { CargoTransaction, Voyage, Customer, CargoType, Port, CargoStatus, Ship } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { Truck, Plus, Search, Edit2, Trash2, X, CheckCircle, RefreshCw, Package, ArrowRight, QrCode } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { QRModal } from '../ui/QRModal';

export const CargoTransactionsView: React.FC = () => {
  const [cargoList, setCargoList] = useState<CargoTransaction[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVoyageFilter, setSelectedVoyageFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoTransaction | null>(null);
  const [formData, setFormData] = useState<Partial<CargoTransaction>>({
    voyage_id: '',
    customer_id: '',
    cargo_type_id: '',
    item_name: '',
    quantity: 1,
    unit: 'TEU / Box',
    weight_ton: 10,
    volume_m3: 30,
    loading_port_id: '',
    discharge_port_id: '',
    document_number: '',
    status: 'Booked',
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

  const loadAll = async () => {
    try {
      const [cRes, vRes, custRes, ctRes, pRes, sRes] = await Promise.all([
        api.getCargoTransactions(),
        api.getVoyages(),
        api.getCustomers(),
        api.getCargoTypes(),
        api.getPorts(),
        api.getShips(),
      ]);
      if (cRes.success) setCargoList(cRes.data);
      if (vRes.success) setVoyages(vRes.data);
      if (custRes.success) setCustomers(custRes.data);
      if (ctRes.success) setCargoTypes(ctRes.data);
      if (pRes.success) setPorts(pRes.data);
      if (sRes.success) setShips(sRes.data);
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
    if (lastEvent?.type?.startsWith('CARGO_TRANSACTIONS_')) {
      loadAll();
    }
  }, [lastEvent]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    const docNo = `BL/PORTIVA/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      voyage_id: voyages[0]?.id || '',
      customer_id: customers[0]?.id || '',
      cargo_type_id: cargoTypes[0]?.id || '',
      item_name: '',
      quantity: 1,
      unit: cargoTypes[0]?.unit || 'Ton',
      weight_ton: 20,
      volume_m3: 50,
      loading_port_id: ports[0]?.id || '',
      discharge_port_id: ports[1]?.id || '',
      document_number: docNo,
      status: 'Booked',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CargoTransaction) => {
    setEditingItem(c);
    setFormData({ ...c });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voyage_id || !formData.customer_id || !formData.cargo_type_id || !formData.item_name?.trim()) {
      setFormError('Perjalanan, Shipper, Jenis Muatan, dan Nama Barang wajib diisi!');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        const res = await api.updateCargoTransaction(editingItem.id, formData);
        setActionSuccess(`Muatan ${res.data.item_name} berhasil diperbarui.`);
        addToast({ type: 'success', title: 'Muatan Diperbarui', message: `Data ${res.data.item_name} disimpan.` });
      } else {
        const res = await api.createCargoTransaction(formData);
        setActionSuccess(`Muatan ${res.data.item_name} berhasil dicatat.`);
        addToast({ type: 'success', title: 'Muatan Baru Tercatat', message: `Data ${res.data.item_name} tersimpan di database.` });
      }
      setIsModalOpen(false);
      loadAll();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi muatan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteCargoTransaction(deleteId);
      setActionSuccess('Data muatan berhasil dihapus dari database.');
      addToast({ type: 'warning', title: 'Muatan Dihapus', message: 'Data muatan telah dihapus dari sistem.' });
      setDeleteId(null);
      loadAll();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus muatan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = cargoList.filter((c) => {
    const customer = customers.find((cust) => cust.id === c.customer_id);
    const cargoType = cargoTypes.find((ct) => ct.id === c.cargo_type_id);
    const voyage = voyages.find((v) => v.id === c.voyage_id);

    const matchesSearch =
      c.item_name.toLowerCase().includes(search.toLowerCase()) ||
      c.document_number.toLowerCase().includes(search.toLowerCase()) ||
      (customer && customer.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (cargoType && cargoType.name.toLowerCase().includes(search.toLowerCase())) ||
      (voyage && voyage.voyage_number.toLowerCase().includes(search.toLowerCase()));

    const matchesVoyage = selectedVoyageFilter === 'ALL' || c.voyage_id === selectedVoyageFilter;

    return matchesSearch && matchesVoyage;
  });

  const totalWeight = filtered.reduce((acc, c) => acc + (Number(c.weight_ton) || 0), 0);
  const totalVolume = filtered.reduce((acc, c) => acc + (Number(c.volume_m3) || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Transaksi Muatan Barang & Kargo Kapal</h2>
            <p className="text-xs text-slate-500">Pencatatan Bill of Lading, tonase, volume, stowing, dan status pemuatan</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Catat Muatan Baru
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari barang, no. B/L, shipper, atau nomor pelayaran..."
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

        <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-sky-200 uppercase font-semibold">Total Berat (Ton)</p>
            <h3 className="text-xl font-black mt-0.5">{Math.round(totalWeight * 10) / 10} Ton</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-white/10 border border-white/20">
            <Package className="w-5 h-5 text-sky-300" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-indigo-200 uppercase font-semibold">Total Volume (m³)</p>
            <h3 className="text-xl font-black mt-0.5">{Math.round(totalVolume * 10) / 10} m³</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-white/10 border border-white/20">
            <Truck className="w-5 h-5 text-indigo-300" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Barang & No. Dokumen</th>
                <th className="py-3 px-4">Customer / Shipper</th>
                <th className="py-3 px-4">Jenis Muatan</th>
                <th className="py-3 px-4">Berat & Volume</th>
                <th className="py-3 px-4">Pelabuhan Muat &rarr; Bongkar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data muatan...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data muatan.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const customer = customers.find((cust) => cust.id === c.customer_id);
                  const cargoType = cargoTypes.find((ct) => ct.id === c.cargo_type_id);
                  const loadPort = ports.find((p) => p.id === c.loading_port_id);
                  const disPort = ports.find((p) => p.id === c.discharge_port_id);

                  let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (c.status === 'Booked') statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (c.status === 'Loaded') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (c.status === 'On Board') statusBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                  if (c.status === 'Discharged') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (c.status === 'Cancelled') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.item_name}</div>
                        <div className="text-[10px] text-blue-700 font-mono font-medium">{c.document_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{customer?.company_name || c.customer_id}</div>
                        <div className="text-[10px] text-slate-500">PIC: {customer?.pic}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{cargoType?.name || c.cargo_type_id}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {c.quantity} {c.unit}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-blue-900">{c.weight_ton} Ton</div>
                        <div className="text-[10px] text-slate-500">{c.volume_m3} m³</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-medium">
                          <span>{loadPort?.name || c.loading_port_id}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{disPort?.name || c.discharge_port_id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const customer = customers.find((cust) => cust.id === c.customer_id);
                              const voyage = voyages.find((v) => v.id === c.voyage_id);
                              const ship = voyage ? ships.find((s) => s.id === voyage.ship_id) : null;
                              setQrModalData({
                                manifestNumber: c.document_number,
                                voyageNumber: voyage?.voyage_number,
                                shipName: ship?.name,
                                qrDataString: `PORTIVA-AUTH:CARGO:${c.document_number}:ITEM=${c.item_name}:WEIGHT=${c.weight_ton}`,
                                certifiedBy: `Dokumen Muatan Kargo (B/L) - ${customer?.company_name || 'Shipper'}`,
                                certifiedAt: c.created_at || new Date().toISOString().split('T')[0],
                                totalWeight: c.weight_ton,
                              });
                              setIsQrModalOpen(true);
                            }}
                            title="Tampilkan Kode QR Dokumen B/L Muatan"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
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
                {editingItem ? `Edit Muatan [${editingItem.item_name}]` : 'Catat Transaksi Muatan Baru'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Perjalanan Kapal *</label>
                  <select
                    required
                    value={formData.voyage_id || ''}
                    onChange={(e) => setFormData({ ...formData, voyage_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Perjalanan...</option>
                    {voyages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.voyage_number} ({v.departure_date})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Shipper *</label>
                  <select
                    required
                    value={formData.customer_id || ''}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Shipper...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={formData.item_name || ''}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Contoh: Beras Premium Karungan 50kg (Palet Kayu)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Muatan *</label>
                  <select
                    required
                    value={formData.cargo_type_id || ''}
                    onChange={(e) => {
                      const ct = cargoTypes.find((x) => x.id === e.target.value);
                      setFormData({
                        ...formData,
                        cargo_type_id: e.target.value,
                        unit: ct?.unit || formData.unit,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Kategori...</option>
                    {cargoTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    value={formData.quantity || 1}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formData.unit || 'Ton'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Berat Total (Ton) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.weight_ton || 0}
                    onChange={(e) => setFormData({ ...formData, weight_ton: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume Ruang (m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.volume_m3 || 0}
                    onChange={(e) => setFormData({ ...formData, volume_m3: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pelabuhan Muat (Loading)</label>
                  <select
                    value={formData.loading_port_id || ''}
                    onChange={(e) => setFormData({ ...formData, loading_port_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Dermaga Muat...</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.port_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pelabuhan Bongkar (Discharge)</label>
                  <select
                    value={formData.discharge_port_id || ''}
                    onChange={(e) => setFormData({ ...formData, discharge_port_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Pilih Dermaga Bongkar...</option>
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
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Dokumen (Bill of Lading / Resi) *</label>
                  <input
                    type="text"
                    required
                    value={formData.document_number || ''}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    placeholder="Contoh: BL/SLN-PRIOK/2026/089"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Muatan</label>
                  <select
                    value={formData.status || 'Booked'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CargoStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Booked">Booked (Telah Dipesan)</option>
                    <option value="Loaded">Loaded (Telah Dimuat di Dermaga)</option>
                    <option value="On Board">On Board (Di Dalam Palka Kapal)</option>
                    <option value="Discharged">Discharged (Dibongkar di Tujuan)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Stowing / Instruksi Penanganan</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instruksi pengikatan (lashing), ventilasi palka, dll..."
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
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi Muatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        title="Hapus Transaksi Muatan"
        message="Yakin ingin membatalkan dan menghapus muatan barang ini? Aksi ini akan dicatat dalam Audit Trail."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />

      {/* QR Code Cargo B/L Modal */}
      <QRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        manifestData={qrModalData}
      />
    </div>
  );
};
