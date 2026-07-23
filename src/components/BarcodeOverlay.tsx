import React from "react";
import { Scan, Zap, ZapOff, Sparkles, Move, Info, ShieldCheck } from "lucide-react";

export interface BarcodeOverlayProps {
  isActive: boolean;
  isTorchOn?: boolean;
  onToggleTorch?: () => void;
  torchSupported?: boolean;
  guidanceText?: string;
  statusLabel?: string;
}

export const BarcodeOverlay: React.FC<BarcodeOverlayProps> = ({
  isActive,
  isTorchOn = false,
  onToggleTorch,
  torchSupported = false,
  guidanceText,
  statusLabel = "Pemindaian Otomatis Aktif"
}) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 overflow-hidden select-none">
      {/* Outer Dimmed Background Mask */}
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />

      {/* Perimeter Glowing Active Border */}
      <div className="absolute inset-2 border border-indigo-500/30 rounded-2xl pointer-events-none z-10 animate-pulse" />

      {/* Main Alignment Target Box */}
      <div className="relative w-64 h-40 sm:w-72 sm:h-44 rounded-2xl z-20 flex flex-col items-center justify-between p-2 shadow-[0_0_0_9999px_rgba(2,6,23,0.75)] shadow-indigo-500/10 border border-white/10 transition-all duration-300">

        {/* 1. Four Neon Corner Brackets */}
        {/* Top Left Corner */}
        <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-pulse" />
        {/* Top Right Corner */}
        <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-pulse" />
        {/* Bottom Left Corner */}
        <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-pulse" />
        {/* Bottom Right Corner */}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-cyan-400 rounded-br-xl shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-pulse" />

        {/* 2. Directional Alignment Ticks (Inward Arrows/Lines) */}
        {/* Top Tick */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80 animate-bounce">
          <div className="w-0.5 h-2.5 bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
        </div>
        {/* Bottom Tick */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80 animate-bounce">
          <div className="w-0.5 h-2.5 bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
        </div>
        {/* Left Tick */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center opacity-80">
          <div className="h-0.5 w-2.5 bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
        </div>
        {/* Right Tick */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-80">
          <div className="h-0.5 w-2.5 bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
        </div>

        {/* 3. Barcode Orientation Guide Lines (Subtle Barcode Graphic Background) */}
        <div className="absolute inset-x-6 inset-y-6 opacity-15 flex items-center justify-between pointer-events-none">
          <div className="w-1 h-full bg-indigo-300" />
          <div className="w-0.5 h-full bg-indigo-300" />
          <div className="w-1.5 h-full bg-indigo-300" />
          <div className="w-0.5 h-full bg-indigo-300" />
          <div className="w-2 h-full bg-indigo-300" />
          <div className="w-1 h-full bg-indigo-300" />
          <div className="w-0.5 h-full bg-indigo-300" />
          <div className="w-1.5 h-full bg-indigo-300" />
          <div className="w-1 h-full bg-indigo-300" />
          <div className="w-2 h-full bg-indigo-300" />
        </div>

        {/* 4. Animated Laser Scan Line */}
        <div className="absolute inset-x-1 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_18px_rgba(6,182,212,1)] animate-scanLine z-20 rounded-full" />

        {/* 5. Center Alignment Reticle Dot & Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-3 h-3 rounded-full bg-cyan-400/80 border border-white shadow-[0_0_12px_rgba(6,182,212,1)] animate-ping" />
        </div>

        {/* 6. Top Visual Guidance Header Inside Overlay */}
        <div className="z-30 mt-1.5 bg-slate-950/90 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 backdrop-blur-md">
          <Scan className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-extrabold text-white tracking-wide uppercase">
            {guidanceText || "Posisikan Barcode di Dalam Kotak"}
          </span>
        </div>

        {/* 7. Bottom Guidance Subtext */}
        <div className="z-30 mb-1.5 bg-slate-950/80 border border-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1 text-[9px] text-slate-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* 8. Outer Guidelines Pill Cards below the box */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
        {/* Distance & Lighting Tips */}
        <div className="px-3 py-1.5 bg-slate-950/90 border border-white/10 rounded-xl flex items-center gap-2.5 text-[10px] text-slate-300 font-bold backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-1 text-cyan-400">
            <Move className="h-3 w-3" />
            <span>Jarak Ideal: 10–20 cm</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-amber-400">
            <Sparkles className="h-3 w-3" />
            <span>Posisikan Sejajar Laser</span>
          </div>
        </div>

        {/* Interactive Flashlight / Torch Toggle if supported */}
        {torchSupported && onToggleTorch && (
          <button
            type="button"
            onClick={onToggleTorch}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer backdrop-blur-md ${
              isTorchOn
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/20 scale-105"
                : "bg-slate-950/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
            title={isTorchOn ? "Matikan Lampu Kilat" : "Nyalakan Lampu Kilat"}
          >
            {isTorchOn ? (
              <>
                <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>Flashlight Aktif</span>
              </>
            ) : (
              <>
                <ZapOff className="h-3.5 w-3.5 text-slate-400" />
                <span>Nyalakan Flash</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeOverlay;
