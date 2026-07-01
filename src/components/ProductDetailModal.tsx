import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  X, 
  Layers, 
  Scan, 
  CheckCircle, 
  AlertCircle, 
  Monitor, 
  Wrench, 
  Package, 
  MapPin, 
  Warehouse, 
  ShieldCheck,
  Plus,
  ShoppingCart,
  Camera,
  Info,
  RotateCw,
  QrCode,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { ProductItem } from "../types";

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: ProductItem[];
  onProductChange: (newProduct: ProductItem) => void;
  onAddToCart: (product: ProductItem) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  catalogProducts,
  onProductChange,
  onAddToCart,
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "warehouse">("specs");
  const [showQrShare, setShowQrShare] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Scanner state inside the modal
  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");
  const [simulateMode, setSimulateMode] = useState(false);

  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const containerId = "detail-modal-qr-reader";

  // Mock Warehouse Info based on product ID
  const getWarehouseInfo = (id: string) => {
    const warehouseData: Record<string, { rak: string; stok: string; sku: string; petugas: string }> = {
      "prod_1": { rak: "Sektor A - Rak A12", stok: "15 Unit (Ready Stock)", sku: "BBS-LEN-TB14G6", petugas: "Handoko (BBS-WH1)" },
      "prod_2": { rak: "Sektor B - Rak B04", stok: "8 Unit (Ready Stock)", sku: "BBS-ASU-D7MT", petugas: "Handoko (BBS-WH1)" },
      "prod_3": { rak: "Sektor Server - Rack 02", stok: "3 Unit (Ready)", sku: "BBS-DEL-R250", petugas: "Dian (BBS-WH2)" },
      "prod_4": { rak: "Sektor C - Rak C01", stok: "5 Unit (Ready Stock)", sku: "BBS-SYN-DS923", petugas: "Dian (BBS-WH2)" },
      "prod_5": { rak: "Sektor D - Rak D08", stok: "12 Unit (Ready Stock)", sku: "BBS-MTK-5009", petugas: "Yanto (BBS-WH3)" },
      "prod_6": { rak: "Sektor D - Rak D09", stok: "24 Unit (Ready Stock)", sku: "BBS-UQT-U6L", petugas: "Yanto (BBS-WH3)" },
      "prod_7": { rak: "Sektor E - Rak E02", stok: "40 Unit (Ready Stock)", sku: "BBS-HIK-DS2CD", petugas: "Handoko (BBS-WH1)" },
      "prod_8": { rak: "Sektor Virtual / Cloud Licensing", stok: "Lisensi Digital (Tersedia)", sku: "BBS-MS-365BS", petugas: "Admin Portal BBS" },
    };
    return warehouseData[id] || { rak: "Sektor F - Rak F01", stok: "Tanyakan Admin", sku: `BBS-VAR-${id.toUpperCase()}`, petugas: "Admin Gudang" };
  };

  const currentWh = product ? getWarehouseInfo(product.id) : null;

  // Handle Scanner initialization
  useEffect(() => {
    if (activeTab === "warehouse") {
      // Fetch cameras
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length > 0) {
              setCameras(devices);
              setSelectedCameraId(devices[0].id);
            } else {
              setScanError("Kamera tidak ditemukan pada perangkat Anda.");
              setSimulateMode(true);
            }
          })
          .catch((err) => {
            console.warn("getCameras error:", err);
            setScanError("Akses kamera diblokir atau tidak diizinkan.");
            setSimulateMode(true);
          });
      } else {
        setScanError("Browser Anda tidak mendukung akses kamera.");
        setSimulateMode(true);
      }
    }

    return () => {
      // Clean up scanner on tab/modal change
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        qrCodeInstanceRef.current.stop().catch((e) => console.error("Error stopping scanner", e));
      }
    };
  }, [activeTab]);

  const startScanner = async () => {
    setScanError("");
    setScanSuccessMsg("");
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      qrCodeInstanceRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (width: number, height: number) => {
          const minDim = Math.min(width, height);
          const boxSize = Math.floor(minDim * 0.7);
          return { width: boxSize, height: boxSize };
        }
      };

      setScannerActive(true);
      const targetCamera = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: "environment" };

      await html5QrCode.start(
        targetCamera,
        config,
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        () => {} // Silent parsing errors
      );
    } catch (err: any) {
      setScannerActive(false);
      setScanError(err?.message || "Gagal membuka kamera. Harap periksa izin kamera.");
    }
  };

  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop();
        }
        qrCodeInstanceRef.current = null;
      } catch (e) {
        console.error("Stop error:", e);
      }
    }
    setScannerActive(false);
  };

  const handleScannedCode = (code: string) => {
    const trimmedCode = code.trim().toLowerCase();
    
    const barcodeMappings: Record<string, string> = {
      "8895431201": "prod_1",
      "1928471048": "prod_2",
      "3049182740": "prod_3",
      "4095817263": "prod_4",
      "5120394857": "prod_5",
      "6238475910": "prod_6",
      "7349581023": "prod_7",
      "8450192837": "prod_8",
    };

    let matchedProduct: ProductItem | undefined;

    // 1. By Mapping Code
    if (barcodeMappings[trimmedCode]) {
      matchedProduct = catalogProducts.find(p => p.id === barcodeMappings[trimmedCode]);
    }

    // 2. By Direct ID
    if (!matchedProduct) {
      matchedProduct = catalogProducts.find(p => p.id.toLowerCase() === trimmedCode);
    }

    // 3. By Name Match
    if (!matchedProduct) {
      matchedProduct = catalogProducts.find(p => 
        p.name.toLowerCase().includes(trimmedCode) || 
        trimmedCode.includes(p.name.toLowerCase())
      );
    }

    if (matchedProduct) {
      stopScanner();
      onProductChange(matchedProduct);
      setScanSuccessMsg(`Berhasil memindai label! Menampilkan detail: ${matchedProduct.name}`);
      setActiveTab("specs");
      
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
    } else {
      setScanError(`Kode "${code}" tidak terdaftar dalam katalog kami.`);
    }
  };

  const simulateScan = (productId: string) => {
    const matchedProduct = catalogProducts.find(p => p.id === productId);
    if (matchedProduct) {
      onProductChange(matchedProduct);
      setScanSuccessMsg(`[Simulasi] Berhasil memindai spesifikasi: ${matchedProduct.name}`);
      setActiveTab("specs");
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn no-print" id="catalog-detail-modal">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Product Image & Quick Info */}
        <div className="md:w-2/5 bg-slate-950 p-6 flex flex-col justify-between border-r border-white/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {product.category}
              </span>
              <div className="flex flex-col items-end space-y-1">
                <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  SKU: {currentWh?.sku}
                </span>
                {product.serialNumber && (
                  <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Info className="h-2.5 w-2.5 text-indigo-400" />
                    <span>SN: {product.serialNumber}</span>
                  </span>
                )}
              </div>
            </div>

            {product.image ? (
              <div className="w-full aspect-square max-h-64 rounded-xl overflow-hidden bg-white/5 p-4 border border-white/5 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="max-w-full max-h-full object-contain rounded-lg" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-full aspect-square max-h-64 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-400">
                <Package className="h-16 w-16 mb-2 stroke-1 animate-pulse" />
                <span className="text-xs font-mono">{product.id}</span>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight">{product.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{product.description}</p>
            </div>
          </div>

          <div className="pt-6 space-y-3 border-t border-white/5 mt-6">
            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <span className="text-[9px] text-slate-400 uppercase font-mono block">Estimasi Rentang Harga Pengadaan:</span>
              <span className="text-sm font-extrabold text-amber-400">{product.estimatedPriceRange}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => {
                  onAddToCart(product);
                  // Simple feedback
                  const origText = document.getElementById(`add-btn-detail-${product.id}`)?.innerText;
                  const btn = document.getElementById(`add-btn-detail-${product.id}`);
                  if (btn) {
                    btn.innerText = "✓ Ditambahkan";
                    btn.classList.add("bg-emerald-600", "border-emerald-500");
                    setTimeout(() => {
                      if (btn) {
                        btn.innerText = origText || "Keranjang RFQ";
                        btn.classList.remove("bg-emerald-600", "border-emerald-500");
                      }
                    }, 1500);
                  }
                }}
                id={`add-btn-detail-${product.id}`}
                className="col-span-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                <Plus className="h-4 w-4" />
                <span>Keranjang RFQ</span>
              </button>

              <button
                onClick={() => setShowQrShare(!showQrShare)}
                className={`col-span-1 py-2.5 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer border ${
                  showQrShare 
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" 
                    : "bg-white/5 text-indigo-400 hover:text-indigo-300 border-white/10 hover:border-indigo-500/30"
                }`}
                title="Tampilkan QR Code untuk membagikan produk ini"
              >
                <QrCode className="h-4.5 w-4.5" />
              </button>
            </div>

            {showQrShare && (
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col items-center space-y-3 animate-fadeIn">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Scan & Bagikan Produk</span>
                  <span className="text-[9px] text-slate-500 block">Pindai QR untuk membuka detail produk langsung</span>
                </div>
                
                <div className="bg-white p-2.5 rounded-lg border border-indigo-500/20 shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=4f46e5&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?product=" + product.id)}`} 
                    alt="Product QR Link" 
                    className="w-28 h-28"
                  />
                </div>

                <div className="flex w-full space-x-1.5">
                  <button
                    onClick={async () => {
                      const shareUrl = window.location.origin + window.location.pathname + "?product=" + product.id;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: product.name,
                            text: `Cek detail spesifikasi ${product.name} di Berkah Bintang Solusindo.`,
                            url: shareUrl
                          });
                        } catch (err) {
                          console.log("Error sharing:", err);
                        }
                      } else {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          setCopySuccess(true);
                          setTimeout(() => setCopySuccess(false), 2000);
                        } catch (err) {
                          console.error("Clipboard write error:", err);
                        }
                      }
                    }}
                    className="flex-1 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Bagikan Link</span>
                  </button>

                  <button
                    onClick={async () => {
                      const shareUrl = window.location.origin + window.location.pathname + "?product=" + product.id;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (err) {
                        console.error("Clipboard write error:", err);
                      }
                    }}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    {copySuccess ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copySuccess ? "Copied!" : "Salin Link"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Navigation & Interactive Specs or Warehouse Check */}
        <div className="md:w-3/5 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Close Row */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              {/* Tab Toggles */}
              <div className="flex space-x-1 p-1 bg-slate-950 rounded-lg border border-white/5">
                <button
                  onClick={() => {
                    stopScanner();
                    setActiveTab("specs");
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${activeTab === "specs" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Spesifikasi Teknis</span>
                </button>
                <button
                  onClick={() => setActiveTab("warehouse")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${activeTab === "warehouse" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
                >
                  <Warehouse className="h-3.5 w-3.5" />
                  <span>Pengecekan Gudang</span>
                </button>
              </div>

              <button
                onClick={() => {
                  stopScanner();
                  onClose();
                }}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification alert for scans */}
            {scanSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[11px] rounded-xl flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{scanSuccessMsg}</span>
                </div>
                <button 
                  onClick={() => setScanSuccessMsg("")}
                  className="text-emerald-400 hover:text-white text-[10px] font-bold"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Tab Contents */}
            <div className="mt-5">
              {activeTab === "specs" ? (
                /* Specs Tab */
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1.5">Deskripsi Detil Barang</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      Perangkat {product.name} dirancang khusus untuk memenuhi standar keandalan tinggi dalam infrastruktur IT perusahaan, pengadaan sekolah, umum, dan UMKM. Komponen berkualitas menjamin ketahanan masa pakai optimal.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Spesifikasi Teknis Lengkap</h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {product.specifications.map((spec, i) => {
                        // Split spec by colon to format nicely if key-value is present
                        const parts = spec.split(":");
                        const isKeyValue = parts.length > 1;

                        return (
                          <div key={i} className="p-3 bg-slate-950/20 border border-white/5 rounded-xl flex items-start gap-3 hover:border-white/10 transition-colors">
                            <div className="p-1.5 bg-indigo-500/5 rounded-lg text-indigo-400 shrink-0 mt-0.5">
                              <Monitor className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-xs leading-normal">
                              {isKeyValue ? (
                                <>
                                  <span className="font-bold text-slate-200 block sm:inline-block sm:w-32">{parts[0]}:</span>
                                  <span className="text-slate-300 pl-0 sm:pl-1">{parts.slice(1).join(":")}</span>
                                </>
                              ) : (
                                <span className="text-slate-300">{spec}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Garansi Resmi 1 Tahun BBS Solusindo</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">Certified Partner</span>
                  </div>
                </div>
              ) : (
                /* Warehouse Scan Tab */
                <div className="space-y-4">
                  {/* Current Product Warehouse Storage Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/55 rounded-xl border border-white/5 flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-mono block">Lokasi Penyimpanan Rak</span>
                        <span className="text-xs font-bold text-slate-200">{currentWh?.rak}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/55 rounded-xl border border-white/5 flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-mono block">Stok Inventaris Gudang</span>
                        <span className="text-xs font-bold text-emerald-400">{currentWh?.stok}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/55 rounded-xl border border-white/5 flex items-center space-x-3 sm:col-span-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                        <Warehouse className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-mono block">Petugas PIC Gudang</span>
                        <span className="text-xs font-bold text-slate-300">{currentWh?.petugas}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR/Barcode scanner section for warehouse worker */}
                  <div className="border-t border-white/5 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white">Pemindai Barcode / QR Gudang</h4>
                        <p className="text-[10px] text-slate-400">Pindai label barcode perangkat lain di box / rak untuk langsung menampilkan spesifikasinya.</p>
                      </div>

                      {/* Camera Selector vs Simulator toggles */}
                      <div className="flex space-x-1 p-0.5 bg-slate-950 rounded-lg border border-white/5">
                        <button
                          onClick={() => {
                            setSimulateMode(false);
                            stopScanner();
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded ${!simulateMode ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          Kamera
                        </button>
                        <button
                          onClick={() => {
                            setSimulateMode(true);
                            stopScanner();
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded ${simulateMode ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          Simulator
                        </button>
                      </div>
                    </div>

                    {!simulateMode ? (
                      <div className="space-y-3">
                        {cameras.length > 1 && !scannerActive && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-400 uppercase font-mono shrink-0">Pilih Kamera:</span>
                            <select
                              value={selectedCameraId}
                              onChange={(e) => setSelectedCameraId(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {cameras.map((camera) => (
                                <option key={camera.deviceId} value={camera.deviceId}>
                                  {camera.label || `Kamera ${cameras.indexOf(camera) + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className={`relative aspect-video bg-slate-950 border rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
                          scannerActive 
                            ? "border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-pulseGlow" 
                            : "border-white/10"
                        }`}>
                          <div id={containerId} className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

                          {/* Scanning Target Frame & Brackets overlay */}
                          {scannerActive && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                              {/* Target Frame Area */}
                              <div className="w-32 h-32 border border-white/10 rounded-2xl relative flex items-center justify-center">
                                {/* Corner brackets */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
                                
                                {/* Subtle pulsating center target dot */}
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-ping" />
                              </div>
                            </div>
                          )}

                          {scannerActive && (
                            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,0.9)] animate-scanLine z-10" />
                          )}

                          {!scannerActive && (
                            <div className="text-center p-4 space-y-2 z-10">
                              <div className="mx-auto w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                                <Camera className="h-5 w-5 text-slate-400 animate-pulse" />
                              </div>
                              <p className="text-[11px] text-white font-bold">Kamera Pengecekan Gudang Siap</p>
                              <button
                                onClick={startScanner}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] transition-colors"
                              >
                                Aktifkan Scanner Kamera
                              </button>
                            </div>
                          )}

                          {scannerActive && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                              <button
                                onClick={stopScanner}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9px] transition-colors shadow-md"
                              >
                                Hentikan Scanner
                              </button>
                            </div>
                          )}
                        </div>

                        {scanError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold text-red-200">Akses Scanner Gagal</p>
                              <p className="text-[10px] text-slate-400 leading-normal">{scanError}</p>
                              <button 
                                onClick={() => setSimulateMode(true)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline block mt-1"
                              >
                                Gunakan Mode Simulator di Kanan Atas
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Simulation list inside Product Detail Warehouse tab */
                      <div className="space-y-3">
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl flex items-start space-x-2 text-[10px] text-slate-400 leading-normal">
                          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>Klik salah satu produk di bawah untuk mensimulasikan pemindaian label box barang di rak gudang. Spesifikasi produk terpilih akan otomatis tampil di tab sebelah kiri.</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {catalogProducts.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => simulateScan(p.id)}
                              className={`p-2 bg-slate-950 border rounded-xl text-left hover:border-indigo-500/40 hover:bg-white/5 transition-all text-[10px] truncate ${p.id === product.id ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/5"}`}
                            >
                              <div className="font-bold text-white truncate">{p.name}</div>
                              <div className="text-[9px] text-slate-500 font-mono mt-0.5">SKU: {getWarehouseInfo(p.id).sku}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer of Detail view */}
          <div className="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-slate-500">
            <span>Sistem Pemantauan Gudang & Spesifikasi Teknis BBS v1.2</span>
            <span>PIC: {currentWh?.petugas}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
