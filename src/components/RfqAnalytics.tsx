import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { RFQ, ProductItem, Quotation } from "../types";
import { PRODUCT_CATALOG } from "../data";
import { BarChart3, TrendingUp, Info, Shield, Layers, HelpCircle, Briefcase, Building, GraduationCap, Store, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from "recharts";

interface RfqAnalyticsProps {
  rfqs: RFQ[];
  catalogProducts?: ProductItem[];
  quotations?: Quotation[];
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

export default function RfqAnalytics({ rfqs, catalogProducts, quotations }: RfqAnalyticsProps) {
  const activeCatalog = catalogProducts || PRODUCT_CATALOG;
  const [dimension, setDimension] = useState<"client" | "product" | "vendor">("client");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(600);
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

          {/* Dynamic Controls */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5 self-start md:self-center">
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

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3">
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
    </div>
  );
}
