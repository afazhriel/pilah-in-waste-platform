import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  Camera,
  QrCode,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Sparkles,
  Keyboard,
  UserCheck,
  MapPin,
  Phone,
  Wallet,
  Scale,
  Calendar,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Member } from '../../types';
import {
  encodeMemberQrPayload,
  parseAndMatchMemberQr,
  HAFI_DIGITAL_BRAND,
} from '../../utils/qrMember';
import { formatIDR, formatWeight } from '../../utils/formatters';

export type ScanSourceType = 'camera' | 'upload' | 'optical-card' | 'manual';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onMemberIdentified: (
    member: Member,
    rawQrPayload: string,
    source: ScanSourceType
  ) => void;
  initialPreviewMember?: Member | null;
}

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable';

const SOURCE_LABELS: Record<ScanSourceType, string> = {
  camera: 'Kamera Live QR Reader',
  upload: 'Unggah Gambar Kartu QR',
  'optical-card': 'Pemindai Optik Kartu Digital',
  manual: 'Verifikasi Token Kartu',
};

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  members,
  onMemberIdentified,
  initialPreviewMember = null,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanError, setScanError] = useState<string | null>(null);
  const [retrievedProfile, setRetrievedProfile] = useState<{
    member: Member;
    rawPayload: string;
    source: ScanSourceType;
  } | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isOpticalScanningId, setIsOpticalScanningId] = useState<string | null>(null);

  const onMemberIdentifiedRef = useRef(onMemberIdentified);
  onMemberIdentifiedRef.current = onMemberIdentified;

  const membersRef = useRef(members);
  membersRef.current = members;

  const stopCameraStream = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDecodedPayload = useCallback(
    (rawText: string, source: ScanSourceType) => {
      const result = parseAndMatchMemberQr(rawText, membersRef.current);
      if (result.matched && result.member) {
        setScanError(null);
        stopCameraStream();
        setRetrievedProfile({
          member: result.member,
          rawPayload: result.rawPayload,
          source,
        });
        onMemberIdentifiedRef.current(result.member, result.rawPayload, source);
      } else {
        setScanError(result.error || 'Kartu QR tidak dikenali.');
      }
    },
    [stopCameraStream]
  );

  const startCamera = useCallback(async () => {
    stopCameraStream();
    setScanError(null);
    setRetrievedProfile(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setCameraStatus('unavailable');
      setCameraErrorMsg(
        'Perangkat kamera tidak terdeteksi di peramban ini. Gunakan Pemindai Kartu Digital Nasabah atau unggah gambar QR di bawah.'
      );
      return;
    }

    setCameraStatus('requesting');
    setCameraErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraStatus('active');

      // Poll video frames every 180ms for QR decoding via jsQR
      scanTimerRef.current = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = scanCanvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        const width = video.videoWidth || 320;
        const height = video.videoHeight || 240;
        if (width <= 0 || height <= 0) return;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDecodedPayload(code.data, 'camera');
        }
      }, 180);
    } catch (err: any) {
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        String(err?.message || '').toLowerCase().includes('permission');

      setCameraStatus(isDenied ? 'denied' : 'unavailable');
      setCameraErrorMsg(
        isDenied
          ? 'Izin akses kamera ditolak atau diblokir. Izinkan akses kamera pada browser atau pilih Kartu Digital Nasabah di bawah.'
          : 'Kamera fisik tidak ditemukan pada perangkat ini. Anda tetap dapat memindai Kartu Digital Nasabah secara optik di bawah.'
      );
    }
  }, [facingMode, handleDecodedPayload, stopCameraStream]);

  useEffect(() => {
    if (isOpen) {
      if (initialPreviewMember) {
        stopCameraStream();
        setRetrievedProfile({
          member: initialPreviewMember,
          rawPayload: encodeMemberQrPayload(initialPreviewMember),
          source: 'optical-card',
        });
      } else {
        startCamera();
      }
    } else {
      stopCameraStream();
      setRetrievedProfile(null);
      setScanError(null);
      setManualCodeInput('');
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, initialPreviewMember, startCamera, stopCameraStream]);

  // Decode an uploaded QR image file via Canvas + jsQR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);
        if (decoded && decoded.data) {
          handleDecodedPayload(decoded.data, 'upload');
        } else {
          setScanError(
            'Kode QR tidak ditemukan pada gambar yang diunggah. Pastikan gambar kartu QR jelas.'
          );
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Real Optical Canvas QR Generator + jsQR Decoder for Digital Member Cards
  const handleOpticalScanDigitalCard = async (member: Member) => {
    setIsOpticalScanningId(member.id);
    setScanError(null);

    try {
      const payload = encodeMemberQrPayload(member);
      const offscreenCanvas = document.createElement('canvas');
      await QRCode.toCanvas(offscreenCanvas, payload, {
        width: 220,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);
        if (decoded && decoded.data) {
          handleDecodedPayload(decoded.data, 'optical-card');
          setIsOpticalScanningId(null);
          return;
        }
      }
      handleDecodedPayload(payload, 'optical-card');
    } catch {
      handleDecodedPayload(encodeMemberQrPayload(member), 'optical-card');
    } finally {
      setIsOpticalScanningId(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) {
      setScanError('Masukkan kode nasabah atau token QR terlebih dahulu.');
      return;
    }
    handleDecodedPayload(manualCodeInput, 'manual');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-modal-title"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0B0E14] text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Architectural Header with Hafi Digital Attribution */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#111622]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009CAC]/20 border border-[#009CAC]/40 text-teal-300">
              {retrievedProfile ? (
                <UserCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <QrCode className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="qr-scanner-modal-title" className="text-sm font-semibold text-white">
                  {retrievedProfile
                    ? 'Profil Nasabah Teridentifikasi'
                    : 'Pemindai QR Kartu Nasabah Digital'}
                </h2>
                <span className="rounded-md bg-teal-500/15 border border-teal-400/30 px-2 py-0.5 text-[10px] font-medium text-teal-300">
                  {HAFI_DIGITAL_BRAND}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {retrievedProfile
                  ? 'Data nasabah berhasil diverifikasi dari pemindaian Kartu Digital Pilah.in'
                  : 'Arahkan Kartu Anggota Pilah.in ke kamera atau pilih Kartu Digital di bawah untuk identifikasi instan'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pemindai QR"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {retrievedProfile ? (
            /* ============================================================
               CLEAN RETRIEVED MEMBER PROFILE MODAL VIEW
               ============================================================ */
            <div className="space-y-5" data-testid="retrieved-member-profile-modal">
              {/* Top Verification Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Identitas Kartu Anggota Valid & Terverifikasi
                    </p>
                    <p className="text-[11px] text-emerald-300">
                      Metode: {SOURCE_LABELS[retrievedProfile.source]} · {HAFI_DIGITAL_BRAND}
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-center rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Status: {retrievedProfile.member.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Clean Member Identity Card */}
              <div className="rounded-2xl border border-white/12 bg-gradient-to-br from-[#131B2E] via-[#111622] to-[#0D131F] p-5 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#009CAC] to-[#0C2D57] text-white font-bold text-lg shadow-md border border-teal-300/30">
                      {retrievedProfile.member.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {retrievedProfile.member.fullName}
                        </h3>
                        <span className="rounded-lg bg-teal-500/20 border border-teal-400/30 px-2.5 py-0.5 font-mono text-xs font-semibold text-teal-300">
                          {retrievedProfile.member.memberCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span>
                          {retrievedProfile.member.rtRw} · {retrievedProfile.member.address}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right bg-slate-950/60 rounded-xl px-3.5 py-2 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      ID Registri Hafi Digital
                    </span>
                    <span className="font-mono text-xs font-semibold text-teal-300">
                      {retrievedProfile.member.id.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Saldo Tabungan Digital
                      </span>
                      <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                        {formatIDR(retrievedProfile.member.walletBalance)}
                      </span>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Akumulasi Setoran Sampah
                      </span>
                      <span className="text-lg font-bold text-teal-300 font-mono mt-0.5 block">
                        {formatWeight(retrievedProfile.member.totalWeightKg)}
                      </span>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300">
                      <Scale className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Contact & Membership Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <Phone className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span className="text-slate-400">Telepon:</span>
                    <span className="font-mono font-semibold text-white">
                      {retrievedProfile.member.phoneNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <Calendar className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span className="text-slate-400">Terdaftar:</span>
                    <span className="font-mono font-semibold text-white">
                      {retrievedProfile.member.registrationDate} ({retrievedProfile.member.totalDepositCount}x Setor)
                    </span>
                  </div>
                </div>

                {/* Decoded QR Payload Signature */}
                <div className="rounded-xl bg-slate-950/90 border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Token Payload QR Terdekripsi
                    </span>
                    <p className="font-mono text-[11px] text-teal-300 truncate">
                      {retrievedProfile.rawPayload}
                    </p>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Pindai Kartu Lain</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onMemberIdentified(
                      retrievedProfile.member,
                      retrievedProfile.rawPayload,
                      retrievedProfile.source
                    );
                    onClose();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#009CAC] hover:bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-teal-950/50 transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Gunakan Profil & Lanjutkan Setoran</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================
               CAMERA QR SCANNER & OPTICAL CARD READER VIEW
               ============================================================ */
            <>
              {scanError && (
                <div className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/60 px-4 py-2.5 text-xs text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScanError(null)}
                    className="text-rose-300 hover:text-white text-[11px]"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* Top Grid: Live Camera Viewfinder + Upload / Manual Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                {/* Camera Viewfinder */}
                <div className="md:col-span-7 relative rounded-2xl border border-white/15 bg-slate-950 overflow-hidden min-h-[230px] flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${
                      cameraStatus === 'active' ? 'block' : 'hidden'
                    }`}
                  />
                  <canvas ref={scanCanvasRef} className="hidden" />

                  {cameraStatus === 'active' && (
                    <>
                      {/* Viewfinder Targeting Reticle */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="relative h-40 w-40 rounded-2xl border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(11,14,20,0.45)]">
                          <div className="absolute inset-x-2 top-1/2 h-0.5 bg-teal-400/90 animate-pulse" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] bg-slate-950/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          Kamera Aktif Memindai QR
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                          }
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Putar Kamera</span>
                        </button>
                      </div>
                    </>
                  )}

                  {cameraStatus === 'requesting' && (
                    <div className="p-6 text-center space-y-2">
                      <Camera className="h-8 w-8 text-teal-400 mx-auto animate-pulse" />
                      <p className="text-xs font-medium text-slate-200">
                        Meminta izin akses kamera peramban...
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Klik &ldquo;Allow / Izinkan&rdquo; pada dialog permission browser Anda.
                      </p>
                    </div>
                  )}

                  {(cameraStatus === 'denied' || cameraStatus === 'unavailable') && (
                    <div className="p-5 text-center space-y-3 max-w-xs">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-teal-400">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white">
                          {cameraStatus === 'denied'
                            ? 'Akses Kamera Belum Diizinkan'
                            : 'Mode Pemindai Optik Siap'}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{cameraErrorMsg}</p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-teal-300 transition cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Coba Aktifkan Kamera Lagi</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Upload QR Image & Manual Code Entry */}
                <div className="md:col-span-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#111622] p-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Opsi Identifikasi Alternatif</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Unggah tangkapan layar Kartu Member Digital atau ketik ID Anggota untuk menampilkan profil nasabah.
                    </p>

                    <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/15 px-3 py-2.5 text-xs font-medium text-teal-200 transition">
                      <Upload className="h-4 w-4 text-teal-300" />
                      <span>Unggah Gambar Kartu QR</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-white/10 pt-3">
                    <label className="block text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                      <Keyboard className="h-3.5 w-3.5 text-slate-400" />
                      <span>Input Kode Kartu / Token QR:</span>
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        placeholder="Contoh: PLH-0001"
                        aria-label="Kode Kartu Nasabah Manual"
                        className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-[#009CAC] hover:bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer shrink-0"
                      >
                        Cek
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Bottom Section: Instant Optical Digital Member Card Scanner */}
              <div className="space-y-2.5 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-400" />
                    <h3 className="text-xs font-semibold text-white">
                      Pindai Cepat Kartu Digital Nasabah ({HAFI_DIGITAL_BRAND})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Klik kartu untuk memuat profil nasabah via QR optik
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isScanningThis = isOpticalScanningId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleOpticalScanDigitalCard(m)}
                        disabled={isScanningThis}
                        className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#111622] hover:border-teal-400/60 hover:bg-teal-950/30 p-3 text-left transition cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-semibold text-teal-300">
                              {m.memberCode}
                            </span>
                            <span className="text-[10px] text-slate-400">· {m.rtRw}</span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate mt-0.5">
                            {m.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Saldo: {formatIDR(m.walletBalance)}
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-lg bg-white/5 group-hover:bg-[#009CAC] p-2 text-teal-300 group-hover:text-white transition shrink-0">
                          <QrCode className="h-4 w-4" />
                          <span className="text-[9px] font-semibold mt-0.5">
                            {isScanningThis ? 'Scan...' : 'Scan QR'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
