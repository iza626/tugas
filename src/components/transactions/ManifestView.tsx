import React, { useEffect, useState } from 'react';
import { Voyage, Manifest, ManifestStatus } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import {
  FileCheck2,
  QrCode,
  ShieldCheck,
  CheckCircle,
  Printer,
  Download,
  Search,
  Users,
  Package,
  Ship,
  ArrowRight,
  Anchor,
  FileText,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { QRModal } from '../ui/QRModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const ManifestView: React.FC<{ selectedVoyageId?: string }> = ({ selectedVoyageId }) => {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [currentVoyageId, setCurrentVoyageId] = useState<string>(selectedVoyageId || '');
  const [manifestDetail, setManifestDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [certifying, setCertifying] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // QR Modal
  const [qrModalData, setQrModalData] = useState<any>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { lastEvent, addToast } = useRealtime();

  const loadVoyages = async () => {
    try {
      const res = await api.getVoyages();
      if (res.success && res.data.length > 0) {
        setVoyages(res.data);
        if (!currentVoyageId) {
          setCurrentVoyageId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadManifestDetail = async (voyageId: string) => {
    if (!voyageId) return;
    setLoading(true);
    try {
      const res = await api.getVoyageManifestDetails(voyageId);
      if (res.success) {
        setManifestDetail(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoyages();
  }, []);

  useEffect(() => {
    if (selectedVoyageId) {
      setCurrentVoyageId(selectedVoyageId);
    }
  }, [selectedVoyageId]);

  useEffect(() => {
    if (currentVoyageId) {
      loadManifestDetail(currentVoyageId);
    }
  }, [currentVoyageId]);

  useEffect(() => {
    if (lastEvent?.type === 'MANIFEST_CERTIFIED' || lastEvent?.type?.includes('TRANSACTIONS_')) {
      if (currentVoyageId) {
        loadManifestDetail(currentVoyageId);
      }
    }
  }, [lastEvent, currentVoyageId]);

  // Certify Manifest action
  const handleCertify = async () => {
    if (!manifestDetail?.manifest?.id) {
      // Create manifest first then certify
      try {
        setCertifying(true);
        const newManifestNumber = `MNF/PORTIVA/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
        const createRes = await api.createManifest({
          manifest_number: newManifestNumber,
          voyage_id: currentVoyageId,
          total_passengers: manifestDetail.summary.totalPassengers,
          total_cargo_items: manifestDetail.summary.totalCargoItems,
          total_weight_ton: manifestDetail.summary.totalWeightTon,
          total_volume_m3: manifestDetail.summary.totalVolumeM3,
          status: 'Draft',
        });

        // Certify it
        const certRes = await api.certifyManifest(createRes.data.id);
        setIsConfirmOpen(false);
        setActionSuccess(`Manifest resmi ${certRes.data.manifest_number} berhasil disahkan oleh Syahbandar!`);
        addToast({
          type: 'success',
          title: 'Manifest Kapal Disahkan!',
          message: `Dokumen ${certRes.data.manifest_number} telah disahkan dengan segel kode QR resmi.`,
        });
        loadManifestDetail(currentVoyageId);
      } catch (err: any) {
        alert(err.message || 'Gagal mengesahkan manifest.');
      } finally {
        setCertifying(false);
      }
    } else {
      try {
        setCertifying(true);
        const certRes = await api.certifyManifest(manifestDetail.manifest.id);
        setIsConfirmOpen(false);
        setActionSuccess(`Manifest resmi ${certRes.data.manifest_number} berhasil disahkan oleh Syahbandar!`);
        addToast({
          type: 'success',
          title: 'Manifest Kapal Disahkan!',
          message: `Dokumen ${certRes.data.manifest_number} telah disahkan dengan segel kode QR resmi.`,
        });
        loadManifestDetail(currentVoyageId);
      } catch (err: any) {
        alert(err.message || 'Gagal mengesahkan manifest.');
      } finally {
        setCertifying(false);
      }
    }
  };

  const handlePrintOfficialManifest = () => {
    window.print();
  };

  const openQrPreview = () => {
    if (!manifestDetail?.manifest?.qr_code_data) {
      // Generate preview string
      const previewQr = `PORTIVA-AUTH:PREVIEW:${manifestDetail?.voyage?.voyage_number}:DATE=${new Date().toISOString()}`;
      setQrModalData({
        manifestNumber: manifestDetail?.manifest?.manifest_number || 'DRAFT-MANIFEST',
        voyageNumber: manifestDetail?.voyage?.voyage_number,
        shipName: manifestDetail?.ship?.name,
        qrDataString: previewQr,
        certifiedBy: 'Menunggu Pengesahan Syahbandar',
        certifiedAt: new Date().toLocaleDateString('id-ID'),
        totalWeight: manifestDetail?.summary?.totalWeightTon,
        totalPassengers: manifestDetail?.summary?.totalPassengers,
      });
    } else {
      setQrModalData({
        manifestNumber: manifestDetail.manifest.manifest_number,
        voyageNumber: manifestDetail.voyage?.voyage_number,
        shipName: manifestDetail.ship?.name,
        qrDataString: manifestDetail.manifest.qr_code_data,
        certifiedBy: manifestDetail.manifest.certified_by,
        certifiedAt: manifestDetail.manifest.certified_at,
        totalWeight: manifestDetail.summary.totalWeightTon,
        totalPassengers: manifestDetail.summary.totalPassengers,
      });
    }
    setIsQrModalOpen(true);
  };

  const manifest = manifestDetail?.manifest;
  const isCertified = manifest?.status === 'Certified';

  return (
    <div className="space-y-6">
      {/* Header and Voyage Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Manifest Resmi Kapal & Muatan</h2>
              {isCertified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  DISAHKAN (CERTIFIED)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  DRAFT / BELUM DISAHKAN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Dokumen resmi kesyahbandaran penggabungan muatan kargo, identitas penumpang, dan spesifikasi kapal
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={currentVoyageId}
            onChange={(e) => setCurrentVoyageId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {voyages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.voyage_number} ({v.departure_date})
              </option>
            ))}
          </select>

          {isCertified && (
            <button
              onClick={openQrPreview}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <QrCode className="w-4 h-4 text-sky-400" />
              Kode QR Syahbandar
            </button>
          )}

          {!isCertified && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Sahkan Dokumen Manifest
            </button>
          )}

          <button
            onClick={handlePrintOfficialManifest}
            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-blue-700" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 print:hidden">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          Memuat rincian manifest kapal...
        </div>
      ) : !manifestDetail ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
          Pilih pelayaran untuk menampilkan dokumen manifest.
        </div>
      ) : (
        /* OFFICIAL MARITIME MANIFEST DOCUMENT (PRINTABLE) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Official Letterhead / Kop Surat */}
          <div className="border-b-2 border-slate-900 pb-5 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-1">
              <Anchor className="w-7 h-7 text-blue-900" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-wider">
                KEMENTERIAN PERHUBUNGAN REPUBLIK INDONESIA
              </h1>
            </div>
            <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">
              DIREKTORAT JENDERAL PERHUBUNGAN LAUT · KANTOR KESYAHBANDARAN DAN OTORITAS PELABUHAN
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              SURAT PERNYATAAN MANIFEST RESMI MUATAN KAPAL & DAFTAR PENUMPANG (PASSENGER & CARGO MANIFEST)
            </p>

            {/* Stamp certification banner if certified */}
            {isCertified && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full text-xs font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                DIVERIFIKASI RESMI OLEH SYAHBANDAR · KODE: {manifest?.manifest_number}
              </div>
            )}
          </div>

          {/* Section 1: Vessel & Voyage Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-blue-700" />
                Data Spesifikasi Kapal
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Kapal:</span>
                <span className="font-bold text-slate-900">{manifestDetail.ship?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor IMO / Bendera:</span>
                <span className="font-mono">{manifestDetail.ship?.imo_number} · {manifestDetail.ship?.flag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis Kapal:</span>
                <span>{manifestDetail.ship?.ship_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross / Deadweight:</span>
                <span className="font-mono">GT {manifestDetail.ship?.gt} / DWT {manifestDetail.ship?.dwt}</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-blue-700" />
                Data Rute Pelayaran
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Pelayaran:</span>
                <span className="font-bold font-mono text-blue-900">{manifestDetail.voyage?.voyage_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelabuhan Muat &rarr; Tujuan:</span>
                <span className="font-semibold text-slate-900">
                  {manifestDetail.originPort?.name} ({manifestDetail.originPort?.port_code}) &rarr;{' '}
                  {manifestDetail.destinationPort?.name} ({manifestDetail.destinationPort?.port_code})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal Keberangkatan:</span>
                <span>
                  {manifestDetail.voyage?.departure_date} pukul {manifestDetail.voyage?.departure_time} WIB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimasi Tiba (ETA):</span>
                <span>{manifestDetail.voyage?.estimated_arrival}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Penumpang</p>
              <h3 className="text-xl font-black text-blue-900 mt-0.5">
                {manifestDetail.summary?.totalPassengers} Orang
              </h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Item Kargo</p>
              <h3 className="text-xl font-black text-blue-900 mt-0.5">
                {manifestDetail.summary?.totalCargoItems} Koli/Unit
              </h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Tonase Muatan</p>
              <h3 className="text-xl font-black text-cyan-900 mt-0.5">
                {manifestDetail.summary?.totalWeightTon} Ton
              </h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Volume Muatan</p>
              <h3 className="text-xl font-black text-cyan-900 mt-0.5">
                {manifestDetail.summary?.totalVolumeM3} m³
              </h3>
            </div>
          </div>

          {/* Section 3: Passenger Itemized Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Daftar Penumpang Kapal (Passenger Manifest)
              </h4>
              <span className="text-xs text-slate-500">
                {manifestDetail.passengers?.length || 0} Penumpang Tercatat
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">No. Tiket</th>
                    <th className="py-2.5 px-3">Nama Lengkap Penumpang</th>
                    <th className="py-2.5 px-3">Nomor Identitas (NIK)</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Gender</th>
                    <th className="py-2.5 px-3 text-right">Status Boarding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {manifestDetail.passengers && manifestDetail.passengers.length > 0 ? (
                    manifestDetail.passengers.map((p: any, idx: number) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">{p.ticket_number}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {p.passenger_details?.full_name || 'Penumpang'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {p.passenger_details?.identity_number || '-'}
                        </td>
                        <td className="py-2.5 px-3">{p.class}</td>
                        <td className="py-2.5 px-3">{p.passenger_details?.gender || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                            {p.boarding_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        Tidak ada penumpang yang terdaftar pada pelayaran ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Cargo Itemized Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-600" />
                Daftar Muatan Barang & Kargo (Cargo Manifest)
              </h4>
              <span className="text-xs text-slate-500">{manifestDetail.cargo?.length || 0} Kargo Tercatat</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">No. B/L (Dokumen)</th>
                    <th className="py-2.5 px-3">Uraian / Nama Muatan</th>
                    <th className="py-2.5 px-3">Shipper / Pengirim</th>
                    <th className="py-2.5 px-3">Jumlah & Satuan</th>
                    <th className="py-2.5 px-3">Berat (Ton)</th>
                    <th className="py-2.5 px-3">Volume (m³)</th>
                    <th className="py-2.5 px-3 text-right">Status Muatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {manifestDetail.cargo && manifestDetail.cargo.length > 0 ? (
                    manifestDetail.cargo.map((c: any, idx: number) => (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">{c.document_number}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{c.item_name}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {c.customer_details?.company_name || 'Shipper'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {c.quantity} {c.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{c.weight_ton}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{c.volume_m3}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400">
                        Tidak ada transaksi muatan kargo pada pelayaran ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Signature, Verification Seals & QR Code */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-800">
            <div>
              <p className="font-semibold text-slate-500">Catatan Otoritas Pelabuhan:</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Seluruh muatan dan daftar penumpang dalam manifest ini telah diperiksa kesesuaian dokumennya
                dengan regulasi keselamatan pelayaran maritim nasional dan internasional SOLAS.
              </p>
              {isCertified && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 block">Sertifikat Sah & Terenkripsi</span>
                    <span className="text-slate-500 font-mono text-[10px] block truncate max-w-[200px]">
                      {manifest?.qr_code_data}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center sm:text-right flex flex-col items-center sm:items-end justify-center">
              <p className="text-slate-500">Ditetapkan di {manifestDetail.originPort?.name || 'Pelabuhan Asal'}</p>
              <p className="text-slate-500">
                Tanggal: {manifest?.certified_at ? new Date(manifest.certified_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}
              </p>
              <div className="my-3 h-14 flex items-center justify-center">
                {isCertified ? (
                  <span className="border-2 border-emerald-600 text-emerald-700 font-extrabold px-4 py-1.5 rounded-lg rotate-[-3deg] uppercase text-xs tracking-wider shadow-sm">
                    RESMI DISAHKAN SYAHBANDAR
                  </span>
                ) : (
                  <span className="border border-dashed border-slate-300 text-slate-400 px-4 py-1.5 rounded-lg text-xs">
                    (Menunggu Pengesahan)
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 underline">
                {manifest?.certified_by || 'Capt. Hendra Wicaksono, M.Mar'}
              </p>
              <p className="text-[10px] text-slate-500">Kepala Kantor Kesyahbandaran / Harbour Master</p>
            </div>
          </div>
        </div>
      )}

      {/* Certification Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Pengesahan Resmi Dokumen Manifest"
        message={`Apakah Anda yakin ingin mengesahkan dokumen manifest pelayaran ini (${manifestDetail?.voyage?.voyage_number})? Tindakan ini akan mengunci muatan resmi, men-generate kode QR verifikasi unik untuk petugas pelabuhan, dan dicatat dalam Audit Trail.`}
        confirmLabel="Ya, Sahkan Manifest"
        isDestructive={false}
        onConfirm={handleCertify}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={certifying}
      />

      {/* QR Code Modal for Harbour Inspectors */}
      <QRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        manifestData={qrModalData}
      />
    </div>
  );
};
