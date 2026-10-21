import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Printer, ShieldCheck, X, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifestData: {
    manifestNumber: string;
    voyageNumber?: string;
    shipName?: string;
    qrDataString: string;
    certifiedBy?: string;
    certifiedAt?: string;
    totalWeight?: number;
    totalPassengers?: number;
  } | null;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, manifestData }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (manifestData?.qrDataString) {
      QRCode.toDataURL(manifestData.qrDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [manifestData]);

  if (!isOpen || !manifestData) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Validasi Manifest - ${manifestData.manifestNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; color: #1e293b; }
            .card { border: 2px solid #0284c7; border-radius: 12px; padding: 24px; max-width: 480px; margin: auto; }
            h2 { color: #0369a1; margin-bottom: 4px; }
            p { margin: 4px 0; font-size: 14px; }
            img { margin: 20px 0; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; }
            .badge { display: inline-block; background: #0284c7; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>PORTIVA - OTORITAS PELABUHAN</h2>
            <p><strong>DOKUMEN MANIFEST RESMI TERVALIDASI</strong></p>
            <p>No. Manifest: ${manifestData.manifestNumber}</p>
            <p>Kapal: ${manifestData.shipName || '-'}</p>
            <p>No. Pelayaran: ${manifestData.voyageNumber || '-'}</p>
            <img src="${qrDataUrl}" width="240" height="240" />
            <p>Disahkan Oleh: ${manifestData.certifiedBy || 'Syahbandar'}</p>
            <p>Waktu Pengesahan: ${manifestData.certifiedAt || '-'}</p>
            <div class="badge">RESMI & SAH DI BAWAH HUKUM MARITIM</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${manifestData.manifestNumber.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-400/30">
              <QrCode className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Kode QR Verifikasi Syahbandar</h3>
              <p className="text-xs text-sky-200">Validasi Muatan & Dokumen Resmi Pelayaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-3 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-lg shadow-sm" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">Menyiapkan QR...</div>
            )}
          </div>

          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Manifest:</span>
              <span className="font-semibold text-slate-900">{manifestData.manifestNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kapal:</span>
              <span className="font-semibold text-slate-900">{manifestData.shipName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pelayaran:</span>
              <span className="font-semibold text-slate-900">{manifestData.voyageNumber || '-'}</span>
            </div>
            {manifestData.totalWeight !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Total Muatan:</span>
                <span className="font-semibold text-blue-700">{manifestData.totalWeight} Ton</span>
              </div>
            )}
            {manifestData.totalPassengers !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Total Penumpang:</span>
                <span className="font-semibold text-blue-700">{manifestData.totalPassengers} Orang</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Pengesah:</span>
              <span className="font-medium text-emerald-700">{manifestData.certifiedBy || 'Otoritas Syahbandar'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="text-left font-medium">
              Terverifikasi secara kriptografis pada sistem database real-time PORTIVA.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-md shadow-blue-950/20"
            >
              <Printer className="w-4 h-4" />
              Cetak Sertifikat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inspector Quick QR Validation Scanner Modal
export const QRScannerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || inputCode;
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.verifyManifestQR(code.trim());
      if (res.success) {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Kode QR tidak dikenali atau dokumen tidak terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Validasi Cepat Petugas Pelabuhan</h3>
              <p className="text-xs text-slate-300">Scan atau Masukkan String QR Dokumen Manifest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Kode QR / String Identifikasi Dokumen</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: PORTIVA-AUTH:MNF/PORTIVA/2026/001 atau MNF/PORTIVA/2026/001"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                onClick={() => handleVerify()}
                disabled={isLoading || !inputCode.trim()}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-4 h-4" />
                {isLoading ? 'Memeriksa...' : 'Validasi'}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Uji Cepat Satu Klik:</span>
            <button
              onClick={() => {
                setInputCode('MNF/PORTIVA/2026/001');
                handleVerify('MNF/PORTIVA/2026/001');
              }}
              className="ml-2 text-blue-600 hover:underline font-mono"
            >
              MNF/PORTIVA/2026/001
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Validasi Gagal</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm">Dokumen Manifest Asli & Sah!</h4>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-emerald-100 text-xs space-y-2 text-slate-800">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Nomor Manifest:</span>
                  <span className="font-bold text-blue-900">{result.manifest?.manifest_number}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Kapal:</span>
                  <span className="font-medium">{result.ship?.name} ({result.ship?.imo_number})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Rute Perjalanan:</span>
                  <span className="font-medium">
                    {result.originPort?.name} &rarr; {result.destPort?.name}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Total Penumpang:</span>
                  <span className="font-bold text-slate-900">{result.manifest?.total_passengers} Orang</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Total Muatan:</span>
                  <span className="font-bold text-slate-900">
                    {result.manifest?.total_weight_ton} Ton ({result.manifest?.total_volume_m3} m³)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Otoritas Pengesah:</span>
                  <span className="font-semibold text-emerald-700">{result.manifest?.certified_by}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
