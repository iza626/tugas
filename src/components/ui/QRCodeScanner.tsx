import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  PackageCheck,
  Ship,
  Anchor,
  FileCheck2,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManifestVoyage?: (voyageId: string) => void;
  embedded?: boolean; // if true, renders inline without modal backdrop
}

// Sound feedback using Web Audio API
function playScanSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {
    // AudioContext might be restricted until user gesture
  }
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isOpen,
  onClose,
  onSelectManifestVoyage,
  embedded = false,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [scannerId] = useState(() => `qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Manual input state
  const [manualCode, setManualCode] = useState('');

  // Verification result state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  // Quick action loading state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { addToast } = useRealtime();

  // Perform document verification
  const handleVerify = useCallback(
    async (codeToVerify: string) => {
      const code = codeToVerify.trim();
      if (!code) return;

      setIsVerifying(true);
      setVerificationError(null);
      setVerificationResult(null);
      setActionSuccessMsg(null);
      setLastScannedCode(code);

      try {
        const res = await api.verifyManifestQR(code);
        if (res.success) {
          playScanSound();
          setVerificationResult(res);
          addToast({
            type: 'success',
            title: 'Verifikasi Berhasil',
            message: res.message || `Data untuk "${code}" terverifikasi resmi.`,
          });
        }
      } catch (err: any) {
        setVerificationError(err.message || 'Kode QR tidak dikenali atau dokumen belum terdaftar dalam sistem.');
      } finally {
        setIsVerifying(false);
      }
    },
    [addToast]
  );

  // Stop camera
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Start camera
  const startCamera = useCallback(
    async (cameraId?: string) => {
      setCameraError(null);
      await stopScanner();

      // Give DOM time to mount scanner container
      setTimeout(async () => {
        const el = document.getElementById(scannerId);
        if (!el) return;

        try {
          const qrScanner = new Html5Qrcode(scannerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
            verbose: false,
          });
          html5QrCodeRef.current = qrScanner;

          // Enumerate cameras if not already done
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              setAvailableCameras(devices);
              if (!selectedCameraId) {
                // Prefer back camera if available
                const backCam = devices.find(
                  (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('belakang')
                );
                setSelectedCameraId(backCam ? backCam.id : devices[0].id);
              }
            }
          } catch (e) {
            // ignore
          }

          const targetCam = cameraId || selectedCameraId || { facingMode: 'environment' };

          await qrScanner.start(
            targetCam,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (decodedText && decodedText !== lastScannedCode) {
                handleVerify(decodedText);
              }
            },
            () => {
              // frame parse failure - normal while scanning
            }
          );

          setIsScanning(true);
        } catch (err: any) {
          console.warn('Camera scan failed to start:', err);
          setCameraError(
            err.message?.includes('Permission')
              ? 'Izin kamera ditolak. Izinkan akses kamera pada browser Anda atau gunakan fitur Upload Gambar / Input Kode di bawah.'
              : 'Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain. Anda dapat mengunggah file foto QR atau memasukkan kode dokumen.'
          );
          setIsScanning(false);
        }
      }, 150);
    },
    [handleVerify, lastScannedCode, scannerId, selectedCameraId, stopScanner]
  );

  // Handle image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setVerificationError(null);
    setIsVerifying(true);

    try {
      // Create temporary scanner instance for file scan if ref is busy
      const fileScanner = new Html5Qrcode(`${scannerId}-file-temp`, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      });
      const decodedResult = await fileScanner.scanFile(file, true);
      await fileScanner.clear();

      if (decodedResult) {
        handleVerify(decodedResult);
      }
    } catch (err: any) {
      setVerificationError('Tidak dapat mendeteksi kode QR pada gambar yang diunggah. Pastikan gambar jelas dan tidak blur.');
      setIsVerifying(false);
    }
  };

  // Toggle mode & camera start
  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, activeMode, startCamera, stopScanner]);

  // Quick Action: Passenger Boarding
  const handleBoardPassenger = async (ticketId: string, currentStatus: string) => {
    setActionLoading(true);
    setActionSuccessMsg(null);
    const nextStatus = currentStatus === 'Boarded' ? 'Booked' : 'Boarded';
    try {
      const res = await api.checkInPassenger(ticketId, nextStatus);
      if (res.success) {
        setActionSuccessMsg(`Status berhasil diubah menjadi "${nextStatus}"!`);
        // Refresh local verification result
        setVerificationResult((prev: any) => {
          if (!prev?.data?.ticket) return prev;
          return {
            ...prev,
            data: {
              ...prev.data,
              ticket: {
                ...prev.data.ticket,
                boarding_status: nextStatus,
              },
            },
          };
        });
        addToast({
          type: 'success',
          title: 'Status Boarding Diperbarui',
          message: `Tiket penumpang berhasil ditandai sebagai ${nextStatus}.`,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status boarding.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Cargo Status Update
  const handleUpdateCargo = async (cargoId: string, newStatus: string) => {
    setActionLoading(true);
    setActionSuccessMsg(null);
    try {
      const res = await api.updateCargoStatus(cargoId, newStatus);
      if (res.success) {
        setActionSuccessMsg(`Status muatan berhasil diubah menjadi "${newStatus}"!`);
        setVerificationResult((prev: any) => {
          if (!prev?.data?.cargo) return prev;
          return {
            ...prev,
            data: {
              ...prev.data,
              cargo: {
                ...prev.data.cargo,
                status: newStatus,
              },
            },
          };
        });
        addToast({
          type: 'success',
          title: 'Status Muatan Diperbarui',
          message: `Dokumen muatan berhasil diubah menjadi ${newStatus}.`,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status muatan.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 rounded-xl border border-sky-400/30 text-sky-300">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">QR Code Scanner & Verifikator Instan</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Port Clearance
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Validasi cepat Manifest Syahbandar, Tiket Penumpang, atau Dokumen Muatan Kargo
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMode === 'camera'
                ? 'bg-white text-blue-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Kamera Langsung</span>
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMode === 'upload'
                ? 'bg-white text-blue-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload Foto QR</span>
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMode === 'manual'
                ? 'bg-white text-blue-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>Input Kode / Uji Cepat</span>
          </button>
        </div>

        {/* 1. CAMERA SCANNER MODE */}
        {activeMode === 'camera' && (
          <div className="space-y-3">
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center border border-slate-800 shadow-inner">
              {/* HTML5 QR Code Mount Node */}
              <div id={scannerId} className="w-full max-w-sm rounded-xl overflow-hidden" />

              {/* Laser Scanning Animation Overlay */}
              {isScanning && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-sky-400/60 rounded-2xl relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sky-400 -mt-1 -ml-1 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sky-400 -mt-1 -mr-1 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sky-400 -mb-1 -ml-1 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sky-400 -mb-1 -mr-1 rounded-br-lg" />
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Camera Error Message with One-Click Fallback */}
              {cameraError && (
                <div className="p-5 text-center text-slate-300 space-y-3 max-w-md">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Akses Kamera Terkendala</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => startCamera()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Coba Lagi
                    </button>
                    <button
                      onClick={() => setActiveMode('manual')}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                    >
                      Buka Input Manual / Uji Sampel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Switcher Controls */}
            {availableCameras.length > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span className="font-medium">Pilih Kamera Perangkat:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-600"
                >
                  {availableCameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Kamera ${cam.id.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* 2. FILE UPLOAD SCANNER MODE */}
        {activeMode === 'upload' && (
          <div className="space-y-4">
            <div id={`${scannerId}-file-temp`} className="hidden" />
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/40">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">Klik untuk Mengunggah Foto / Screenshot Kode QR</p>
              <p className="text-[11px] text-slate-500 mt-1">Mendukung format PNG, JPG, JPEG, WebP</p>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* 3. MANUAL INPUT & QUICK TEST SAMPLES */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Masukkan Kode / String Verifikasi Manual</span>
              <span className="text-[11px] text-slate-400 font-normal">Manifest, Tiket, atau B/L</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: MNF/PORTIVA/2026/001, TKT-2026-008201, atau BL/SLN-PRIOK/2026/089"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify(manualCode)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
              />
              <button
                onClick={() => handleVerify(manualCode)}
                disabled={isVerifying || !manualCode.trim()}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                {isVerifying ? 'Memeriksa...' : 'Validasi'}
              </button>
            </div>
          </div>

          {/* Quick Click Samples */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Uji Cepat Satu Klik (Sampel Data Nyata):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setManualCode('MNF/PORTIVA/2026/001');
                  handleVerify('MNF/PORTIVA/2026/001');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-800 font-mono text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
              >
                <FileCheck2 className="w-3 h-3 text-blue-600" />
                Manifest: MNF/PORTIVA/2026/001
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualCode('TKT-2026-008201');
                  handleVerify('TKT-2026-008201');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-800 font-mono text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
              >
                <UserCheck className="w-3 h-3 text-indigo-600" />
                Tiket: TKT-2026-008201 (Budi)
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualCode('BL/SLN-PRIOK/2026/089');
                  handleVerify('BL/SLN-PRIOK/2026/089');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-slate-800 font-mono text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
              >
                <PackageCheck className="w-3 h-3 text-cyan-600" />
                B/L Kargo: BL/SLN-PRIOK/2026/089
              </button>
            </div>
          </div>
        </div>

        {/* Status Action Banner */}
        {actionSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
        )}

        {/* Verification Error */}
        {verificationError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Dokumen Tidak Ditemukan</p>
              <p className="mt-0.5 leading-relaxed">{verificationError}</p>
            </div>
          </div>
        )}

        {/* 4. VERIFICATION RESULT DETAILS */}
        {verificationResult && (
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Case A: MANIFEST */}
            {verificationResult.data?.doc_type === 'MANIFEST' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm">Dokumen Manifest Resmi Terverifikasi!</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    SAH & TERAKREDITASI
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-800 shadow-2xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Nomor Manifest:</span>
                    <span className="font-bold font-mono text-blue-900">{verificationResult.data.manifest?.manifest_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Armada Kapal:</span>
                    <span className="font-semibold text-slate-900">
                      {verificationResult.data.ship?.name} ({verificationResult.data.ship?.imo_number})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Rute Pelayaran:</span>
                    <span className="font-medium text-slate-900">
                      {verificationResult.data.originPort?.name} &rarr; {verificationResult.data.destPort?.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Total Penumpang:</span>
                    <span className="font-bold text-blue-900">{verificationResult.data.manifest?.total_passengers} Orang</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Total Muatan Kargo:</span>
                    <span className="font-bold text-cyan-900">
                      {verificationResult.data.manifest?.total_weight_ton} Ton ({verificationResult.data.manifest?.total_volume_m3} m³)
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Otoritas Pengesah:</span>
                    <span className="font-semibold text-emerald-700">{verificationResult.data.manifest?.certified_by}</span>
                  </div>
                </div>

                {onSelectManifestVoyage && verificationResult.data.manifest?.voyage_id && (
                  <button
                    onClick={() => {
                      onSelectManifestVoyage(verificationResult.data.manifest.voyage_id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>Buka Rincian Lengkap Dokumen Manifest</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Case B: PASSENGER TICKET */}
            {verificationResult.data?.doc_type === 'PASSENGER_TICKET' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-sm">Tiket Penumpang Terverifikasi!</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      verificationResult.data.ticket?.boarding_status === 'Boarded'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    Status: {verificationResult.data.ticket?.boarding_status}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-800 shadow-2xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Nomor Tiket:</span>
                    <span className="font-bold font-mono text-indigo-900">{verificationResult.data.ticket?.ticket_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Nama Penumpang:</span>
                    <span className="font-bold text-slate-900">{verificationResult.data.passenger?.full_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">NIK / Paspor:</span>
                    <span className="font-mono text-slate-700">{verificationResult.data.passenger?.identity_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Kelas / Kursi:</span>
                    <span className="font-medium text-slate-800">
                      {verificationResult.data.ticket?.class} {verificationResult.data.ticket?.notes ? `(${verificationResult.data.ticket.notes})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Pelayaran:</span>
                    <span className="font-medium text-slate-800">
                      {verificationResult.data.voyage?.voyage_number} ({verificationResult.data.ship?.name})
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Pembayaran:</span>
                    <span className="font-semibold text-emerald-700">{verificationResult.data.ticket?.payment_status}</span>
                  </div>
                </div>

                {/* Instant Action: Check-in / Boarding */}
                <button
                  onClick={() =>
                    handleBoardPassenger(
                      verificationResult.data.ticket.id,
                      verificationResult.data.ticket.boarding_status
                    )
                  }
                  disabled={actionLoading}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                    verificationResult.data.ticket?.boarding_status === 'Boarded'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {actionLoading
                    ? 'Memproses...'
                    : verificationResult.data.ticket?.boarding_status === 'Boarded'
                    ? 'Batalkan Status Boarding (Kembalikan ke Booked)'
                    : 'Konfirmasi Boarding / Penumpang Masuk Kapal (Gate Scan)'}
                </button>
              </div>
            )}

            {/* Case C: CARGO DOCUMENT (BILL OF LADING) */}
            {verificationResult.data?.doc_type === 'CARGO_DOCUMENT' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-900">
                    <PackageCheck className="w-5 h-5 text-cyan-600" />
                    <h4 className="font-bold text-sm">Dokumen Muatan Kargo Terverifikasi!</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                    Status: {verificationResult.data.cargo?.status}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-800 shadow-2xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">No. B/L / Resi:</span>
                    <span className="font-bold font-mono text-cyan-900">{verificationResult.data.cargo?.document_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Nama Muatan:</span>
                    <span className="font-bold text-slate-900">{verificationResult.data.cargo?.item_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Shipper / Pengirim:</span>
                    <span className="font-semibold text-slate-800">{verificationResult.data.customer?.company_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Berat & Volume:</span>
                    <span className="font-bold font-mono text-blue-900">
                      {verificationResult.data.cargo?.weight_ton} Ton · {verificationResult.data.cargo?.volume_m3} m³ ({verificationResult.data.cargo?.quantity} {verificationResult.data.cargo?.unit})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Pelayaran:</span>
                    <span className="font-medium text-slate-800">{verificationResult.data.voyage?.voyage_number}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Dermaga Muat &rarr; Bongkar:</span>
                    <span className="font-medium text-slate-800">
                      {verificationResult.data.loadingPort?.name} &rarr; {verificationResult.data.dischargePort?.name}
                    </span>
                  </div>
                </div>

                {/* Instant Action: Update cargo loading status */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-700 block">Pembaruan Status Dermaga / Palka:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateCargo(verificationResult.data.cargo.id, 'Loaded')}
                      disabled={actionLoading || verificationResult.data.cargo?.status === 'Loaded'}
                      className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold transition-colors"
                    >
                      Dimuat (Loaded)
                    </button>
                    <button
                      onClick={() => handleUpdateCargo(verificationResult.data.cargo.id, 'On Board')}
                      disabled={actionLoading || verificationResult.data.cargo?.status === 'On Board'}
                      className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold transition-colors"
                    >
                      On Board Kapal
                    </button>
                    <button
                      onClick={() => handleUpdateCargo(verificationResult.data.cargo.id, 'Discharged')}
                      disabled={actionLoading || verificationResult.data.cargo?.status === 'Discharged'}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold transition-colors"
                    >
                      Dibongkar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="max-w-xl w-full">{content}</div>
    </div>
  );
};
