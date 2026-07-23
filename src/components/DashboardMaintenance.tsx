import React, { useState } from "react";
import * as Icons from "lucide-react";
import { MaintenanceAsset, ServiceHistoryItem } from "../types";

interface DashboardMaintenanceProps {
  assets: MaintenanceAsset[];
  onLogService?: (asset: MaintenanceAsset) => void;
  onSendReminder?: (asset: MaintenanceAsset) => void;
  onSelectAsset?: (asset: MaintenanceAsset) => void;
  onEditAsset?: (asset: MaintenanceAsset) => void;
  showToast?: (msg: string, type: "success" | "error" | "info") => void;
  formatRupiah?: (val: number) => string;
}

export default function DashboardMaintenance({
  assets,
  onLogService,
  onSendReminder,
  onSelectAsset,
  onEditAsset,
  showToast,
  formatRupiah,
}: DashboardMaintenanceProps) {
  const [filterMode, setFilterMode] = useState<"urgent_30" | "overdue_only" | "due_soon_only" | "all">("urgent_30");
  const [searchQuery, setSearchQuery] = useState("");

  // Date helper
  const calculateDaysRemaining = (dueDateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Categorize assets
  const processedAssets = assets.map((asset) => {
    const days = calculateDaysRemaining(asset.nextServiceDueDate);
    let severity: "critical" | "warning" | "normal" | "expired" = "normal";

    const contractDays = calculateDaysRemaining(asset.contractEndDate);
    if (contractDays < 0) {
      severity = "expired";
    } else if (days < 0 || days <= 7) {
      severity = "critical"; // Merah (Mendesak) - Overdue or due within 7 days
    } else if (days <= 30) {
      severity = "warning"; // Kuning (Segera) - Due within 8-30 days
    } else {
      severity = "normal"; // Hijau (Aman)
    }

    return {
      ...asset,
      daysRemaining: days,
      severity,
    };
  });

  // Filter lists
  const urgentAssetsCount = processedAssets.filter(a => a.severity === "critical" || a.severity === "warning").length;
  const criticalCount = processedAssets.filter(a => a.severity === "critical").length;
  const warningCount = processedAssets.filter(a => a.severity === "warning").length;

  const filteredAssets = processedAssets.filter((item) => {
    // Mode filter
    if (filterMode === "urgent_30" && item.severity !== "critical" && item.severity !== "warning") return false;
    if (filterMode === "overdue_only" && item.severity !== "critical") return false;
    if (filterMode === "due_soon_only" && item.severity !== "warning") return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      item.clientName.toLowerCase().includes(q) ||
      (item.clientCompany && item.clientCompany.toLowerCase().includes(q)) ||
      item.assetName.toLowerCase().includes(q) ||
      item.contractNumber.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
      (item.technicianInCharge && item.technicianInCharge.toLowerCase().includes(q)) ||
      (item.locationRack && item.locationRack.toLowerCase().includes(q))
    );
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl p-5 space-y-5 animate-fadeIn">
      {/* Header Widget Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl relative shrink-0">
            <Icons.BellRing className="h-6 w-6 animate-pulse" />
            {urgentAssetsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                {urgentAssetsCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <span>Dashboard Pengingat Jatuh Tempo Pemeliharaan</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                &le; 30 Hari Ke Depan
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring khusus aset berkontrak yang memerlukan servis mendesak (&le; 7 hari / terlambat) dan servis segera (8-30 hari).
            </p>
          </div>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-extrabold text-rose-300">
              🔴 Mendesak: <strong className="text-white text-sm">{criticalCount}</strong>
            </span>
          </div>

          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-extrabold text-amber-300">
              🟡 Segera: <strong className="text-white text-sm">{warningCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/5">
        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMode("urgent_30")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === "urgent_30"
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white bg-slate-900 border border-white/5"
            }`}
          >
            <Icons.AlertTriangle className="h-3.5 w-3.5" />
            <span>Jatuh Tempo &le; 30 Hari ({urgentAssetsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("overdue_only")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === "overdue_only"
                ? "bg-rose-500 text-slate-950 shadow-md"
                : "text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>🔴 Mendesak ({criticalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("due_soon_only")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === "due_soon_only"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-amber-300 hover:text-amber-200 bg-amber-950/30 border border-amber-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>🟡 Segera ({warningCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white bg-slate-900 border border-white/5"
            }`}
          >
            Semua Aset ({assets.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Icons.Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aset / klien / no kontrak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Urgent Asset Reminder Cards */}
      {filteredAssets.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-white/5">
          <Icons.CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="font-extrabold text-white text-sm">Tidak Ada Aset Dalam Kategori Ini</h4>
          <p className="text-xs text-slate-400 mt-1">
            Seluruh jadwal pemeliharaan berkala berada dalam kondisi terjadwal aman atau tidak sesuai kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const isCritical = asset.severity === "critical";
            const isWarning = asset.severity === "warning";

            const formattedDate = new Date(asset.nextServiceDueDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={asset.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-2xl flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  isCritical
                    ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20"
                    : isWarning
                    ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20"
                    : "bg-slate-950/40 border-white/10 hover:border-indigo-500/40"
                }`}
              >
                {/* Status Indicator Bar top */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isCritical ? "bg-rose-500 animate-pulse" : isWarning ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                />

                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                        isCritical
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : isWarning
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {isCritical ? (
                        <>
                          <Icons.AlertTriangle className="h-3 w-3 text-rose-400 animate-pulse" />
                          <span>
                            {asset.daysRemaining < 0
                              ? `🔴 Overdue (${Math.abs(asset.daysRemaining)} Hari)`
                              : `🔴 Mendesak (H-${asset.daysRemaining})`}
                          </span>
                        </>
                      ) : isWarning ? (
                        <>
                          <Icons.Clock className="h-3 w-3 text-amber-400" />
                          <span>🟡 Segera (H-${asset.daysRemaining})</span>
                        </>
                      ) : (
                        <>
                          <Icons.CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>🟢 Terjadwal (H-${asset.daysRemaining})</span>
                        </>
                      )}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                      {asset.contractNumber}
                    </span>
                  </div>

                  {/* Asset Name & Client */}
                  <h4 className="font-extrabold text-white text-sm line-clamp-2 leading-snug">
                    {asset.assetName}
                  </h4>

                  <p className="text-xs text-indigo-300 font-bold mt-1 flex items-center gap-1">
                    <Icons.Building className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>{asset.clientCompany || asset.clientName}</span>
                  </p>

                  {/* Metadata Tags */}
                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-slate-400">Tanggal Servis:</span>
                      <strong className="font-mono text-white bg-slate-900 px-2 py-0.5 rounded">
                        {formattedDate}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Teknisi PIC:</span>
                      <span className="font-semibold text-slate-200">
                        {asset.technicianInCharge || "Tim BBS"}
                      </span>
                    </div>

                    {asset.locationRack && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 italic">
                        <span>Lokasi:</span>
                        <span className="truncate max-w-[150px]">{asset.locationRack}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onLogService && onLogService(asset)}
                    className="flex-1 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white text-xs font-black rounded-lg transition-colors border border-emerald-500/30 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Icons.Wrench className="h-3.5 w-3.5" />
                    <span>Catat Servis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSendReminder && onSendReminder(asset)}
                    className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 hover:text-amber-200 rounded-lg transition-colors border border-amber-500/30 cursor-pointer"
                    title="Kirim Pesan Pengingat Servis (WA / Email)"
                  >
                    <Icons.MessageSquare className="h-4 w-4" />
                  </button>

                  {onEditAsset && (
                    <button
                      type="button"
                      onClick={() => onEditAsset(asset)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition-colors border border-white/10 cursor-pointer"
                      title="Ubah Rincian Aset"
                    >
                      <Icons.Edit2 className="h-4 w-4" />
                    </button>
                  )}

                  {onSelectAsset && !onEditAsset && (
                    <button
                      type="button"
                      onClick={() => onSelectAsset(asset)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-white/10 cursor-pointer"
                      title="Lihat Detail & Riwayat Aset"
                    >
                      <Icons.Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
