import React, { useState } from 'react';
import {
  RotateCcw,
  Database,
  Building,
  User,
  Copy,
  Server,
  Activity,
  Send,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Cpu,
  Code2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeID, formatTimeOnlyID } from '../../utils/formatters';
import { formatApiEndpointCurl } from '../../utils/apiPayload';

export const SettingsModule: React.FC = () => {
  const {
    currentBranch,
    currentUser,
    auditLogs,
    resetToDemoData,
    apiStatus,
    apiLatencyMs,
    lastSyncedAt,
    apiRequestLogs,
    refreshFromBackend,
    sendIotTelemetryWebhook,
    members,
    wasteCategories,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'api' | 'audit' | 'profile' | 'database'>('api');
  const [copySuccess, setCopySuccess] = useState(false);
  const [curlCopySuccess, setCurlCopySuccess] = useState(false);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    '/api/health' | '/api/iot/telemetry' | '/api/deposits' | '/api/bootstrap'
  >('/api/iot/telemetry');
  const [testWeightKg, setTestWeightKg] = useState<number>(14.65);
  const [apiResponsePreview, setApiResponsePreview] = useState<string>(() =>
    JSON.stringify(
      {
        status: 'online',
        service: 'Pilah.in Smart Waste Banking & IoT API Gateway',
        patronage: 'Dalam Naungan Hafi Digital',
        storageEngine: 'Persistent JSON-WAL + PostgreSQL Schema Ready',
        readyForRequests: true,
      },
      null,
      2
    )
  );
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const sampleSchema = `-- PILAH.IN PostgreSQL DDL Migration (20 Tables)
-- organizations, branches, profiles, members, waste_categories, category_price_history,
-- weighing_devices, device_telemetry, calibration_records, deposit_transactions,
-- deposit_items, wallet_accounts, wallet_ledger, inventory_movements, collectors,
-- collector_sales, collector_sale_items, expenses, withdrawal_requests, audit_logs.

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    member_code VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    wallet_balance BIGINT DEFAULT 0 CHECK (wallet_balance >= 0)
);

CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id),
    reference_type VARCHAR(32) NOT NULL,
    reference_code VARCHAR(64) NOT NULL,
    amount BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sampleSchema);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const curlSnippet =
    selectedEndpoint === '/api/iot/telemetry'
      ? formatApiEndpointCurl(currentOrigin, '/api/iot/telemetry', 'POST', {
          device_code: 'ESP32-SCALE-01',
          telemetry: {
            weight_kg: testWeightKg,
            is_stable: true,
            stability_score: 99,
            battery_pct: 94,
          },
        })
      : selectedEndpoint === '/api/deposits'
      ? formatApiEndpointCurl(currentOrigin, '/api/deposits', 'POST', {
          memberId: members[0]?.id || 'mem-001',
          paymentMethod: 'tabungan',
          isIotVerified: true,
          items: [{ categoryId: wasteCategories[0]?.id || 'cat-pet', weightKg: 5.5 }],
        })
      : formatApiEndpointCurl(currentOrigin, selectedEndpoint, 'GET');

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCurlCopySuccess(true);
    setTimeout(() => setCurlCopySuccess(false), 2000);
  };

  const handleExecuteApiTest = async () => {
    setIsTestingEndpoint(true);
    setFeedbackBanner(null);
    try {
      if (selectedEndpoint === '/api/iot/telemetry') {
        const result = await sendIotTelemetryWebhook({
          deviceCode: 'ESP32-SCALE-01',
          weightKg: testWeightKg,
          isStable: true,
        });
        const latestRes = await fetch('/api/iot/telemetry');
        const latestJson = await latestRes.json();
        setApiResponsePreview(JSON.stringify(latestJson, null, 2));
        setFeedbackBanner(
          `HTTP ${result.statusCode}: ${result.message}`
        );
      } else if (selectedEndpoint === '/api/deposits') {
        const targetMember = members[0];
        const targetCategory = wasteCategories[0];
        const res = await fetch('/api/deposits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: targetMember?.id || 'mem-001',
            paymentMethod: 'tabungan',
            isIotVerified: true,
            weighingStationId: 'dev-01',
            items: [
              {
                categoryId: targetCategory?.id || 'cat-pet',
                weightKg: Number(testWeightKg.toFixed(2)),
              },
            ],
          }),
        });
        const json = await res.json();
        setApiResponsePreview(JSON.stringify(json, null, 2));
        if (res.ok && json.success) {
          await refreshFromBackend();
          setFeedbackBanner(
            `HTTP 201 Created: Transaksi ${json.transaction?.transactionCode} (${testWeightKg} kg) berhasil disimpan ke database server!`
          );
        } else {
          setFeedbackBanner(`HTTP ${res.status}: ${json.error || 'Gagal memproses setoran API'}`);
        }
      } else {
        const res = await fetch(selectedEndpoint, {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        setApiResponsePreview(JSON.stringify(json, null, 2));
        if (selectedEndpoint === '/api/bootstrap') {
          await refreshFromBackend();
        }
        setFeedbackBanner(`HTTP ${res.status} OK: Respons dari ${selectedEndpoint} berhasil diterima.`);
      }
    } catch {
      setFeedbackBanner('Gagal menghubungi server Express /api/*. Pastikan server berjalan.');
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Pengaturan, Backend API & Audit Sistem
            </h1>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              Dalam Naungan Hafi Digital
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Konsol REST API Gateway, webhook telemetri IoT ESP32, log aktivitas sistem, dan skema database
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex flex-wrap rounded-lg bg-slate-200/70 p-0.5 gap-0.5">
          <button
            onClick={() => setActiveSubTab('api')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'api' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Integrasi Backend & API
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profil Cabang
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'database' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Skema SQL
          </button>
        </div>
      </div>

      {/* TAB 1: BACKEND & REST API GATEWAY CONSOLE */}
      {activeSubTab === 'api' && (
        <div className="space-y-5">
          {/* Status Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  STATUS EXPRESS API
                </span>
                <Server className="h-4 w-4 text-[#009CAC]" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    apiStatus === 'online'
                      ? 'bg-emerald-500'
                      : apiStatus === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-base font-extrabold text-slate-900 uppercase">
                  {apiStatus === 'online' ? 'TERHUBUNG (ONLINE)' : apiStatus}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-mono">
                Endpoint: /api/* · Port 3000
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  LATENSI & SINKRONISASI
                </span>
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-lg font-extrabold text-slate-900">
                  {apiLatencyMs} ms
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Real-time Sync</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Update: {lastSyncedAt ? formatTimeOnlyID(lastSyncedAt) : 'Baru saja'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  PERSISTENSI SERVER
                </span>
                <Database className="h-4 w-4 text-[#0C2D57]" />
              </div>
              <p className="mt-2 text-sm font-extrabold text-slate-900">
                JSON-WAL + PostgreSQL
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                File: <code>data/pilahin-db.json</code>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  KONTROL SINKRONISASI
                </span>
                <Cpu className="h-4 w-4 text-[#009CAC]" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refreshFromBackend()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-white transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-teal-300" />
                  <span> Tarik Data Server</span>
                </button>
              </div>
            </div>
          </div>

          {feedbackBanner && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{feedbackBanner}</span>
              </div>
              <button
                onClick={() => setFeedbackBanner(null)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-950 px-2 py-0.5 rounded cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Interactive Endpoint Sandbox & Live Response Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Endpoint Selector & Webhook Trigger */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#009CAC]">
                  REST API SANDBOX & IOT WEBHOOK TESTER
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
                  Uji Endpoint Backend Secara Langsung
                </h2>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Endpoint REST API
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      path: '/api/iot/telemetry' as const,
                      method: 'POST',
                      desc: 'Ingesti beban timbangan real-time dari node ESP32 HX711',
                    },
                    {
                      path: '/api/deposits' as const,
                      method: 'POST',
                      desc: 'Catat transaksi setoran sampah nasabah secara atomik',
                    },
                    {
                      path: '/api/health' as const,
                      method: 'GET',
                      desc: 'Status kesehatan server, uptime & metrik database',
                    },
                    {
                      path: '/api/bootstrap' as const,
                      method: 'GET',
                      desc: 'Hidrasi penuh seluruh entitas unit Bank Sampah',
                    },
                  ].map((ep) => {
                    const isSelected = selectedEndpoint === ep.path;
                    return (
                      <button
                        key={ep.path}
                        type="button"
                        onClick={() => setSelectedEndpoint(ep.path)}
                        className={`flex items-start justify-between rounded-xl border p-3 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-[#009CAC] bg-teal-50/30 ring-2 ring-[#009CAC]/15'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                ep.method === 'POST'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {ep.path}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">{ep.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(selectedEndpoint === '/api/iot/telemetry' ||
                selectedEndpoint === '/api/deposits') && (
                <div>
                  <label
                    htmlFor="api-test-weight"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Simulasi Beban Timbangan Payload (kg)
                  </label>
                  <input
                    id="api-test-weight"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="150"
                    value={testWeightKg}
                    onChange={(e) => setTestWeightKg(parseFloat(e.target.value) || 1.0)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={isTestingEndpoint}
                onClick={handleExecuteApiTest}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009CAC] hover:bg-teal-700 disabled:opacity-50 py-3 text-xs font-bold text-white transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {isTestingEndpoint
                    ? 'Mengirim Request ke Server...'
                    : `Kirim Request ke ${selectedEndpoint}`}
                </span>
              </button>

              {/* cURL Snippet */}
              <div className="rounded-xl bg-slate-900 p-3 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-teal-300 font-bold flex items-center gap-1">
                    <Code2 className="h-3 w-3" /> Perintah cURL Terminal
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCurl}
                    className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{curlCopySuccess ? 'Tersalin!' : 'Salin cURL'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {curlSnippet}
                </pre>
              </div>
            </div>

            {/* Right: Live JSON Response & Request Log Stream */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#061529] p-5 shadow-xl text-white space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-teal-300">
                      HTTP Response Inspector ({selectedEndpoint})
                    </span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                    application/json
                  </span>
                </div>

                <pre className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-teal-300 overflow-x-auto border border-white/5 leading-relaxed max-h-64">
                  {apiResponsePreview}
                </pre>
              </div>

              {/* Recent API & Webhook Request Logs */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Log Trafik REST API & Webhook ESP32
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Daftar request HTTP masuk ke server Express Pilah.in
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                    {apiRequestLogs.length} Request
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                        <th className="pb-2">Waktu</th>
                        <th className="pb-2">Metode & Endpoint</th>
                        <th className="pb-2">Sumber</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 font-sans">Ringkasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {apiRequestLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 text-[11px] text-slate-500 whitespace-nowrap">
                            {formatTimeOnlyID(item.timestamp)}
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            <span
                              className={`mr-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                item.method === 'POST'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.method === 'PUT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {item.method}
                            </span>
                            <span className="font-bold text-slate-800">{item.endpoint}</span>
                          </td>
                          <td className="py-2 text-[10px] text-slate-600 whitespace-nowrap">
                            {item.source}
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            <span className="text-emerald-700 font-bold">
                              {item.statusCode} ({item.latencyMs}ms)
                            </span>
                          </td>
                          <td className="py-2 font-sans text-[11px] text-slate-600 truncate max-w-xs">
                            {item.summary}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Log Audit Aktivitas Sistem (Immutable Activity Trail)
              </h3>
              <p className="text-[11px] text-slate-400">
                Setiap aksi setoran, penarikan, perubahan harga, dan kalibrasi terekam dengan timestamp Asia/Jakarta.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              {auditLogs.length} Entri
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pl-2">Waktu (WIB)</th>
                  <th className="pb-3 font-sans">Aktor & Peran</th>
                  <th className="pb-3">Aksi</th>
                  <th className="pb-3">Entitas</th>
                  <th className="pb-3 font-sans">Deskripsi Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pl-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDateTimeID(log.timestamp)}
                    </td>
                    <td className="py-2.5 font-sans whitespace-nowrap">
                      <p className="font-bold text-slate-800">{log.actor}</p>
                      <span className="text-[10px] text-[#009CAC] font-semibold">{log.role}</span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-900">{log.action}</td>
                    <td className="py-2.5 text-slate-600 text-[11px]">{log.entityId}</td>
                    <td className="py-2.5 font-sans text-slate-700 text-xs max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Branch details */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="h-4 w-4 text-[#009CAC]" />
              <h3 className="font-bold text-slate-800 text-sm">Informasi Unit Bank Sampah</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Nama Unit:</span>
                <span className="font-bold text-slate-800">{currentBranch.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Kode Cabang:</span>
                <span className="font-mono font-bold text-slate-800">{currentBranch.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Alamat:</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{currentBranch.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Kepala Unit:</span>
                <span className="font-bold text-slate-800">{currentBranch.manager}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Kontak Resmi:</span>
                <span className="font-bold text-slate-800">{currentBranch.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Naungan Ekosistem:</span>
                <span className="font-bold text-[#009CAC]">Dalam Naungan Hafi Digital</span>
              </div>
            </div>
          </div>

          {/* Operator profile & Reset Data */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-[#009CAC]" />
              <h3 className="font-bold text-slate-800 text-sm">Sesi Operator Aktif</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0C2D57] text-white font-bold">
                BS
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
                <p className="text-xs text-[#009CAC] font-semibold">{currentUser.role}</p>
                <p className="text-[11px] text-slate-400">{currentUser.email}</p>
              </div>
            </div>

            {/* Reset Data Box */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                <span>Pulihkan Data Operasional Standar</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mengembalikan daftar nasabah, transaksi, dan stok gudang di browser maupun database server ke kondisi awal unit kerja.
              </p>
              <button
                onClick={resetToDemoData}
                className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Reset Data Unit & Server
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="rounded-2xl border border-slate-800 bg-[#061529] p-5 shadow-xl text-white space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-teal-400" />
              <span className="font-mono text-xs font-bold text-teal-300">
                PostgreSQL Schema DDL (Supabase / Cloud SQL)
              </span>
            </div>
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white transition cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              <span>{copySuccess ? 'Tersalin!' : 'Salin DDL'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Skema ternormalisasi lengkap mencakup 20 tabel entitas sesuai spesifikasi Bagian 13 (tersimpan di <code>src/db/schema.sql</code>).
          </p>

          <pre className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-teal-300 overflow-x-auto border border-white/5 leading-relaxed max-h-96">
            {sampleSchema}
          </pre>
        </div>
      )}
    </div>
  );
};
