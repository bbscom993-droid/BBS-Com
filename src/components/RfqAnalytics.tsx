import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, CartesianGrid, 
  XAxis, YAxis, Tooltip as RechartsTooltip 
} from "recharts";
import { RFQ, ProductItem, Quotation, CompanySettings } from "../types";
import { PRODUCT_CATALOG } from "../data";
import { 
  BarChart3, TrendingUp, Info, Shield, Layers, HelpCircle, Briefcase, 
  Building, GraduationCap, Store, Activity, Calendar, FileText, Download, 
  Printer, CheckCircle2, X, Sparkles, FileCheck, ArrowUpRight, PieChart,
  ChevronDown, RefreshCw
} from "lucide-react";

interface RfqAnalyticsProps {
  rfqs: RFQ[];
  catalogProducts?: ProductItem[];
  quotations?: Quotation[];
  settings?: CompanySettings;
}

interface GroupedData {
  key: string;
  value: number;
  count: number;
  percentage: number;
}

// Extract numeric price from string format like "Rp 10.500.000 - Rp 14.500.000"
const getNumericPrice = (rangeStr: string): number => {
  if (!rangeStr) return 5000000;
  const numbers = rangeStr.replace(/[^0-9]/g, "");
  if (!numbers) return 5000000;
  
  // If it's a range, let's take the mid price, or just the first number
  if (rangeStr.includes("-")) {
    const parts = rangeStr.split("-");
    const p1 = parseInt(parts[0].replace(/[^0-9]/g, ""), 10) || 5000000;
    const p2 = parseInt(parts[1].replace(/[^0-9]/g, ""), 10) || p1;
    return Math.round((p1 + p2) / 2);
  }
  
  return parseInt(numbers, 10) || 5000000;
};

// Calculate total value of a single RFQ
const getRfqValue = (rfq: RFQ, catalog: ProductItem[]): number => {
  let rfqValue = 0;
  if (!rfq.items || rfq.items.length === 0) return 0;
  
  rfq.items.forEach((item) => {
    const itemNameLower = item.name.toLowerCase();
    const matched = catalog.find((p) => {
      const pNameLower = p.name.toLowerCase();
      return pNameLower.includes(itemNameLower) || itemNameLower.includes(pNameLower);
    });
    
    let price = matched ? getNumericPrice(matched.estimatedPriceRange) : 5000000;
    if (price === 0) price = 5000000;
    rfqValue += price * item.quantity;
  });
  return rfqValue;
};

// Formatting Rupiah to short string like "Rp 150 Jt" or "Rp 12.5 Jt"
const formatShortRupiah = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${value}`;
};

const formatFullRupiah = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const getLast6MonthsList = () => {
  const result = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
  ];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthIndex = d.getMonth();
    const year = d.getFullYear();
    const label = `${monthNames[monthIndex]} ${year}`;
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`; // YYYY-MM
    result.push({ label, key, total: 0, count: 0 });
  }
  return result;
};

const MONTH_NAMES_INDONESIAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Helper to generate a D3 visual chart as base64 PNG image for the PDF report
const generateD3PdfChartImage = (
  monthlyData: { label: string; total: number; count: number }[],
  statusDist: { label: string; count: number; color: string }[],
  width = 1200,
  height = 520
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve("");
        return;
      }

      // Fill Dark Slate Canvas Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Decorative Top Accent Bar
      const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
      headerGrad.addColorStop(0, "#4f46e5");
      headerGrad.addColorStop(0.5, "#818cf8");
      headerGrad.addColorStop(1, "#06b6d4");
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, 8);

      // Title & Subtitle
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("GRAFIK PERFORMA RFQ & ANALISIS TREN BULANAN", 35, 48);

      ctx.fillStyle = "#818cf8";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("D3.JS DATA ENGINE - PROJECTION & STATUS DISTRIBUTION", 35, 70);

      // Split Canvas into 2 Panels
      const leftW = 720;
      const rightW = width - leftW - 80;

      // --- LEFT PANEL: D3 Bar & Line Trend Chart ---
      const padding = { top: 120, right: 30, bottom: 65, left: 110 };
      const chartW = leftW - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const maxVal = d3.max(monthlyData, (d) => d.total) || 1000000;

      const xScale = d3.scaleBand()
        .domain(monthlyData.map((d) => d.label))
        .range([0, chartW])
        .padding(0.35);

      const yScale = d3.scaleLinear()
        .domain([0, maxVal * 1.25])
        .range([chartH, 0]);

      // Draw Gridlines
      const yTicks = yScale.ticks(5);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;

      yTicks.forEach((tick) => {
        const y = padding.top + yScale(tick);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        const formatted = tick >= 1_000_000_000 
          ? `${(tick / 1_000_000_000).toFixed(1)} M` 
          : tick >= 1_000_000 
            ? `${(tick / 1_000_000).toFixed(0)} Jt` 
            : `${tick}`;
        ctx.fillText(formatted, padding.left - 12, y + 4);
      });

      // Draw Bars
      monthlyData.forEach((d) => {
        const x = padding.left + (xScale(d.label) || 0);
        const barW = xScale.bandwidth();
        const barH = chartH - yScale(d.total);
        const y = padding.top + yScale(d.total);

        // Bar Gradient
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, "#6366f1");
        grad.addColorStop(1, "#312e81");

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
        } else {
          ctx.rect(x, y, barW, barH);
        }
        ctx.fill();

        // Bar border
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label on bar top
        if (d.total > 0) {
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          const lbl = d.total >= 1_000_000_000 
            ? `${(d.total / 1_000_000_000).toFixed(1)}M` 
            : d.total >= 1_000_000 
              ? `${(d.total / 1_000_000).toFixed(1)}Jt` 
              : `${d.total}`;
          ctx.fillText(lbl, x + barW / 2, y - 8);
        }

        // X Axis Month Label
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.label, x + barW / 2, padding.top + chartH + 28);
      });

      // D3 Line Plot
      const lineGen = d3.line<{ label: string; total: number; count: number }>()
        .x((d) => padding.left + (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .y((d) => padding.top + yScale(d.total))
        .curve(d3.curveMonotoneX)
        .context(ctx);

      ctx.beginPath();
      lineGen(monthlyData);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Line Dots
      monthlyData.forEach((d) => {
        const cx = padding.left + (xScale(d.label) || 0) + xScale.bandwidth() / 2;
        const cy = padding.top + yScale(d.total);

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#c084fc";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // --- RIGHT PANEL: Status Distribution Bar Chart ---
      const rightX = leftW + 30;
      const rightY = 115;

      // Divider line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftW, 90);
      ctx.lineTo(leftW, height - 40);
      ctx.stroke();

      // Right Panel Header
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("DISTRIBUSI STATUS RFQ", rightX, rightY);

      const totalCount = d3.sum(statusDist, (s) => s.count) || 1;
      const maxCount = d3.max(statusDist, (s) => s.count) || 1;

      const rightBarScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([0, rightW - 130]);

      let currY = rightY + 35;

      statusDist.forEach((st) => {
        // Label
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(st.label, rightX, currY);

        // Bar
        const bX = rightX;
        const bY = currY + 8;
        const bW = Math.max(8, rightBarScale(st.count));
        const bH = 16;

        ctx.fillStyle = st.color || "#6366f1";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bX, bY, bW, bH, 4);
        } else {
          ctx.rect(bX, bY, bW, bH);
        }
        ctx.fill();

        // Count Text
        const pct = Math.round((st.count / totalCount) * 100);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`${st.count} RFQ (${pct}%)`, bX + bW + 10, bY + 12);

        currY += 52;
      });

      resolve(canvas.toDataURL("image/png"));
    } catch (e) {
      console.error("Gagal generate D3 chart image:", e);
      resolve("");
    }
  });
};

export default function RfqAnalytics({ rfqs, catalogProducts, quotations, settings }: RfqAnalyticsProps) {
  const activeCatalog = catalogProducts || PRODUCT_CATALOG;
  const [dimension, setDimension] = useState<"client" | "product" | "vendor">("client");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(600);

  // Modal State for Monthly Report Generator
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [selectedReportMonth, setSelectedReportMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedReportYear, setSelectedReportYear] = useState<number>(new Date().getFullYear());
  const [reportMode, setReportMode] = useState<"selected_month" | "all">("selected_month");
  const [customReportNote, setCustomReportNote] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Helper function to resolve status text
  const getStatusLabelText = (statusVal: string) => {
    if (statusVal === "pending") return "Menunggu Proposal (Pending)";
    if (statusVal === "processing") return "Sedang Diproses (Processing)";
    if (statusVal === "quoted") return "Sudah Di-Quoted (Quoted)";
    if (statusVal === "completed") return "Selesai (Completed)";
    if (statusVal === "cancelled") return "Dibatalkan (Cancelled)";
    const custom = settings?.customRfqStatuses?.find(c => c.value === statusVal);
    return custom ? custom.label : statusVal.toUpperCase();
  };

  const getStatusHexColor = (statusVal: string) => {
    if (statusVal === "pending") return "#f59e0b";
    if (statusVal === "processing") return "#3b82f6";
    if (statusVal === "quoted") return "#6366f1";
    if (statusVal === "completed") return "#10b981";
    if (statusVal === "cancelled") return "#ef4444";
    const custom = settings?.customRfqStatuses?.find(c => c.value === statusVal);
    if (custom && custom.color) {
      const colMap: Record<string, string> = {
        purple: "#a855f7",
        emerald: "#10b981",
        amber: "#f59e0b",
        rose: "#f43f5e",
        blue: "#3b82f6",
        indigo: "#6366f1",
        cyan: "#06b6d4"
      };
      return colMap[custom.color] || custom.color;
    }
    return "#a855f7";
  };

  // Filter RFQs for the target report period
  const getTargetReportRfqs = () => {
    if (reportMode === "all") return rfqs;
    return rfqs.filter((r) => {
      if (!r.date) return false;
      let d: Date | null = null;
      if (r.date.includes("-")) {
        const parts = r.date.split("-");
        if (parts[0].length === 4) {
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (parts[2]?.length === 4) {
          d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        d = new Date(r.date);
      }
      if (!d || isNaN(d.getTime())) return false;
      return d.getMonth() === selectedReportMonth && d.getFullYear() === selectedReportYear;
    });
  };

  // Calculate Most Frequent Status
  const getMostFrequentStatusInfo = (targetRfqs: RFQ[]) => {
    if (targetRfqs.length === 0) {
      return {
        statusKey: "-",
        label: "Belum Ada Data",
        count: 0,
        percentage: 0,
        value: 0
      };
    }

    const counts: Record<string, { count: number; value: number }> = {};
    targetRfqs.forEach((r) => {
      const st = r.status || "pending";
      const val = getRfqValue(r, activeCatalog);
      if (!counts[st]) counts[st] = { count: 0, value: 0 };
      counts[st].count += 1;
      counts[st].value += val;
    });

    let topStatus = "pending";
    let maxCount = -1;

    Object.entries(counts).forEach(([st, info]) => {
      if (info.count > maxCount) {
        maxCount = info.count;
        topStatus = st;
      }
    });

    const pct = targetRfqs.length > 0 ? Math.round((maxCount / targetRfqs.length) * 100) : 0;

    return {
      statusKey: topStatus,
      label: getStatusLabelText(topStatus),
      count: maxCount,
      percentage: pct,
      value: counts[topStatus]?.value || 0
    };
  };

  // Calculate Performance Trend vs previous month
  const getMonthPerformanceTrend = (m: number, y: number) => {
    const currRfqs = rfqs.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() === m && d.getFullYear() === y;
    });
    const currValue = currRfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0);

    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const prevRfqs = rfqs.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() === prevM && d.getFullYear() === prevY;
    });
    const prevValue = prevRfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0);

    if (prevValue === 0) {
      return {
        percentageChange: 100,
        text: "+100% (Awal Periode)",
        isPositive: true,
        currValue,
        prevValue
      };
    }

    const diff = currValue - prevValue;
    const pct = Math.round((diff / prevValue) * 100);
    const isPositive = pct >= 0;

    return {
      percentageChange: pct,
      text: `${isPositive ? "+" : ""}${pct}% vs Bulan Lalu`,
      isPositive,
      currValue,
      prevValue
    };
  };

  // Core PDF Generator Function
  const handleDownloadMonthlyPdfReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const targetRfqs = getTargetReportRfqs();
      const totalVal = targetRfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0);
      const topStatus = getMostFrequentStatusInfo(targetRfqs);
      const trendInfo = getMonthPerformanceTrend(selectedReportMonth, selectedReportYear);

      // Prepare Monthly Trend Data for D3 Chart
      const monthlyList = getLast6MonthsList();
      const monthlyDataForD3 = monthlyList.map(m => {
        const matchRfqs = rfqs.filter(r => {
          if (!r.date) return false;
          const d = new Date(r.date);
          if (isNaN(d.getTime())) return false;
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return ym === m.key;
        });
        const tot = matchRfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0);
        return {
          label: m.label,
          total: tot,
          count: matchRfqs.length
        };
      });

      // Prepare Status Distribution for D3 Chart
      const statusKeys = ["pending", "processing", "quoted", "completed", "cancelled"];
      if (settings?.customRfqStatuses) {
        settings.customRfqStatuses.forEach(c => {
          if (!statusKeys.includes(c.value)) statusKeys.push(c.value);
        });
      }

      const statusDistForD3 = statusKeys.map(stKey => {
        const cnt = targetRfqs.filter(r => r.status === stKey).length;
        return {
          label: getStatusLabelText(stKey),
          count: cnt,
          color: getStatusHexColor(stKey)
        };
      });

      // Generate D3 Canvas Base64 Image
      const chartImgBase64 = await generateD3PdfChartImage(monthlyDataForD3, statusDistForD3);

      // Initialize jsPDF A4
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // 1. Company Header Strip
      const companyTitle = (settings?.companyName || "PT. BERKAH BINTANG SOLUSINDO").toUpperCase();
      const companyAddress = settings?.address || "Jl. Raya Jakarta Timur, Indonesia";
      const companyContact = `Telp/WA: ${settings?.whatsapp || "+62 812-3456-7890"} | Email: ${settings?.email || "info@berkahbintangsolusindo.com"}`;

      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 32, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(companyTitle, 14, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(companyAddress, 14, 20);
      doc.text(companyContact, 14, 25);

      // Title & Period Subtitle
      let yPos = 40;
      const periodLabel = reportMode === "all"
        ? "Semua Periode Akumulasi Data"
        : `Periode: ${MONTH_NAMES_INDONESIAN[selectedReportMonth]} ${selectedReportYear}`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("LAPORAN BULANAN PERFORMA RFQ & REKAPITULASI PROSPEK", 14, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${periodLabel} | Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 14, yPos + 5);

      yPos += 12;

      // 2. Executive KPI Cards Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, yPos, 182, 34, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text("TOTAL NILAI RFQ (ESTIMASI)", 18, yPos + 8);
      doc.text("STATUS TERBANYAK", 64, yPos + 8);
      doc.text("TOTAL VOLUME RFQ", 114, yPos + 8);
      doc.text("TREN PERFORMA", 154, yPos + 8);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(formatShortRupiah(totalVal), 18, yPos + 17);

      const topStatusText = topStatus.count > 0 ? topStatus.label : "N/A";
      doc.setFontSize(8.5);
      doc.text(doc.splitTextToSize(topStatusText, 45), 64, yPos + 16);

      doc.setFontSize(11);
      doc.text(`${targetRfqs.length} Berkas RFQ`, 114, yPos + 17);

      doc.setFontSize(9.5);
      if (trendInfo.isPositive) {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(225, 29, 72);
      }
      doc.text(trendInfo.text, 154, yPos + 17);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Full: ${formatFullRupiah(totalVal)}`, 18, yPos + 26);
      doc.text(`Volume: ${topStatus.count} RFQ (${topStatus.percentage}%)`, 64, yPos + 26);
      doc.text(`Avg: ${targetRfqs.length > 0 ? formatShortRupiah(totalVal / targetRfqs.length) : "Rp 0"}/RFQ`, 114, yPos + 26);
      doc.text(`Pertumbuhan Prospek`, 154, yPos + 26);

      yPos += 40;

      // 3. D3 Chart Embed
      if (chartImgBase64) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text("VISUALISASI PERFORMA & TREN RFQ (D3 ENGINE)", 14, yPos);

        doc.addImage(chartImgBase64, "PNG", 14, yPos + 3, 182, 75);
        yPos += 84;
      }

      // 4. AutoTable: Status Distribution Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("RINCIAN DISTRIBUSI STATUS PERMINTAAN PENAWARAN (RFQ)", 14, yPos);
      yPos += 4;

      const statusTableRows = statusDistForD3.map((s, idx) => {
        const stRfqs = targetRfqs.filter(r => r.status === statusKeys[idx]);
        const stValue = stRfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0);
        const pct = targetRfqs.length > 0 ? Math.round((s.count / targetRfqs.length) * 100) : 0;
        return [
          (idx + 1).toString(),
          s.label,
          `${s.count} Berkas`,
          `${pct}%`,
          formatFullRupiah(stValue),
          pct > 30 ? "Mendominasi" : "Normal"
        ];
      });

      (doc as any).autoTable({
        startY: yPos,
        head: [["No", "Status RFQ", "Jumlah Berkas", "Persentase", "Total Nilai Estimasi", "Keterangan Operational"]],
        body: statusTableRows,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [15, 23, 42]
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // 5. AutoTable: Sample / List of RFQs
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("DAFTAR BERKAS RFQ PERIODE INI", 14, yPos);
      yPos += 4;

      const rfqTableRows = targetRfqs.slice(0, 15).map((rfq, idx) => {
        const val = getRfqValue(rfq, activeCatalog);
        const itemsCount = rfq.items ? rfq.items.length : 0;
        const clientName = rfq.companyName ? `${rfq.clientName} (${rfq.companyName})` : rfq.clientName;
        return [
          (idx + 1).toString(),
          rfq.rfqNumber || rfq.id.substring(0, 8).toUpperCase(),
          rfq.date || "-",
          clientName,
          `${itemsCount} Item`,
          formatFullRupiah(val),
          getStatusLabelText(rfq.status)
        ];
      });

      (doc as any).autoTable({
        startY: yPos,
        head: [["No", "No RFQ", "Tanggal", "Nama Klien / Instansi", "Item", "Est. Nilai", "Status"]],
        body: rfqTableRows,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [15, 23, 42]
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      if (yPos > 245) {
        doc.addPage();
        yPos = 20;
      }

      // Custom Note Section
      if (customReportNote) {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, yPos, 182, 20, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text("CATATAN KHUSUS MANAJEMEN / STRATEGIS:", 18, yPos + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(doc.splitTextToSize(customReportNote, 174), 18, yPos + 12);

        yPos += 26;
      }

      // Approval / Signatures Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Dibuat Oleh,", 30, yPos + 5);
      doc.text("Disetujui Oleh,", 140, yPos + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Admin Sales & Procurement", 30, yPos + 22);
      doc.text("Direktur Utama / Management", 140, yPos + 22);

      // Save File
      const filename = `Laporan_Bulanan_RFQ_BBS_${MONTH_NAMES_INDONESIAN[selectedReportMonth]}_${selectedReportYear}.pdf`;
      doc.save(filename);

      setShowMonthlyReportModal(false);
    } catch (err) {
      console.error("Gagal generate Laporan Bulanan PDF:", err);
      alert("Terjadi kesalahan saat membuat PDF laporan bulanan.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    label: string;
    value: number;
    count: number;
    percentage: number;
  }>({
    show: false,
    x: 0,
    y: 0,
    label: "",
    value: 0,
    count: 0,
    percentage: 0
  });

  // Keep track of parent container resizing to make chart truly responsive
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Leave margins for container padding
        const newWidth = Math.max(320, entry.contentRect.width - 16);
        setWidth(newWidth);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Process data based on selected dimension
  const getGroupedData = (): GroupedData[] => {
    const totalAllRfqsValue = rfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0) || 1;
    
    if (dimension === "client") {
      const map: Record<string, { val: number; cnt: number }> = {
        perusahaan: { val: 0, cnt: 0 },
        pemerintah: { val: 0, cnt: 0 },
        pendidikan: { val: 0, cnt: 0 },
        umkm: { val: 0, cnt: 0 },
        retail: { val: 0, cnt: 0 }
      };

      rfqs.forEach((rfq) => {
        const cat = rfq.clientCategory || "perusahaan";
        const val = getRfqValue(rfq, activeCatalog);
        if (!map[cat]) map[cat] = { val: 0, cnt: 0 };
        map[cat].val += val;
        map[cat].cnt += 1;
      });

      const labels: Record<string, string> = {
        perusahaan: "Korporat & Perusahaan",
        pemerintah: "Umum",
        pendidikan: "Lembaga Pendidikan",
        umkm: "UMKM & Individu",
        retail: "Retail & Toko"
      };

      return Object.entries(map).map(([key, item]) => ({
        key: labels[key] || key,
        value: item.val,
        count: item.cnt,
        percentage: Math.round((item.val / totalAllRfqsValue) * 100)
      })).sort((a, b) => b.value - a.value);
    } 
    
    if (dimension === "product") {
      const map: Record<string, { val: number; cnt: number }> = {};

      rfqs.forEach((rfq) => {
        rfq.items.forEach((item) => {
          const itemNameLower = item.name.toLowerCase();
          const matched = activeCatalog.find((p) => {
            const pNameLower = p.name.toLowerCase();
            return pNameLower.includes(itemNameLower) || itemNameLower.includes(pNameLower);
          });

          const cat = matched ? matched.category : "Layanan & Software";
          let price = matched ? getNumericPrice(matched.estimatedPriceRange) : 5000000;
          if (price === 0) price = 5000000;
          const itemVal = price * item.quantity;

          if (!map[cat]) map[cat] = { val: 0, cnt: 0 };
          map[cat].val += itemVal;
          map[cat].cnt += item.quantity;
        });
      });

      return Object.entries(map).map(([key, item]) => ({
        key,
        value: item.val,
        count: item.cnt,
        percentage: Math.round((item.val / totalAllRfqsValue) * 100)
      })).sort((a, b) => b.value - a.value);
    }

    // Default: Dimension Vendor/Brand
    const map: Record<string, { val: number; cnt: number }> = {};
    const brands = [
      "lenovo", "asus", "dell", "synology", "mikrotik", 
      "unifi", "hikvision", "microsoft", "cisco", "hp", 
      "acer", "ruijie", "tp-link", "fortinet", "apc", "epson"
    ];

    rfqs.forEach((rfq) => {
      rfq.items.forEach((item) => {
        const itemNameLower = item.name.toLowerCase();
        let matchedBrand = "Universal / Lainnya";
        
        for (const brand of brands) {
          if (itemNameLower.includes(brand)) {
            matchedBrand = brand.toUpperCase();
            break;
          }
        }

        const matched = activeCatalog.find((p) => {
          const pNameLower = p.name.toLowerCase();
          return pNameLower.includes(itemNameLower) || itemNameLower.includes(pNameLower);
        });

        let price = matched ? getNumericPrice(matched.estimatedPriceRange) : 5000000;
        if (price === 0) price = 5000000;
        const itemVal = price * item.quantity;

        if (!map[matchedBrand]) map[matchedBrand] = { val: 0, cnt: 0 };
        map[matchedBrand].val += itemVal;
        map[matchedBrand].cnt += item.quantity;
      });
    });

    return Object.entries(map).map(([key, item]) => ({
      key,
      value: item.val,
      count: item.cnt,
      percentage: Math.round((item.val / totalAllRfqsValue) * 100)
    })).sort((a, b) => b.value - a.value);
  };

  const data = getGroupedData();

  // Process monthly sales trend data for Recharts
  const getMonthlySalesData = () => {
    const monthlyList = getLast6MonthsList();
    const processedQuotations = quotations || [];

    processedQuotations.forEach((q) => {
      if (!q.date) return;
      let yearMonth = ""; // YYYY-MM
      if (q.date.includes("-")) {
        const parts = q.date.split("-");
        if (parts[0].length === 4) {
          yearMonth = `${parts[0]}-${parts[1].padStart(2, "0")}`;
        } else if (parts[2]?.length === 4) {
          yearMonth = `${parts[2]}-${parts[1].padStart(2, "0")}`;
        }
      } else if (q.date.includes("/")) {
        const parts = q.date.split("/");
        if (parts[2]?.length === 4) {
          yearMonth = `${parts[2]}-${parts[1].padStart(2, "0")}`;
        }
      }
      
      if (!yearMonth) {
        try {
          const d = new Date(q.date);
          if (!isNaN(d.getTime())) {
            yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          }
        } catch (e) {
          console.error(e);
        }
      }

      const matched = monthlyList.find(m => m.key === yearMonth);
      if (matched) {
        matched.total += q.total || 0;
        matched.count += 1;
      }
    });

    return monthlyList;
  };

  const monthlySalesData = getMonthlySalesData();
  const totalSalesOverall = monthlySalesData.reduce((acc, d) => acc + d.total, 0);
  const averageSales = totalSalesOverall / 6;

  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-indigo-500/30 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 text-left font-sans">
          <p className="font-extrabold text-white">{label}</p>
          <div className="h-px bg-white/10 my-1"></div>
          <div className="flex justify-between items-center gap-6 text-slate-400">
            <span>Total Quoted:</span>
            <span className="font-mono font-bold text-emerald-400">{formatFullRupiah(dataPoint.total)}</span>
          </div>
          <div className="flex justify-between items-center gap-6 text-slate-400">
            <span>Volume Proposal:</span>
            <span className="font-mono font-bold text-indigo-400">{dataPoint.count} Proposal</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Generate 30 days request frequency for inventory forecasting
  const get30DayRequestData = () => {
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
        "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
      ];
      const label = `${dd} ${monthNames[d.getMonth()]}`;
      
      last30Days.push({ key, label, units: 0, rfqsCount: 0 });
    }

    rfqs.forEach((rfq) => {
      if (!rfq.date) return;
      let rfqDate = "";
      const match = rfq.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        rfqDate = `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        try {
          const d = new Date(rfq.date);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            rfqDate = `${yyyy}-${mm}-${dd}`;
          }
        } catch (e) {
          console.error(e);
        }
      }

      const matched = last30Days.find(d => d.key === rfqDate);
      if (matched) {
        matched.rfqsCount += 1;
        if (rfq.items && rfq.items.length > 0) {
          const rfqUnits = rfq.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
          matched.units += rfqUnits;
        }
      }
    });

    return last30Days;
  };

  const last30DaysData = get30DayRequestData();
  const totalUnits30Days = last30DaysData.reduce((acc, d) => acc + d.units, 0);
  const avgUnits30Days = Number((totalUnits30Days / 30).toFixed(1));
  const peakUnits30Days = last30DaysData.reduce((max, d) => d.units > max ? d.units : max, 0);

  const Custom30DayTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-indigo-500/30 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 text-left font-sans">
          <p className="font-extrabold text-white">{dataPoint.label} (2026)</p>
          <div className="h-px bg-white/10 my-1"></div>
          <div className="flex justify-between items-center gap-6 text-slate-400">
            <span>Volume Permintaan:</span>
            <span className="font-mono font-bold text-indigo-400">{dataPoint.units} Unit</span>
          </div>
          <div className="flex justify-between items-center gap-6 text-slate-400">
            <span>Jumlah Berkas RFQ:</span>
            <span className="font-mono font-bold text-amber-400">{dataPoint.rfqsCount} RFQ</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // D3 Code for rendering the horizontal bar chart
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Set dimensions
    const margin = { top: 15, right: 90, bottom: 25, left: 145 };
    const chartHeight = Math.max(220, data.length * 48); // Adaptive height based on records count
    const chartWidth = width - margin.left - margin.right;

    // Clear previous drawing
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", width)
      .attr("height", chartHeight + margin.top + margin.bottom);

    // Create Main Chart Group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale (Values)
    const maxX = d3.max(data, (d) => d.value) || 1000000;
    const xScale = d3.scaleLinear()
      .domain([0, maxX * 1.05]) // 5% padding on right
      .range([0, chartWidth]);

    // Y scale (Categories/Brands)
    const yScale = d3.scaleBand()
      .domain(data.map((d) => d.key))
      .range([0, chartHeight])
      .padding(0.3);

    // Gridlines (Vertical)
    g.append("g")
      .attr("class", "grid-lines text-slate-800")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(5)
          .tickSize(-chartHeight)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "rgba(255, 255, 255, 0.05)")
      .attr("stroke-dasharray", "3,3");

    // Add Gradients for Bars
    const defs = svg.append("defs");
    
    const gradient = defs
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1") // Indigo
      .attr("stop-opacity", 0.85);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#c084fc") // Purple
      .attr("stop-opacity", 0.95);

    // Hover Gradient
    const hoverGradient = defs
      .append("linearGradient")
      .attr("id", "bar-gradient-hover")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    hoverGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#818cf8"); // Lighter Indigo

    hoverGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#d8b4fe"); // Lighter Purple

    // Draw Y Axis (Labels)
    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).tickSize(0));

    yAxis.selectAll("text")
      .attr("fill", "#cbd5e1") // text-slate-300
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("dx", "-8px");

    yAxis.select(".domain").remove(); // Remove line axis

    // Draw Bars
    const bars = g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar transition-all duration-300 cursor-pointer")
      .attr("y", (d) => yScale(d.key) || 0)
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0) // start at 0 for animation
      .attr("rx", 6) // rounded corners
      .attr("fill", "url(#bar-gradient)")
      .attr("filter", "drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.15))");

    // Bar Animation
    bars.transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr("width", (d) => xScale(d.value));

    // Value Labels on the Right of Bars
    const labels = g.selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value-label font-mono font-bold text-xs")
      .attr("y", (d) => (yScale(d.key) || 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("x", 0) // start at 0 for animation alignment
      .attr("fill", "#f8fafc") // text-slate-50
      .attr("font-size", "11px")
      .text((d) => formatShortRupiah(d.value));

    labels.transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr("x", (d) => xScale(d.value) + 10);

    // Interactive Hover Listeners
    bars
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("fill", "url(#bar-gradient-hover)")
          .attr("filter", "drop-shadow(0px 4px 8px rgba(168, 85, 247, 0.35))");
        
        // Compute tooltip coordinates
        const [mx, my] = d3.pointer(event, svgRef.current);
        
        setTooltip({
          show: true,
          x: mx + 20,
          y: my - 30,
          label: d.key,
          value: d.value,
          count: d.count,
          percentage: d.percentage
        });
      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setTooltip((prev) => ({
          ...prev,
          x: mx + 20,
          y: my - 30
        }));
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("fill", "url(#bar-gradient)")
          .attr("filter", "drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.15))");
        
        setTooltip((prev) => ({ ...prev, show: false }));
      });

  }, [data, width, dimension]);

  // Generate automated AI insights for Tim Sales
  const getInsights = () => {
    if (rfqs.length === 0) return "Belum ada data RFQ masuk untuk dianalisis.";
    
    // Sort grouped data
    const topItem = data[0];
    if (!topItem || topItem.value === 0) return "Inquiry masuk belum memiliki estimasi nilai material.";

    if (dimension === "client") {
      return `Klien kategori **${topItem.key}** mendominasi volume penawaran dengan kontribusi sebesar **${topItem.percentage}%** (${formatShortRupiah(topItem.value)}). Tim Sales direkomendasikan untuk memperkuat kolaborasi dan menyusun proposal bernuansa korporat/birokrasi sesuai standarisasi mereka.`;
    }
    if (dimension === "product") {
      return `Kebutuhan perangkat **${topItem.key}** mencatatkan estimasi omset tertinggi senilai **${formatShortRupiah(topItem.value)}** (${topItem.percentage}% pangsa pasar). Pastikan rantai pasok dan distributor utama (Lenovo, Dell, ASUS) untuk kategori ini diamankan dengan kesepakatan harga grosir terbaik.`;
    }
    return `Brand **${topItem.key}** menjadi pilihan terfavorit dengan total permintaan senilai **${formatShortRupiah(topItem.value)}** (${topItem.percentage}%). Tim Procurement disarankan melakukan registrasi deals langsung ke principal/distributor resmi brand tersebut guna mengamankan diskon proyek di atas 30%.`;
  };

  return (
    <div className="space-y-6">
      {/* CARD 1: D3 Analytics Card */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative space-y-6">
        
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Analitik Distribusi Nilai RFQ (D3 Engine)</h3>
              <p className="text-xs text-slate-400">
                Visualisasi perbandingan total nilai penawaran proyek secara real-time berdasarkan berbagai dimensi penawaran.
              </p>
            </div>
          </div>

          {/* Dynamic Controls & Generate Report Action */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {/* Generate Monthly Report Action Button */}
            <button
              onClick={() => setShowMonthlyReportModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/30 border border-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              id="btn_generate_laporan_bulanan_card1"
              title="Generate laporan bulanan RFQ & performa bisnis (PDF & D3 Chart)"
            >
              <FileText className="h-4 w-4 text-emerald-200 animate-pulse" />
              <span>Generate Laporan Bulanan</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-white/20 text-white rounded-full font-mono font-bold">PDF</span>
            </button>

            <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setDimension("client")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  dimension === "client"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>Kategori Klien</span>
              </button>
              <button
                onClick={() => setDimension("product")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  dimension === "product"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Kategori Produk</span>
              </button>
              <button
                onClick={() => setDimension("vendor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  dimension === "vendor"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Brand / Vendor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Chart + Details Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* D3 Chart container */}
          <div ref={containerRef} className="lg:col-span-7 bg-slate-950/40 border border-white/5 rounded-2xl p-4 relative overflow-x-auto select-none min-h-[250px]">
            {rfqs.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 py-12">
                <HelpCircle className="h-10 w-10 text-slate-700 animate-pulse mb-2" />
                <p className="text-sm">Tidak ada data RFQ untuk divisualisasikan</p>
              </div>
            ) : (
              <svg ref={svgRef} className="mx-auto block" />
            )}

            {/* Floating Tooltip styled with Tailwind */}
            {tooltip.show && (
              <div 
                style={{ top: tooltip.y, left: tooltip.x }}
                className="absolute pointer-events-none bg-slate-900/95 border border-indigo-500/30 rounded-xl p-3 shadow-xl backdrop-blur-md z-50 text-xs text-left max-w-[240px] space-y-1.5 animate-fadeIn duration-100"
              >
                <p className="font-extrabold text-white">{tooltip.label}</p>
                <div className="h-px bg-white/10 my-1"></div>
                <div className="flex justify-between items-center gap-4 text-slate-400 font-mono">
                  <span>Nilai Est:</span>
                  <span className="font-bold text-emerald-400">{formatFullRupiah(tooltip.value)}</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-slate-400 font-mono">
                  <span>Volume:</span>
                  <span className="font-bold text-slate-200">{tooltip.count} {dimension === "client" ? "RFQ" : "Unit"}</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-slate-400 font-mono">
                  <span>Persentase:</span>
                  <span className="font-bold text-indigo-400">{tooltip.percentage}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Summary Table & Legend */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                <span>Peringkat Kontribusi ({dimension === "client" ? "Sektor" : dimension === "product" ? "Kategori" : "Vendor"})</span>
              </h4>
              
              <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-1">
                {data.map((item, index) => (
                  <div key={item.key} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center font-mono font-bold text-[10px] text-slate-400">
                        {index + 1}
                      </span>
                      <span className="text-slate-200 font-semibold truncate" title={item.key}>{item.key}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold font-mono">{formatShortRupiah(item.value)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {item.count} {dimension === "client" ? "RFQ" : "Unit"} &middot; <span className="text-indigo-400 font-bold">{item.percentage}%</span>
                      </p>
                    </div>
                  </div>
                ))}
                {data.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">Data kosong</p>
                )}
              </div>
            </div>

            {/* Strategic Insight Block */}
            <div className="bg-gradient-to-r from-indigo-950/30 to-purple-950/20 border border-indigo-500/20 rounded-2xl p-4 flex gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 h-fit shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-indigo-300">Rekomendasi Strategis Sales & Bid</h5>
                <p 
                  className="text-[11px] text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: getInsights()
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-200 font-bold">$1</strong>')
                  }}
                />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* CARD 2: Recharts Monthly Sales Performance Card */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Monthly Sales Performance (Recharts Engine)</h3>
              <p className="text-xs text-slate-400">
                Visualisasi dan akumulasi total nilai penawaran (Quoted Value) resmi yang diajukan ke klien selama 6 bulan terakhir.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge & Report Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowMonthlyReportModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/30 border border-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              id="btn_generate_laporan_bulanan_card2"
            >
              <FileText className="h-4 w-4 text-emerald-200" />
              <span>Generate Laporan Bulanan</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-white/20 text-white rounded-full font-mono font-bold">PDF</span>
            </button>
            <div className="px-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-400">
              Total Quoted: <span className="font-mono font-bold text-emerald-400">{formatShortRupiah(totalSalesOverall)}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-400">
              Avg/Bulan: <span className="font-mono font-bold text-indigo-400">{formatShortRupiah(averageSales)}</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 bg-slate-950/30 border border-white/5 rounded-2xl p-4 min-h-[300px]">
            {monthlySalesData.length === 0 ? (
              <div className="h-[268px] flex flex-col items-center justify-center text-slate-500">
                <HelpCircle className="h-10 w-10 text-slate-700 animate-pulse mb-2" />
                <p className="text-sm">Tidak ada data penawaran harga (Quotation) untuk divisualisasikan</p>
              </div>
            ) : (
              <div className="w-full h-[268px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlySalesData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="salesStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1"/>
                        <stop offset="100%" stopColor="#a855f7"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatShortRupiah(val)}
                      dx={-10}
                    />
                    <RechartsTooltip content={<CustomRechartsTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="url(#salesStroke)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#salesColor)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                <span>Rincian Omset Proposal Bulanan</span>
              </h4>

              <div className="space-y-3">
                {monthlySalesData.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-300 font-semibold">{item.label}</span>
                    <div className="text-right">
                      <span className="text-white font-mono font-bold block">{formatFullRupiah(item.total)}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{item.count} Proposal Terbit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CARD 3: 30-Day Product Request Frequency for Inventory Forecasting */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">30-Day Product Request Frequency</h3>
              <p className="text-xs text-slate-400">
                Frekuensi permintaan kuantitas unit produk harian dari RFQ masuk dalam 30 hari terakhir untuk memproyeksikan kebutuhan stok/inventaris.
              </p>
            </div>
          </div>

          {/* Forecast Metrics Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-400">
              Total Permintaan: <span className="font-mono font-bold text-indigo-400">{totalUnits30Days} Unit</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-400">
              Rerata Harian: <span className="font-mono font-bold text-amber-400">{avgUnits30Days} Unit/hari</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-400">
              Volume Puncak: <span className="font-mono font-bold text-rose-400">{peakUnits30Days} Unit</span>
            </div>
          </div>
        </div>

        {/* Chart + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 bg-slate-950/30 border border-white/5 rounded-2xl p-4 min-h-[300px]">
            {totalUnits30Days === 0 ? (
              <div className="h-[268px] flex flex-col items-center justify-center text-slate-500">
                <HelpCircle className="h-10 w-10 text-slate-700 animate-pulse mb-2" />
                <p className="text-sm">Tidak ada data kuantitas produk diminta dalam 30 hari terakhir</p>
              </div>
            ) : (
              <div className="w-full h-[268px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={last30DaysData}
                    margin={{ top: 15, right: 15, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val} Un`}
                      dx={-10}
                    />
                    <RechartsTooltip content={<Custom30DayTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="units" 
                      stroke="#818cf8" 
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                      dot={{ r: 3, fill: '#4f46e5', strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Forecasting Insights Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span>Forecasting & Inventory Insights</span>
              </h4>
              
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  Berdasarkan tren penawaran 30 hari terakhir, total volume permintaan yang masuk mencapai <strong className="text-white font-bold">{totalUnits30Days} unit</strong> perangkat/layanan dengan kecepatan rata-rata harian sebesar <strong className="text-amber-400 font-bold">{avgUnits30Days} unit per hari</strong>.
                </p>
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Rekomendasi Manajemen Stok:</span>
                  <p className="text-[11px] text-slate-300">
                    Sangat direkomendasikan untuk mempertahankan persediaan aman minimal <strong className="font-bold text-white">{(avgUnits30Days * 15).toFixed(0)} unit</strong> (estimasi lead time 15 hari) untuk kategori produk dengan frekuensi penawaran tertinggi guna menghindari keterlambatan serah terima proyek.
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  * Data ini diperbarui secara otomatis ketika klien mengirimkan RFQ baru.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Generate Laporan Bulanan (PDF) */}
      {showMonthlyReportModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>Generate Laporan Bulanan (PDF)</span>
                    <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-mono font-bold">
                      D3 Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ekspor rekapitulasi performa bulanan, total nilai RFQ, status terbanyak, dan grafik tren ke dokumen PDF resmi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMonthlyReportModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Controls Row: Select Month & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-white/5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bulan Laporan
                </label>
                <select
                  value={selectedReportMonth}
                  onChange={(e) => setSelectedReportMonth(Number(e.target.value))}
                  disabled={reportMode === "all"}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {MONTH_NAMES_INDONESIAN.map((mName, idx) => (
                    <option key={mName} value={idx}>{mName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tahun Laporan
                </label>
                <select
                  value={selectedReportYear}
                  onChange={(e) => setSelectedReportYear(Number(e.target.value))}
                  disabled={reportMode === "all"}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cakupan Periode
                </label>
                <select
                  value={reportMode}
                  onChange={(e) => setReportMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="selected_month">Bulan Terpilih</option>
                  <option value="all">Akumulasi Semua Data</option>
                </select>
              </div>
            </div>

            {/* Live Executive Summary Preview Cards */}
            {(() => {
              const targetRfqs = getTargetReportRfqs();
              const totalVal = targetRfqs.reduce((acc, r) => acc + getRfqValue(r, activeCatalog), 0);
              const topStatus = getMostFrequentStatusInfo(targetRfqs);
              const trendInfo = getMonthPerformanceTrend(selectedReportMonth, selectedReportYear);

              return (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Ringkasan Eksekutif Periode Ini</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Total Nilai RFQ */}
                    <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">Total Nilai RFQ</span>
                      <p className="text-sm font-extrabold text-emerald-400 font-mono">
                        {formatShortRupiah(totalVal)}
                      </p>
                      <span className="text-[9px] text-slate-500 block truncate" title={formatFullRupiah(totalVal)}>
                        {formatFullRupiah(totalVal)}
                      </span>
                    </div>

                    {/* Card 2: Status Terbanyak */}
                    <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">Status Terbanyak</span>
                      <p className="text-xs font-extrabold text-amber-300 truncate" title={topStatus.label}>
                        {topStatus.label}
                      </p>
                      <span className="text-[9px] text-slate-500 block">
                        {topStatus.count} RFQ ({topStatus.percentage}%)
                      </span>
                    </div>

                    {/* Card 3: Volume Berkas RFQ */}
                    <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">Volume RFQ</span>
                      <p className="text-sm font-extrabold text-indigo-300 font-mono">
                        {targetRfqs.length} Berkas
                      </p>
                      <span className="text-[9px] text-slate-500 block">
                        {reportMode === "all" ? "Semua RFQ" : `${MONTH_NAMES_INDONESIAN[selectedReportMonth]} ${selectedReportYear}`}
                      </span>
                    </div>

                    {/* Card 4: Tren Performa */}
                    <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">Tren Performa</span>
                      <p className={`text-xs font-extrabold ${trendInfo.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {trendInfo.text}
                      </p>
                      <span className="text-[9px] text-slate-500 block">
                        Dibanding bulan sebelumnya
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Custom Notes Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Catatan Strategis Manajemen / Rekomendasi (Opsional)
              </label>
              <textarea
                value={customReportNote}
                onChange={(e) => setCustomReportNote(e.target.value)}
                placeholder="Tambahkan catatan khusus manajemen yang akan dicetak di bagian bawah laporan PDF..."
                rows={2}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* D3 Chart Embed Indicator Notice */}
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center gap-3 text-xs text-indigo-200">
              <BarChart3 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>
                Dokumen PDF yang dihasilkan mencakup <strong className="text-white font-bold">Grafik Visual D3.js Engine</strong> yang memetakan tren proyeksi 6 bulan serta rekapitulasi distribusi status terkini.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowMonthlyReportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadMonthlyPdfReport}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/30 border border-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer"
                id="btn_download_monthly_pdf_modal"
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Memproses D3 Chart & PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 text-emerald-100" />
                    <span>Download Laporan PDF Bulanan</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
