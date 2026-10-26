import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Tag,
  Coins,
  Sliders,
  Check,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatWeightGrams, formatTimeOnlyID } from '../../utils/formatters';
import { InteractiveScale3D } from '../visuals/Isometric3DScene';
import { QrScannerModal } from '../deposit/QrScannerModal';
import { HAFI_DIGITAL_BRAND } from '../../utils/qrMember';

export const SmartWeighingStation: React.FC = () => {
  const {
    devices,
    activeDeviceId,
    setActiveDeviceId,
    simulatedWeightKg,
    scaleStabilityScore,
    isScaleStable,
    scaleState,
    setScaleState,
    tareScale,
    members,
    wasteCategories,
    recordDeposit,
    toggleDeviceStatus,
    pushWeightSample,
    setActiveTab,
    capacityWarningThresholdPct,
    capacityCriticalThresholdPct,
    setCapacityThresholds,
    currentCapacityPct,
    scannedMemberId,
    recordQrMemberScan,
  } = useApp();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(scannedMemberId || 'mem-001');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-pet');
  const [paymentMethod, setPaymentMethod] = useState<'tabungan' | 'tunai'>('tabungan');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [completedTrxCode, setCompletedTrxCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);

  const [sliderWeight, setSliderWeight] = useState<number>(simulatedWeightKg || 0);
  const [hasJitter, setHasJitter] = useState<boolean>(false);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedCategory = wasteCategories.find((c) => c.id === selectedCategoryId);

  const currentPricePerKg = selectedCategory ? selectedCategory.buyPricePerKg : 0;
  const currentTotalValue = selectedCategory ? Math.round(simulatedWeightKg * currentPricePerKg) : 0;

  useEffect(() => {
    let interval: any;
    if (hasJitter && simulatedWeightKg > 0) {
      interval = setInterval(() => {
        const noise = (Math.random() - 0.5) * 0.4;
        const noisyVal = Math.max(0, Number((sliderWeight + noise).toFixed(2)));
        pushWeightSample(noisyVal);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [hasJitter, sliderWeight, simulatedWeightKg]);

  const handleApplyWeight = (weight: number) => {
    setSliderWeight(weight);
    pushWeightSample(weight, true);
  };

  const handleConfirmTransaction = () => {
    if (!selectedMember) {
      setErrorMessage('Pilih nasabah terlebih dahulu.');
      return;
    }
    if (!selectedCategory) {
      setErrorMessage('Pilih kategori sampah.');
      return;
    }
    if (simulatedWeightKg <= 0.01) {
      setErrorMessage('Bobot timbangan masih 0,00 kg.');
      return;
    }
    if (!isScaleStable) {
      setErrorMessage('Tunggu hingga pembacaan sensor terkunci stabil.');
      return;
    }

    setScaleState('CONFIRMING');
    setErrorMessage('');

    const res = recordDeposit({
      memberId: selectedMember.id,
      items: [
        {
          categoryId: selectedCategory.id,
          weightKg: simulatedWeightKg,
        },
      ],
      paymentMethod,
      weighingStationId: activeDevice.id,
      isIotVerified: true,
    });

    if (res.success && res.transaction) {
      setCompletedTrxCode(res.transaction.transactionCode);
      setScaleState('COMPLETED');
      setIsSuccessModalOpen(true);
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan transaksi.');
      setScaleState('STABLE');
    }
  };

  const handleResetForNext = () => {
    setIsSuccessModalOpen(false);
    tareScale();
    setSliderWeight(0.0);
    setScaleState('IDLE');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Stasiun Timbangan IoT
            </h1>
            <span className="hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {HAFI_DIGITAL_BRAND}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Terminal pembacaan sensor beban ESP32 dan identifikasi kartu QR nasabah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeDeviceId}
            onChange={(e) => setActiveDeviceId(e.target.value)}
            aria-label="Pilih Perangkat Timbangan"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deviceCode} · {d.name.split(' (')[0]}
              </option>
            ))}
          </select>

          <button
            onClick={() => toggleDeviceStatus(activeDevice.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition whitespace-nowrap ${
              activeDevice.status === 'online'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {activeDevice.status === 'online' ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Digital Scale LCD + 3D Isometric Visualizer + Direct Production Weight Control */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-[#0C2D57] p-5 text-white shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <Cpu className="h-4 w-4 text-[#009CAC]" />
                <span className="font-bold text-teal-300">{activeDevice.deviceCode}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300">Maks {activeDevice.maxCapacityKg} kg</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[11px] text-slate-400">Status:</span>
                <span className="font-bold text-[#DDF7EE]">{scaleState}</span>
              </div>
            </div>

            {/* LCD + 3D Scale Split */}
            <div className="my-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-4 rounded-xl bg-[#061529] p-4 border border-white/10">
              <div className="sm:col-span-8">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>{isScaleStable ? 'KUNCI STABIL' : 'MENGUKUR BEBAN'}</span>
                  <span>±{activeDevice.precisionGram}g</span>
                </div>

                <div className="flex items-baseline gap-3 py-1">
                  <div
                    className={`font-semibold text-5xl sm:text-6xl tracking-tight ${
                      currentCapacityPct >= capacityCriticalThresholdPct
                        ? 'text-rose-400'
                        : currentCapacityPct >= capacityWarningThresholdPct
                        ? 'text-amber-300'
                        : 'text-[#DDF7EE]'
                    }`}
                  >
                    {simulatedWeightKg.toFixed(2).replace('.', ',')}
                  </div>
                  <div>
                    <span className="text-2xl font-semibold text-[#009CAC]">kg</span>
                    <p className="text-xs text-slate-400">
                      {formatWeightGrams(simulatedWeightKg)}
                    </p>
                  </div>
                </div>

                {/* Real-Time Capacity Threshold Progress Bar */}
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">
                      Utilisasi Kapasitas ({simulatedWeightKg.toFixed(1)} / {activeDevice.maxCapacityKg} kg)
                    </span>
                    <span
                      className={`font-semibold ${
                        currentCapacityPct >= capacityCriticalThresholdPct
                          ? 'text-rose-400'
                          : currentCapacityPct >= capacityWarningThresholdPct
                          ? 'text-amber-300'
                          : 'text-teal-300'
                      }`}
                    >
                      {currentCapacityPct}%{' '}
                      {currentCapacityPct >= capacityCriticalThresholdPct
                        ? '· KRITIS'
                        : currentCapacityPct >= capacityWarningThresholdPct
                        ? '· PERINGATAN'
                        : '· AMAN'}
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        currentCapacityPct >= capacityCriticalThresholdPct
                          ? 'bg-rose-500'
                          : currentCapacityPct >= capacityWarningThresholdPct
                          ? 'bg-amber-400'
                          : 'bg-[#009CAC]'
                      }`}
                      style={{ width: `${Math.min(100, currentCapacityPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Stabilitas: {scaleStabilityScore}%</span>
                    <span>
                      Ambang Peringatan {capacityWarningThresholdPct}% · Kritis {capacityCriticalThresholdPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive 3D Isometric Scale */}
              <div className="sm:col-span-4 flex justify-center">
                <InteractiveScale3D
                  weightKg={simulatedWeightKg}
                  scaleState={scaleState}
                  isStable={isScaleStable}
                />
              </div>
            </div>

            {currentCapacityPct >= capacityWarningThresholdPct && (
              <div
                className={`mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs border ${
                  currentCapacityPct >= capacityCriticalThresholdPct
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-100'
                    : 'bg-amber-950/70 border-amber-400/50 text-amber-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 shrink-0 ${
                      currentCapacityPct >= capacityCriticalThresholdPct ? 'text-rose-400' : 'text-amber-300'
                    }`}
                  />
                  <span>
                    {currentCapacityPct >= capacityCriticalThresholdPct
                      ? `Beban mencapai ${currentCapacityPct}% (Melewati ambang kritis ${capacityCriticalThresholdPct}%). Notifikasi manajer telah dikirim.`
                      : `Beban mencapai ${currentCapacityPct}% (Melewati ambang peringatan ${capacityWarningThresholdPct}%). Notifikasi manajer aktif.`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={tareScale}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition border border-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
                <span>Nolkan Timbangan (Tare)</span>
              </button>
              <span className="text-[11px] text-slate-300">
                Faktor Kalibrasi: {activeDevice.calibrationFactor}
              </span>
            </div>
          </div>

          {/* Direct Production Weight & Threshold Control */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#009CAC]" />
                <h2 className="text-xs font-semibold text-slate-800">
                  Kontrol Bobot & Simulasi Ambang Kapasitas
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                Kapasitas Maks: {activeDevice.maxCapacityKg} kg
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Kosong (0 kg)', val: 0.0, tone: 'default' },
                { label: 'Botol PET 3,5 kg', val: 3.5, tone: 'default' },
                { label: 'Kardus 12,5 kg', val: 12.5, tone: 'default' },
                { label: 'Karung 48,0 kg', val: 48.0, tone: 'default' },
                {
                  label: `Ambang Peringatan (${Math.round(activeDevice.maxCapacityKg * (capacityWarningThresholdPct / 100))} kg · ${capacityWarningThresholdPct}%)`,
                  val: Number((activeDevice.maxCapacityKg * (capacityWarningThresholdPct / 100)).toFixed(1)),
                  tone: 'warning',
                },
                {
                  label: `Ambang Kritis (${Math.round(activeDevice.maxCapacityKg * (capacityCriticalThresholdPct / 100))} kg · ${capacityCriticalThresholdPct}%)`,
                  val: Number((activeDevice.maxCapacityKg * (capacityCriticalThresholdPct / 100)).toFixed(1)),
                  tone: 'critical',
                },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyWeight(p.val)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    simulatedWeightKg === p.val
                      ? p.tone === 'critical'
                        ? 'bg-rose-600 text-white'
                        : p.tone === 'warning'
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#009CAC] text-white'
                      : p.tone === 'critical'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : p.tone === 'warning'
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Penyesuaian Bobot Real-Time (0 – {activeDevice.maxCapacityKg} kg):</span>
                <span className="font-semibold text-slate-900">
                  {sliderWeight.toFixed(1)} kg ({currentCapacityPct}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={activeDevice.maxCapacityKg}
                step="0.5"
                value={sliderWeight}
                onChange={(e) => handleApplyWeight(parseFloat(e.target.value))}
                aria-label="Penyesuaian Bobot"
                className="w-full accent-[#009CAC] cursor-pointer"
              />
            </div>

            {/* Configurable Notification Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-600">Ambang Peringatan Notifikasi</span>
                  <span className="text-xs font-semibold text-amber-700">{capacityWarningThresholdPct}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="85"
                  step="5"
                  value={capacityWarningThresholdPct}
                  onChange={(e) =>
                    setCapacityThresholds(Number(e.target.value), capacityCriticalThresholdPct)
                  }
                  aria-label="Ambang Peringatan Kapasitas"
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-600">Ambang Kritis Notifikasi</span>
                  <span className="text-xs font-semibold text-rose-700">{capacityCriticalThresholdPct}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="100"
                  step="5"
                  value={capacityCriticalThresholdPct}
                  onChange={(e) =>
                    setCapacityThresholds(capacityWarningThresholdPct, Number(e.target.value))
                  }
                  aria-label="Ambang Kritis Kapasitas"
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <span className="text-slate-600">Uji Guncangan Beban (Sensor Dinamis)</span>
              <button
                onClick={() => setHasJitter(!hasJitter)}
                className={`rounded-lg px-2.5 py-1 font-medium text-xs transition ${
                  hasJitter
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {hasJitter ? 'Dinamis Aktif' : 'Kunci Stabil'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Concise Operator Confirmation Panel */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900">Konfirmasi Setoran</h2>
              <p className="text-[11px] text-slate-500">Pilih nasabah dan kategori material.</p>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}

            {/* 1. Member */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#009CAC]" />
                  <span>1. Nasabah</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#009CAC] hover:underline cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan QR Nasabah</span>
                </button>
              </div>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-800 focus:border-[#009CAC] focus:bg-white focus:outline-hidden"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.memberCode} - {m.fullName} · Saldo {formatIDR(m.walletBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Waste Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[#009CAC]" />
                <span>2. Jenis Sampah</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                {wasteCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex items-start gap-2 rounded-lg p-2 text-left text-xs transition border ${
                        isSelected
                          ? 'bg-teal-50/70 border-[#009CAC] text-[#0C2D57] font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold leading-tight">{cat.name.split(' (')[0]}</p>
                        <p className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5 tabular-nums">
                          {formatIDR(cat.buyPricePerKg)}/kg
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Payout Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-[#009CAC]" />
                <span>3. Metode</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tabungan')}
                  className={`rounded-lg py-2 px-3 text-xs font-bold transition border ${
                    paymentMethod === 'tabungan'
                      ? 'bg-[#0C2D57] text-white border-[#0C2D57]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Kredit Tabungan
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tunai')}
                  className={`rounded-lg py-2 px-3 text-xs font-bold transition border ${
                    paymentMethod === 'tunai'
                      ? 'bg-[#159B70] text-white border-[#159B70]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Bayar Tunai
                </button>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="rounded-xl bg-slate-900 text-white p-3.5 font-mono tabular-nums space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Bobot × Harga:</span>
                <span className="text-white">
                  {formatWeight(simulatedWeightKg)} × {formatIDR(currentPricePerKg)}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex items-baseline justify-between">
                <span className="text-xs text-teal-400 font-bold">TOTAL:</span>
                <span className="text-lg font-black text-[#DDF7EE]">
                  {formatIDR(currentTotalValue)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmTransaction}
              disabled={simulatedWeightKg <= 0.01 || !isScaleStable}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white transition ${
                simulatedWeightKg > 0.01 && isScaleStable
                  ? 'bg-[#009CAC] hover:bg-teal-700 cursor-pointer shadow-sm'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {simulatedWeightKg <= 0.01
                  ? 'Pilih atau Masukkan Bobot'
                  : !isScaleStable
                  ? 'Menunggu Kestabilan...'
                  : 'Konfirmasi & Simpan Setoran'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-center space-y-3.5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>

            <div>
              <p className="font-mono text-xs font-bold text-emerald-700">{completedTrxCode}</p>
              <h3 className="mt-1 text-base font-extrabold text-slate-900">
                Setoran Berhasil Dibukukan
              </h3>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 text-left font-mono text-xs space-y-1 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Nasabah:</span>
                <span className="font-bold text-slate-900">{selectedMember?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Material:</span>
                <span className="font-bold text-slate-900">{selectedCategory?.name.split(' (')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bobot:</span>
                <span className="font-bold text-slate-900">{formatWeight(simulatedWeightKg)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-black text-emerald-700">
                <span>Total:</span>
                <span>{formatIDR(currentTotalValue)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleResetForNext}
                className="flex-1 rounded-lg bg-[#009CAC] py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Timbang Berikutnya
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setActiveTab('overview');
                }}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Ringkasan
              </button>
            </div>
          </div>
        </div>
      )}

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        members={members}
        onMemberIdentified={(member, _raw, source) => {
          setSelectedMemberId(member.id);
          setErrorMessage('');
          recordQrMemberScan(member, `Timbangan IoT (${source})`);
        }}
      />
    </div>
  );
};
