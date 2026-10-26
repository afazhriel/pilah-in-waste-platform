import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  UserCheck,
  Tag,
  Coins,
  ShieldCheck,
  Flame,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatWeightGrams, formatTimeOnlyID } from '../../utils/formatters';
import { ScaleState } from '../../types';

export const SmartWeighingStation: React.FC = () => {
  const {
    devices,
    activeDeviceId,
    setActiveDeviceId,
    simulatedWeightKg,
    setSimulatedWeight,
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
  } = useApp();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('mem-001');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-pet');
  const [paymentMethod, setPaymentMethod] = useState<'tabungan' | 'tunai'>('tabungan');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [completedTrxCode, setCompletedTrxCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Simulation controls
  const [sliderWeight, setSliderWeight] = useState<number>(simulatedWeightKg || 12.5);
  const [hasJitter, setHasJitter] = useState<boolean>(false);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedCategory = wasteCategories.find((c) => c.id === selectedCategoryId);

  // Price calculations
  const currentPricePerKg = selectedCategory ? selectedCategory.buyPricePerKg : 0;
  const currentTotalValue = selectedCategory
    ? Math.round(simulatedWeightKg * currentPricePerKg)
    : 0;

  // Handle simulation noise / jitter
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
      setErrorMessage('Bobot timbangan belum terdeteksi (0,00 kg). Letakkan sampah pada platform.');
      return;
    }
    if (!isScaleStable) {
      setErrorMessage('Timbangan belum stabil! Tunggu hingga indikator berubah menjadi HIJAU (STABLE).');
      return;
    }

    setScaleState('CONFIRMING');
    setErrorMessage('');

    // Atomic transaction execution
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
    <div className="space-y-6 pb-12">
      {/* Header with Device Status & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-50 text-[#009CAC] px-2.5 py-0.5 text-xs font-bold border border-teal-200">
              STASIUN TIMBANGAN IOT
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              <Zap className="h-3 w-3" /> MODE SIMULASI REAL-TIME
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-black text-slate-900 tracking-tight lg:text-2xl">
            Digital Scale Station
          </h1>
          <p className="text-xs text-slate-500">
            Penerimaan telemetri sensor load cell ESP32 dengan deteksi kestabilan bobot otomatis.
          </p>
        </div>

        {/* Device selector */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Perangkat Terpilih</p>
            <p className="text-xs font-mono font-bold text-slate-800">{activeDevice.deviceCode}</p>
          </div>
          <select
            value={activeDeviceId}
            onChange={(e) => setActiveDeviceId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#009CAC] focus:outline-hidden"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deviceCode} - {d.name.split(' (')[0]} ({d.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={() => toggleDeviceStatus(activeDevice.id)}
            title="Ubah Status Koneksi (Online / Offline)"
            className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${
              activeDevice.status === 'online'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {activeDevice.status === 'online' ? '● Online' : '○ Offline'}
          </button>
        </div>
      </div>

      {/* Main Weighing Grid: Scale LCD & Operator Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big LCD Scale Terminal (Fintech/Industrial Look) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border-2 border-slate-800 bg-[#0C2D57] p-6 text-white shadow-2xl relative overflow-hidden">
            {/* Ambient glass top bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#009CAC]" />
                <span className="font-mono text-xs font-bold tracking-wider text-teal-300">
                  {activeDevice.deviceCode}
                </span>
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  MAX {activeDevice.maxCapacityKg} KG
                </span>
              </div>

              {/* State Machine Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">STATE:</span>
                <span
                  className={`rounded-full px-3 py-0.5 font-mono text-xs font-black tracking-wider ${
                    scaleState === 'STABLE'
                      ? 'bg-emerald-400 text-slate-950 animate-pulse'
                      : scaleState === 'MEASURING'
                      ? 'bg-amber-400 text-slate-950'
                      : scaleState === 'COMPLETED'
                      ? 'bg-teal-300 text-slate-950'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {scaleState}
                </span>
              </div>
            </div>

            {/* High Contrast Digital LCD Display */}
            <div className="my-6 rounded-2xl bg-[#061529] p-6 border border-white/10 shadow-inner relative">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isScaleStable && simulatedWeightKg > 0.01
                        ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                        : 'bg-amber-400 animate-ping'
                    }`}
                  />
                  {isScaleStable ? 'STABLE LOCK (TERKUNCI)' : 'READING JITTER (MENGUKUR)'}
                </span>
                <span>AKURASI ±{activeDevice.precisionGram}g</span>
              </div>

              {/* Huge LCD weight readout */}
              <div className="flex items-baseline justify-between py-2">
                <div className="font-mono font-black text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#DDF7EE] drop-shadow-md">
                  {simulatedWeightKg.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-extrabold text-[#009CAC]">kg</span>
                  <p className="font-mono text-sm text-slate-400 mt-1">
                    {formatWeightGrams(simulatedWeightKg)}
                  </p>
                </div>
              </div>

              {/* Stability Score Bar */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-[10px] text-slate-400">STABILITAS:</span>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        scaleStabilityScore >= 90
                          ? 'bg-emerald-400'
                          : scaleStabilityScore >= 50
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${scaleStabilityScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-300">{scaleStabilityScore}%</span>
                </div>

                <span className="text-[10px] text-slate-400">
                  Telemetry: {formatTimeOnlyID(new Date().toISOString())}
                </span>
              </div>
            </div>

            {/* Hardware Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={tareScale}
                className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 px-4 py-2.5 text-xs font-mono font-bold text-white transition active:scale-95 border border-white/10"
              >
                <RotateCcw className="h-4 w-4 text-teal-400" />
                <span>TARE / NOLKAN TIMBANGAN</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                <span>Offset: {activeDevice.tareOffset.toFixed(2)} kg</span>
                <span>•</span>
                <span>Faktor: {activeDevice.calibrationFactor}</span>
              </div>
            </div>
          </div>

          {/* IoT Telemetry Simulation Console (Required for Phase 1 Demo & Testing) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#009CAC]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Panel Simulator Sensor IoT (ESP32 Load-Cell)
                </h3>
              </div>
              <span className="rounded bg-teal-50 text-[#009CAC] font-mono text-[10px] font-bold px-2 py-0.5">
                PENGUJIAN
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Gunakan kontrol di bawah ini untuk mensimulasikan bobot sampah yang diletakkan pada timbangan fisik:
            </p>

            {/* Quick Presets */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-400 self-center">Preset:</span>
              {[
                { label: 'Kosong (0 kg)', val: 0.0 },
                { label: 'Botol PET 3.5 kg', val: 3.5 },
                { label: 'Kardus 12.5 kg', val: 12.5 },
                { label: 'Besi Padat 25.0 kg', val: 25.0 },
                { label: 'Minyak 5.0 kg', val: 5.0 },
                { label: 'Karung Jumbo 48.0 kg', val: 48.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyWeight(p.val)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    simulatedWeightKg === p.val
                      ? 'bg-[#009CAC] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Weight Slider */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Geser Bobot Manual:</span>
                <span className="font-bold text-slate-900">{sliderWeight.toFixed(2)} kg</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={sliderWeight}
                onChange={(e) => handleApplyWeight(parseFloat(e.target.value))}
                className="w-full accent-[#009CAC] cursor-pointer"
              />
            </div>

            {/* Jitter Toggle */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Simulasi Fluktuasi Sensor (Noise/Jitter):</span>
                <span className="text-[10px] text-slate-400">Mensimulasikan gerakan benda di atas timbangan</span>
              </div>
              <button
                onClick={() => setHasJitter(!hasJitter)}
                className={`rounded-xl px-3 py-1 font-bold text-xs transition ${
                  hasJitter
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {hasJitter ? 'Aktif (Berguncang)' : 'Nonaktif (Stabil)'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Step & Transaction Confirmation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                WORKFLOW PENIMBANGAN
              </h2>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Konfirmasi Penyetoran Nasabah
              </h3>
            </div>

            {errorMessage && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <p className="font-semibold">{errorMessage}</p>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Step 1: Member Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-[#009CAC]" />
                  <span>1. Pilih Nasabah Penyetor</span>
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-[#009CAC] focus:bg-white focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberCode} - {m.fullName} ({m.rtRw}) • Saldo: {formatIDR(m.walletBalance)}
                    </option>
                  ))}
                </select>

                {selectedMember && (
                  <div className="mt-2 rounded-xl bg-teal-50/50 p-2.5 border border-teal-100 text-xs flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{selectedMember.fullName}</span>
                      <span className="text-[10px] text-slate-500 block">{selectedMember.address}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Saldo Tabungan:</span>
                      <span className="font-black text-[#0C2D57] font-mono">
                        {formatIDR(selectedMember.walletBalance)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Waste Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-[#009CAC]" />
                  <span>2. Pilih Jenis Sampah</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {wasteCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`flex items-start gap-2 rounded-xl p-2.5 text-left text-xs transition border ${
                          isSelected
                            ? 'bg-teal-50 border-[#009CAC] text-[#0C2D57] shadow-xs font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full mt-0.5 shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold leading-tight">{cat.name.split(' (')[0]}</p>
                          <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                            {formatIDR(cat.buyPricePerKg)}/kg
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-[#009CAC]" />
                  <span>3. Metode Penyaluran Dana</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tabungan')}
                    className={`rounded-xl p-2.5 text-xs font-bold transition border ${
                      paymentMethod === 'tabungan'
                        ? 'bg-[#0C2D57] text-white border-[#0C2D57] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Kredit Tabungan Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tunai')}
                    className={`rounded-xl p-2.5 text-xs font-bold transition border ${
                      paymentMethod === 'tunai'
                        ? 'bg-[#159B70] text-white border-[#159B70] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bayar Tunai Langsung
                  </button>
                </div>
              </div>

              {/* Live Transaction Calculation Summary */}
              <div className="rounded-2xl bg-slate-900 text-white p-4 font-mono space-y-2 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Bobot Terbaca:</span>
                  <span className="font-bold text-white">{formatWeight(simulatedWeightKg)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Harga Satuan (Snapshot):</span>
                  <span className="font-bold text-white">{formatIDR(currentPricePerKg)} / kg</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex items-baseline justify-between">
                  <span className="text-xs uppercase text-teal-400 font-bold">TOTAL DITERIMA:</span>
                  <span className="text-xl font-black text-[#DDF7EE] tracking-tight">
                    {formatIDR(currentTotalValue)}
                  </span>
                </div>
              </div>

              {/* Confirm / Save Transaction Button */}
              <button
                type="button"
                onClick={handleConfirmTransaction}
                disabled={simulatedWeightKg <= 0.01 || !isScaleStable}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-xl transition-all ${
                  simulatedWeightKg > 0.01 && isScaleStable
                    ? 'bg-gradient-to-r from-[#009CAC] to-[#159B70] hover:brightness-110 active:scale-98 shadow-teal-900/30 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {simulatedWeightKg <= 0.01
                    ? 'Letakkan Sampah pada Timbangan'
                    : !isScaleStable
                    ? 'Menunggu Kestabilan Bobot...'
                    : 'Konfirmasi & Simpan Setoran'}
                </span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Setoran diproses secara atomik: saldo nasabah, pergerakan gudang, dan log audit diperbarui otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-700">
                {completedTrxCode}
              </span>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                Setoran Sampah Berhasil Dicatat!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Data penimbangan sensor IoT telah terverifikasi dan dibukukan ke dalam buku tabungan digital.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left font-mono text-xs space-y-1.5 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Nasabah:</span>
                <span className="font-bold text-slate-900">{selectedMember?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-bold text-slate-900">{selectedCategory?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bobot:</span>
                <span className="font-bold text-slate-900">{formatWeight(simulatedWeightKg)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-black text-emerald-700">
                <span>Total Nilai:</span>
                <span>{formatIDR(currentTotalValue)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleResetForNext}
                className="flex-1 rounded-xl bg-[#009CAC] py-3 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Timbang Nasabah Berikutnya
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setActiveTab('overview');
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Lihat Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
