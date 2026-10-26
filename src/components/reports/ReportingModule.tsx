import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Printer,
  CheckCircle2,
  Download,
  Scale,
  Coins,
  FileCheck2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { formatIDR, formatWeight, formatDateID, formatDateTimeID } from '../../utils/formatters';

type ReportTopic = 'deposits' | 'members' | 'sales' | 'inventory';
type DateRangeFilter = 'today' | '7days' | '30days' | 'all';

export const ReportingModule: React.FC = () => {
  const {
    deposits,
    members,
    wasteCategories,
    collectorSales,
    inventoryStocks,
    currentBranch,
    currentUser,
  } = useApp();

  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [reportType, setReportType] = useState<ReportTopic>('deposits');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const getSellPrice = (categoryId: string, fallbackBuyPrice: number) => {
    const cat = wasteCategories.find((c) => c.id === categoryId);
    return cat ? cat.sellPricePerKg : Math.round(fallbackBuyPrice * 1.4);
  };

  const showFeedback = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => {
      setExportFeedback((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Filtered datasets by dateRange
  const filteredDeposits = useMemo(() => {
    if (dateRange === 'all') return deposits;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return deposits.filter((d) => {
      if (dateRange === 'today') {
        return d.timestamp.startsWith(todayStr);
      }
      const txDate = new Date(d.timestamp);
      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
      if (dateRange === '7days') return diffDays <= 7;
      if (dateRange === '30days') return diffDays <= 30;
      return true;
    });
  }, [deposits, dateRange]);

  const filteredSales = useMemo(() => {
    if (dateRange === 'all') return collectorSales;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return collectorSales.filter((s) => {
      if (dateRange === 'today') {
        return s.timestamp.startsWith(todayStr);
      }
      const saleDate = new Date(s.timestamp);
      const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
      if (dateRange === '7days') return diffDays <= 7;
      if (dateRange === '30days') return diffDays <= 30;
      return true;
    });
  }, [collectorSales, dateRange]);

  const reportMetadata = useMemo(() => {
    const titles: Record<ReportTopic, string> = {
      deposits: 'Laporan Rincian Setoran Sampah Nasabah',
      members: 'Laporan Posisi Saldo & Buku Tabungan Nasabah',
      sales: 'Laporan Realisasi Penjualan Material ke Pengepul',
      inventory: 'Laporan Stok Fisik & Valuasi Gudang Daur Ulang',
    };

    const rangeLabels: Record<DateRangeFilter, string> = {
      today: 'Hari Ini',
      '7days': '7 Hari Terakhir',
      '30days': '30 Hari Terakhir',
      all: 'Semua Data Historis',
    };

    return {
      title: titles[reportType],
      rangeLabel: rangeLabels[dateRange],
      dateSlug: new Date().toISOString().slice(0, 10),
    };
  }, [reportType, dateRange]);

  // Summary metrics for active report
  const summaryStats = useMemo(() => {
    if (reportType === 'deposits') {
      const totalKg = filteredDeposits.reduce((acc, d) => acc + d.totalWeightKg, 0);
      const totalRp = filteredDeposits.reduce((acc, d) => acc + d.totalValue, 0);
      return {
        countLabel: `${filteredDeposits.length} Transaksi Setoran`,
        weightLabel: formatWeight(totalKg),
        valueLabel: formatIDR(totalRp),
        rawWeightKg: totalKg,
        rawValueRp: totalRp,
      };
    }
    if (reportType === 'members') {
      const totalKg = members.reduce((acc, m) => acc + m.totalWeightKg, 0);
      const totalRp = members.reduce((acc, m) => acc + m.walletBalance, 0);
      return {
        countLabel: `${members.length} Nasabah Terdaftar`,
        weightLabel: formatWeight(totalKg),
        valueLabel: formatIDR(totalRp),
        rawWeightKg: totalKg,
        rawValueRp: totalRp,
      };
    }
    if (reportType === 'sales') {
      const totalKg = filteredSales.reduce((acc, s) => acc + s.totalWeightKg, 0);
      const totalRp = filteredSales.reduce((acc, s) => acc + s.totalSaleAmount, 0);
      const totalMargin = filteredSales.reduce((acc, s) => acc + s.totalGrossMargin, 0);
      return {
        countLabel: `${filteredSales.length} Faktur Penjualan`,
        weightLabel: formatWeight(totalKg),
        valueLabel: `${formatIDR(totalRp)} (Laba: ${formatIDR(totalMargin)})`,
        rawWeightKg: totalKg,
        rawValueRp: totalRp,
      };
    }
    const totalKg = inventoryStocks.reduce((acc, s) => acc + s.currentStockKg, 0);
    const totalRp = inventoryStocks.reduce((acc, s) => acc + s.estimatedValuation, 0);
    return {
      countLabel: `${inventoryStocks.length} Kategori Material`,
      weightLabel: formatWeight(totalKg),
      valueLabel: formatIDR(totalRp),
      rawWeightKg: totalKg,
      rawValueRp: totalRp,
    };
  }, [reportType, filteredDeposits, members, filteredSales, inventoryStocks]);

  // 1. EXCEL (.XLSX) EXPORTER
  const handleExportExcel = () => {
    const printedAt = formatDateTimeID(new Date().toISOString());

    const headerRows: any[][] = [
      ['PILAH.IN — SMART WASTE BANKING & IOT PLATFORM (DALAM NAUNGAN HAFI DIGITAL)'],
      [reportMetadata.title.toUpperCase()],
      ['Unit Kerja', `${currentBranch.name} (${currentBranch.code})`],
      ['Alamat Unit', currentBranch.address],
      ['Kepala Unit', currentBranch.manager],
      ['Petugas Ekspor', `${currentUser.name} (${currentUser.role})`],
      ['Periode Data', reportMetadata.rangeLabel],
      ['Waktu Cetak', `${printedAt} WIB`],
      [],
    ];

    let tableHeaders: string[] = [];
    let tableRows: any[][] = [];
    let footerRow: any[] = [];

    if (reportType === 'deposits') {
      tableHeaders = [
        'No',
        'Kode Transaksi',
        'Waktu (WIB)',
        'Kode Nasabah',
        'Nama Nasabah',
        'Rincian Material',
        'Total Berat (kg)',
        'Total Nilai (Rp)',
        'Metode Pembayaran',
        'Verifikasi IoT',
        'Petugas',
      ];
      tableRows = filteredDeposits.map((d, idx) => [
        idx + 1,
        d.transactionCode,
        formatDateTimeID(d.timestamp),
        d.memberCode,
        d.memberName,
        d.items.map((i) => `${i.categoryName} (${i.weightKg} kg)`).join('; '),
        Number(d.totalWeightKg.toFixed(2)),
        d.totalValue,
        d.paymentMethod.toUpperCase(),
        d.isIotVerified ? 'Sensor IoT Terverifikasi' : 'Input Manual',
        d.operatorName,
      ]);
      footerRow = [
        '',
        'TOTAL KESELURUHAN',
        '',
        '',
        '',
        `${filteredDeposits.length} Transaksi`,
        Number(summaryStats.rawWeightKg.toFixed(2)),
        summaryStats.rawValueRp,
        '',
        '',
        '',
      ];
    } else if (reportType === 'members') {
      tableHeaders = [
        'No',
        'Kode Nasabah',
        'Nama Lengkap',
        'No. Telepon',
        'Wilayah RT/RW',
        'Frekuensi Setor',
        'Total Berat Setor (kg)',
        'Akumulasi Nilai Setor (Rp)',
        'Saldo Tabungan Aktif (Rp)',
        'Status',
      ];
      tableRows = members.map((m, idx) => [
        idx + 1,
        m.memberCode,
        m.fullName,
        m.phoneNumber,
        m.rtRw,
        m.totalDepositCount,
        Number(m.totalWeightKg.toFixed(2)),
        m.totalDepositValue,
        m.walletBalance,
        m.status.toUpperCase(),
      ]);
      footerRow = [
        '',
        'TOTAL KEWAJIBAN SALDO',
        '',
        '',
        `${members.length} Nasabah`,
        members.reduce((a, b) => a + b.totalDepositCount, 0),
        Number(summaryStats.rawWeightKg.toFixed(2)),
        members.reduce((a, b) => a + b.totalDepositValue, 0),
        summaryStats.rawValueRp,
        '',
      ];
    } else if (reportType === 'sales') {
      tableHeaders = [
        'No',
        'No. Faktur',
        'Waktu Transaksi',
        'Mitra Pengepul',
        'Total Berat (kg)',
        'HPP Pembelian Nasabah (Rp)',
        'Nilai Penjualan Pengepul (Rp)',
        'Laba Kotor Terealisasi (Rp)',
        'Metode Pembayaran',
        'Armada / Supir',
      ];
      tableRows = filteredSales.map((s, idx) => [
        idx + 1,
        s.invoiceCode,
        formatDateTimeID(s.timestamp),
        s.collectorName,
        Number(s.totalWeightKg.toFixed(2)),
        s.totalCostAmount,
        s.totalSaleAmount,
        s.totalGrossMargin,
        s.paymentMethod.toUpperCase(),
        `${s.vehicleNumber || '-'} / ${s.driverName || '-'}`,
      ]);
      footerRow = [
        '',
        'TOTAL PENJUALAN',
        '',
        `${filteredSales.length} Faktur`,
        Number(summaryStats.rawWeightKg.toFixed(2)),
        filteredSales.reduce((a, b) => a + b.totalCostAmount, 0),
        summaryStats.rawValueRp,
        filteredSales.reduce((a, b) => a + b.totalGrossMargin, 0),
        '',
        '',
      ];
    } else {
      tableHeaders = [
        'No',
        'Kategori Material',
        'Stok Fisik Saat Ini (kg)',
        'Stok Siap Jual (kg)',
        'Harga Beli Rata-Rata (Rp/kg)',
        'Harga Jual Pengepul (Rp/kg)',
        'Valuasi HPP Gudang (Rp)',
        'Potensi Nilai Jual (Rp)',
      ];
      tableRows = inventoryStocks.map((s, idx) => {
        const sellPrice = getSellPrice(s.categoryId, s.avgBuyPricePerKg);
        return [
          idx + 1,
          s.categoryName,
          Number(s.currentStockKg.toFixed(2)),
          Number(s.availableStockKg.toFixed(2)),
          s.avgBuyPricePerKg,
          sellPrice,
          s.estimatedValuation,
          Math.round(s.currentStockKg * sellPrice),
        ];
      });
      footerRow = [
        '',
        'TOTAL INVENTARIS GUDANG',
        Number(summaryStats.rawWeightKg.toFixed(2)),
        Number(inventoryStocks.reduce((a, b) => a + b.availableStockKg, 0).toFixed(2)),
        '',
        '',
        summaryStats.rawValueRp,
        inventoryStocks.reduce(
          (a, b) => a + Math.round(b.currentStockKg * getSellPrice(b.categoryId, b.avgBuyPricePerKg)),
          0
        ),
      ];
    }

    const signatureRows: any[][] = [
      [],
      [],
      ['', 'Disiapkan Oleh,', '', '', '', '', 'Disahkan Oleh,'],
      ['', 'Petugas Operasional', '', '', '', '', 'Kepala Unit Bank Sampah'],
      [],
      [],
      ['', currentUser.name, '', '', '', '', currentBranch.manager],
    ];

    const worksheetData = [...headerRows, tableHeaders, ...tableRows, footerRow, ...signatureRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 26 },
      { wch: 32 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Operasional');

    const fileName = `PilahIn_${reportType.toUpperCase()}_${reportMetadata.dateSlug}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showFeedback(`File Excel "${fileName}" berhasil diunduh.`);
  };

  // 2. OFFICIAL PDF (.PDF) EXPORTER
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const printedAt = formatDateTimeID(new Date().toISOString());

    // Header Banner
    doc.setFillColor(12, 45, 87); // #0C2D57 Deep Navy
    doc.rect(14, 12, 269, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text('PILAH.IN — SMART WASTE BANKING & IOT · DALAM NAUNGAN HAFI DIGITAL', 20, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(221, 247, 238); // Mint accent
    doc.text(`${currentBranch.name} (${currentBranch.code}) · ${currentBranch.address}`, 20, 27);
    doc.text(`Kepala Unit: ${currentBranch.manager} · Kontak: ${currentBranch.phone}`, 20, 32);

    // Report Title & Metadata Strip
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(reportMetadata.title, 14, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Periode: ${reportMetadata.rangeLabel}   |   Waktu Cetak: ${printedAt} WIB   |   Petugas: ${currentUser.name}`,
      14,
      50.5
    );

    // Summary Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 54, 269, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(12, 45, 87);
    doc.text(`Ringkasan Cakupan: ${summaryStats.countLabel}`, 19, 61.5);
    doc.text(`Total Volume: ${summaryStats.weightLabel}`, 115, 61.5);
    doc.text(`Total Nominal: ${summaryStats.valueLabel}`, 195, 61.5);

    // Build Table Columns & Rows
    let head: string[][] = [];
    let body: any[][] = [];
    let foot: any[][] = [];

    if (reportType === 'deposits') {
      head = [
        [
          'No',
          'Kode TRX',
          'Waktu (WIB)',
          'Nasabah',
          'Rincian Material',
          'Berat (kg)',
          'Nilai Setoran',
          'Metode & Status',
        ],
      ];
      body = filteredDeposits.map((d, idx) => [
        idx + 1,
        d.transactionCode,
        formatDateTimeID(d.timestamp),
        `${d.memberName} (${d.memberCode})`,
        d.items.map((i) => `${i.categoryName.split(' (')[0]} (${i.weightKg}kg)`).join(', '),
        formatWeight(d.totalWeightKg),
        formatIDR(d.totalValue),
        `${d.paymentMethod.toUpperCase()} · ${d.isIotVerified ? 'IoT' : 'Manual'}`,
      ]);
      foot = [
        [
          '',
          'TOTAL',
          '',
          `${filteredDeposits.length} Transaksi`,
          '',
          formatWeight(summaryStats.rawWeightKg),
          formatIDR(summaryStats.rawValueRp),
          '',
        ],
      ];
    } else if (reportType === 'members') {
      head = [
        [
          'No',
          'ID Anggota',
          'Nama Lengkap',
          'No. Telepon',
          'Wilayah',
          'Frekuensi',
          'Total Setor',
          'Saldo Tabungan',
          'Status',
        ],
      ];
      body = members.map((m, idx) => [
        idx + 1,
        m.memberCode,
        m.fullName,
        m.phoneNumber,
        m.rtRw,
        `${m.totalDepositCount}x`,
        formatWeight(m.totalWeightKg),
        formatIDR(m.walletBalance),
        m.status.toUpperCase(),
      ]);
      foot = [
        [
          '',
          'TOTAL',
          `${members.length} Anggota`,
          '',
          '',
          `${members.reduce((a, b) => a + b.totalDepositCount, 0)}x`,
          formatWeight(summaryStats.rawWeightKg),
          formatIDR(summaryStats.rawValueRp),
          '',
        ],
      ];
    } else if (reportType === 'sales') {
      head = [
        [
          'No',
          'No. Faktur',
          'Tanggal',
          'Mitra Pengepul',
          'Berat (kg)',
          'HPP Nasabah',
          'Nilai Jual',
          'Laba Kotor',
        ],
      ];
      body = filteredSales.map((s, idx) => [
        idx + 1,
        s.invoiceCode,
        formatDateID(s.timestamp),
        s.collectorName,
        formatWeight(s.totalWeightKg),
        formatIDR(s.totalCostAmount),
        formatIDR(s.totalSaleAmount),
        `+${formatIDR(s.totalGrossMargin)}`,
      ]);
      foot = [
        [
          '',
          'TOTAL',
          '',
          `${filteredSales.length} Faktur`,
          formatWeight(summaryStats.rawWeightKg),
          formatIDR(filteredSales.reduce((a, b) => a + b.totalCostAmount, 0)),
          formatIDR(summaryStats.rawValueRp),
          `+${formatIDR(filteredSales.reduce((a, b) => a + b.totalGrossMargin, 0))}`,
        ],
      ];
    } else {
      head = [
        [
          'No',
          'Kategori Material',
          'Stok Gudang',
          'Siap Jual',
          'Harga Beli/kg',
          'Harga Jual/kg',
          'Valuasi HPP',
          'Potensi Jual',
        ],
      ];
      body = inventoryStocks.map((s, idx) => {
        const sellPrice = getSellPrice(s.categoryId, s.avgBuyPricePerKg);
        return [
          idx + 1,
          s.categoryName,
          formatWeight(s.currentStockKg),
          formatWeight(s.availableStockKg),
          formatIDR(s.avgBuyPricePerKg),
          formatIDR(sellPrice),
          formatIDR(s.estimatedValuation),
          formatIDR(Math.round(s.currentStockKg * sellPrice)),
        ];
      });
      foot = [
        [
          '',
          'TOTAL GUDANG',
          formatWeight(summaryStats.rawWeightKg),
          formatWeight(inventoryStocks.reduce((a, b) => a + b.availableStockKg, 0)),
          '',
          '',
          formatIDR(summaryStats.rawValueRp),
          formatIDR(
            inventoryStocks.reduce(
              (a, b) => a + Math.round(b.currentStockKg * getSellPrice(b.categoryId, b.avgBuyPricePerKg)),
              0
            )
          ),
        ],
      ];
    }

    autoTable(doc, {
      startY: 70,
      head,
      body,
      foot,
      theme: 'grid',
      headStyles: {
        fillColor: [12, 45, 87],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    // Physical Documentation Signature Block
    const finalY = (doc as any).lastAutoTable?.finalY || 140;
    const sigY = finalY + 12 < 175 ? finalY + 12 : 172;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text('Disiapkan & Diverifikasi Oleh,', 30, sigY);
    doc.text('Disahkan Oleh Kepala Unit,', 215, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`( ${currentUser.name} )`, 30, sigY + 18);
    doc.text(`( ${currentBranch.manager} )`, 215, sigY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(currentUser.role, 30, sigY + 22);
    doc.text(currentBranch.name, 215, sigY + 22);

    const fileName = `PilahIn_${reportType.toUpperCase()}_${reportMetadata.dateSlug}.pdf`;
    doc.save(fileName);
    showFeedback(`Dokumen PDF resmi "${fileName}" berhasil diunduh.`);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Compact Header with PDF, Excel, and Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Analitik & Dokumentasi Laporan
          </h1>
          <p className="text-xs text-slate-500">
            Ekspor laporan resmi ke format PDF dan Excel (.xlsx) untuk dokumentasi fisik maupun arsip digital
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg bg-[#0C2D57] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#081f3d] transition shadow-xs cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-teal-300" />
            <span>Unduh PDF (.pdf)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-lg bg-[#159B70] px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Fisik</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Banner */}
      {exportFeedback && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter and Selection Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-white p-3.5 border border-slate-200 no-print">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'deposits', label: 'Setoran Sampah' },
            { id: 'members', label: 'Buku Tabungan Nasabah' },
            { id: 'sales', label: 'Penjualan Pengepul' },
            { id: 'inventory', label: 'Stok & Valuasi Gudang' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id as ReportTopic)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                reportType === t.id
                  ? 'bg-[#0C2D57] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
            aria-label="Filter Periode Laporan"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#009CAC] focus:outline-hidden"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="all">Semua Data Historis</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Strip for Selected Report */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500">Cakupan Data Laporan</span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{summaryStats.countLabel}</p>
          </div>
          <FileCheck2 className="h-4 w-4 text-[#009CAC]" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500">Total Volume Material</span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{summaryStats.weightLabel}</p>
          </div>
          <Scale className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500">Total Nilai Finansial</span>
            <p className="text-sm font-semibold text-emerald-700 mt-0.5">{summaryStats.valueLabel}</p>
          </div>
          <Coins className="h-4 w-4 text-amber-500" />
        </div>
      </div>

      {/* Official Document Preview & Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="border-b border-slate-200 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#009CAC] font-medium">
              <span>DOKUMEN PERTANGGUNGJAWABAN RESMI</span>
              <span>·</span>
              <span>DALAM NAUNGAN HAFI DIGITAL</span>
              <span>·</span>
              <span>{currentBranch.code}</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              {reportMetadata.title}
            </h2>
            <p className="text-[11px] text-slate-500">
              {currentBranch.name} · Periode: {reportMetadata.rangeLabel} · Dicetak: {formatDateTimeID(new Date().toISOString())} WIB
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 no-print">
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Siap diekspor ke PDF & Excel</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {reportType === 'deposits' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="pb-2.5 pl-2">Kode TRX</th>
                  <th className="pb-2.5">Tanggal</th>
                  <th className="pb-2.5">Nasabah</th>
                  <th className="pb-2.5">Rincian Sampah</th>
                  <th className="pb-2.5 text-right">Berat</th>
                  <th className="pb-2.5 text-right">Nilai Diterima</th>
                  <th className="pb-2.5">Metode</th>
                  <th className="pb-2.5">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pl-2 font-semibold text-slate-900">{d.transactionCode}</td>
                    <td className="py-2.5 text-slate-500">{formatDateID(d.timestamp)}</td>
                    <td className="py-2.5 font-medium text-slate-800">
                      {d.memberName} <span className="text-slate-400">({d.memberCode})</span>
                    </td>
                    <td className="py-2.5 text-slate-600 max-w-[220px] truncate">
                      {d.items.map((i) => `${i.categoryName.split(' (')[0]} (${i.weightKg}kg)`).join(', ')}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {formatWeight(d.totalWeightKg)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">
                      {formatIDR(d.totalValue)}
                    </td>
                    <td className="py-2.5 text-slate-600 capitalize">
                      {d.paymentMethod} · {d.isIotVerified ? 'IoT' : 'Manual'}
                    </td>
                    <td className="py-2.5 text-slate-600">{d.operatorName}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={4} className="py-2.5 pl-2">
                    TOTAL ({filteredDeposits.length} Transaksi)
                  </td>
                  <td className="py-2.5 text-right">{formatWeight(summaryStats.rawWeightKg)}</td>
                  <td className="py-2.5 text-right text-emerald-700">
                    {formatIDR(summaryStats.rawValueRp)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}

          {reportType === 'members' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="pb-2.5 pl-2">ID Anggota</th>
                  <th className="pb-2.5">Nama Lengkap</th>
                  <th className="pb-2.5">No. HP</th>
                  <th className="pb-2.5">Wilayah</th>
                  <th className="pb-2.5 text-right">Frekuensi</th>
                  <th className="pb-2.5 text-right">Total Setor</th>
                  <th className="pb-2.5 text-right">Saldo Tabungan</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pl-2 font-semibold text-[#009CAC]">{m.memberCode}</td>
                    <td className="py-2.5 font-medium text-slate-900">{m.fullName}</td>
                    <td className="py-2.5 text-slate-600">{m.phoneNumber}</td>
                    <td className="py-2.5 text-slate-600">{m.rtRw}</td>
                    <td className="py-2.5 text-right text-slate-700">{m.totalDepositCount}x</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {formatWeight(m.totalWeightKg)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">
                      {formatIDR(m.walletBalance)}
                    </td>
                    <td className="py-2.5 text-center text-emerald-700 font-medium capitalize">
                      {m.status}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={5} className="py-2.5 pl-2">
                    TOTAL KEWAJIBAN SALDO ({members.length} Nasabah)
                  </td>
                  <td className="py-2.5 text-right">{formatWeight(summaryStats.rawWeightKg)}</td>
                  <td className="py-2.5 text-right text-emerald-700">
                    {formatIDR(summaryStats.rawValueRp)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}

          {reportType === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="pb-2.5 pl-2">No. Faktur</th>
                  <th className="pb-2.5">Tanggal</th>
                  <th className="pb-2.5">Mitra Pengepul</th>
                  <th className="pb-2.5 text-right">Berat (kg)</th>
                  <th className="pb-2.5 text-right">HPP Nasabah</th>
                  <th className="pb-2.5 text-right">Nilai Jual</th>
                  <th className="pb-2.5 text-right">Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pl-2 font-semibold text-slate-900">{s.invoiceCode}</td>
                    <td className="py-2.5 text-slate-500">{formatDateID(s.timestamp)}</td>
                    <td className="py-2.5 font-medium text-slate-800">{s.collectorName}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {formatWeight(s.totalWeightKg)}
                    </td>
                    <td className="py-2.5 text-right text-rose-600 font-medium">
                      {formatIDR(s.totalCostAmount)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {formatIDR(s.totalSaleAmount)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">
                      +{formatIDR(s.totalGrossMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={3} className="py-2.5 pl-2">
                    TOTAL REALISASI PENJUALAN ({filteredSales.length} Faktur)
                  </td>
                  <td className="py-2.5 text-right">{formatWeight(summaryStats.rawWeightKg)}</td>
                  <td className="py-2.5 text-right text-rose-600">
                    {formatIDR(filteredSales.reduce((a, b) => a + b.totalCostAmount, 0))}
                  </td>
                  <td className="py-2.5 text-right">{formatIDR(summaryStats.rawValueRp)}</td>
                  <td className="py-2.5 text-right text-emerald-700">
                    +{formatIDR(filteredSales.reduce((a, b) => a + b.totalGrossMargin, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="pb-2.5 pl-2">Kategori Material</th>
                  <th className="pb-2.5 text-right">Stok Fisik</th>
                  <th className="pb-2.5 text-right">Siap Jual</th>
                  <th className="pb-2.5 text-right">Harga Beli/kg</th>
                  <th className="pb-2.5 text-right">Harga Jual/kg</th>
                  <th className="pb-2.5 text-right">Valuasi HPP</th>
                  <th className="pb-2.5 text-right">Potensi Jual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryStocks.map((s) => {
                  const sellPrice = getSellPrice(s.categoryId, s.avgBuyPricePerKg);
                  return (
                    <tr key={s.categoryId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pl-2 font-medium text-slate-900">{s.categoryName}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">
                        {formatWeight(s.currentStockKg)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatWeight(s.availableStockKg)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatIDR(s.avgBuyPricePerKg)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatIDR(sellPrice)}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">
                        {formatIDR(s.estimatedValuation)}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-700">
                        {formatIDR(Math.round(s.currentStockKg * sellPrice))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td className="py-2.5 pl-2">TOTAL INVENTARIS GUDANG</td>
                  <td className="py-2.5 text-right">{formatWeight(summaryStats.rawWeightKg)}</td>
                  <td className="py-2.5 text-right">
                    {formatWeight(inventoryStocks.reduce((a, b) => a + b.availableStockKg, 0))}
                  </td>
                  <td colSpan={2} />
                  <td className="py-2.5 text-right">{formatIDR(summaryStats.rawValueRp)}</td>
                  <td className="py-2.5 text-right text-emerald-700">
                    {formatIDR(
                      inventoryStocks.reduce(
                        (a, b) =>
                          a + Math.round(b.currentStockKg * getSellPrice(b.categoryId, b.avgBuyPricePerKg)),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Physical Documentation Signature Block (Visible on Screen & Print) */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <p className="text-[11px] text-slate-400">Disiapkan & Diverifikasi Oleh,</p>
            <p className="font-medium text-slate-700 mt-0.5">Petugas Operasional</p>
            <div className="h-12" />
            <p className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-slate-400">{currentUser.role}</p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-slate-400">Disahkan Untuk Dokumentasi Fisik,</p>
            <p className="font-medium text-slate-700 mt-0.5">Kepala Unit Bank Sampah</p>
            <div className="h-12" />
            <p className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4">
              {currentBranch.manager}
            </p>
            <p className="text-[11px] text-slate-400">{currentBranch.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
