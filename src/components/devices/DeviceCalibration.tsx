import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Wifi,
  Battery,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Terminal,
  RotateCcw,
  Radio,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeID, formatTimeOnlyID } from '../../utils/formatters';

export const DeviceCalibration: React.FC = () => {
  const {
    devices,
    activeDeviceId,
    setActiveDeviceId,
    toggleDeviceStatus,
    tareScale,
    simulatedWeightKg,
    calibrateDeviceViaApi,
    sendIotTelemetryWebhook,
  } = useApp();

  const [activeDevice, setActiveDevice] = useState(
    devices.find((d) => d.id === activeDeviceId) || devices[0]
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // Calibration tool state
  const [refWeightKg, setRefWeightKg] = useState<number>(20.0);
  const [calibratedFactor, setCalibratedFactor] = useState<number>(1.0025);

  const handleCalibrate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await calibrateDeviceViaApi(activeDevice.id, refWeightKg, calibratedFactor);
    setFeedback(res.message);
  };

  const handleTriggerLiveWebhook = async () => {
    setIsSendingWebhook(true);
    const res = await sendIotTelemetryWebhook({
      deviceCode: activeDevice.deviceCode,
      weightKg: simulatedWeightKg > 0 ? simulatedWeightKg : refWeightKg,
      isStable: true,
    });
    setFeedback(`HTTP ${res.statusCode}: ${res.message}`);
    setIsSendingWebhook(false);
  };

  // Simulated IoT Telemetry Ingestion Payload preview
  const telemetryJson = {
    event_id: `evt-${Date.now()}`,
    device_code: activeDevice.deviceCode,
    mac_address: activeDevice.macAddress,
    firmware: activeDevice.firmwareVersion,
    timestamp: new Date().toISOString(),
    telemetry: {
      raw_adc: Math.round(simulatedWeightKg * 21540 + 820),
      weight_kg: simulatedWeightKg,
      unit: 'kg',
      is_stable: true,
      stability_score: 100,
      tare_offset: activeDevice.tareOffset,
      calibration_factor: activeDevice.calibrationFactor,
      ambient_temp_c: 29.4,
      battery_pct: activeDevice.batteryLevel || 94,
      rssi_dbm: activeDevice.signalStrengthDbm || -58,
    },
    auth: {
      signature: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      nonce: 492019,
    },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Perangkat IoT & Kalibrasi
          </h1>
          <p className="text-xs text-slate-500">
            Status node timbangan ESP32, faktor kalibrasi ADC, dan diagnostik sensor
          </p>
        </div>

        <button
          onClick={tareScale}
          className="flex items-center gap-1.5 rounded-lg bg-[#0C2D57] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#071f3e] transition"
        >
          <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
          <span>Tare Semua Timbangan</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-950 px-2 py-0.5 rounded cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Devices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((dev) => {
          const isSelected = activeDevice.id === dev.id;
          return (
            <div
              key={dev.id}
              onClick={() => {
                setActiveDevice(dev);
                setActiveDeviceId(dev.id);
              }}
              className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
                isSelected
                  ? 'border-[#009CAC] bg-teal-50/20 ring-2 ring-[#009CAC]/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0C2D57] text-white">
                    <Cpu className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">{dev.deviceCode}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          dev.status === 'online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {dev.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{dev.name}</p>
                    <p className="text-[11px] text-slate-400">{dev.location}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDeviceStatus(dev.id);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-50"
                >
                  Ubah Status
                </button>
              </div>

              {/* Hardware specs */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 font-mono text-xs border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">KAPASITAS</span>
                  <span className="font-bold text-slate-800">{dev.maxCapacityKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">PRESISI</span>
                  <span className="font-bold text-slate-800">±{dev.precisionGram} g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">BATERAI</span>
                  <span className="font-bold text-emerald-700">{dev.batteryLevel}%</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>MAC: {dev.macAddress}</span>
                <span>Ping: {formatTimeOnlyID(dev.lastHeartbeat)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calibration Form & Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calibration Form */}
        <form onSubmit={handleCalibrate} className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              KALIBRASI BOBOT ACUAN (STANDARD WEIGHT)
            </h2>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              Uji Deviasi & Kalibrasi {activeDevice.deviceCode}
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Letakkan anak timbangan standar bersertifikat (misal 20 kg atau 50 kg) di atas platform timbangan untuk menyesuaikan koefisien pengali ADC HX711.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bobot Standar Acuan (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={refWeightKg}
                onChange={(e) => setRefWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Faktor Koreksi Kalibrasi (Multiplier) *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={calibratedFactor}
                onChange={(e) => setCalibratedFactor(parseFloat(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Offset Nol (Tare Offset):</span>
                <span className="font-bold text-slate-800">{activeDevice.tareOffset} kg</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status Kestabilan Terakhir:</span>
                <span className="font-bold text-emerald-600">Stabil (100%)</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009CAC] py-3 text-xs font-bold text-white hover:bg-teal-700 transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Simpan Kalibrasi Sensor Baru</span>
          </button>
        </form>

        {/* Right: Ingestion Protocol JSON Inspector */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#061529] p-5 shadow-xl text-white space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-teal-300">
                POST /api/iot/telemetry (ESP32 Ingestion Inbound)
              </span>
            </div>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
              HTTPS/TLS Authenticated
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Payload telemetri real-time yang dikirimkan oleh firmware ESP32 untuk setiap penimbangan terenkripsi:
          </p>

          <pre className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-teal-300 overflow-x-auto border border-white/5 leading-relaxed">
            {JSON.stringify(telemetryJson, null, 2)}
          </pre>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono pt-1">
            <span>Perlindungan Replay: Nonce Unik + Timestamp Token</span>
            <button
              type="button"
              disabled={isSendingWebhook}
              onClick={handleTriggerLiveWebhook}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 px-3 py-1.5 text-xs font-bold text-emerald-300 transition cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>
                {isSendingWebhook ? 'Mengirim ke /api/iot/telemetry...' : 'Uji Kirim Webhook Telemetri'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
