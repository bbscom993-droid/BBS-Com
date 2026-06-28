import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Scan, X, RotateCw, CheckCircle, AlertCircle, ShoppingCart, Info } from "lucide-react";
import { ProductItem } from "../types";

interface BarcodeScannerProps {
  catalogProducts: ProductItem[];
  onScanSuccess: (product: ProductItem) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ catalogProducts, onScanSuccess, onClose }: BarcodeScannerProps) {
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scanError, setScanError] = useState<string>("");
  const [lastScanned, setLastScanned] = useState<ProductItem | null>(null);
  const [scanHistory, setScanHistory] = useState<{ product: ProductItem; time: string }[]>([]);
  const [simulateMode, setSimulateMode] = useState<boolean>(false);

  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const containerId = "html5-qr-reader";

  // Get list of cameras when mounted
  useEffect(() => {
    // Check if mediaDevices are supported
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            setSelectedCameraId(devices[0].id);
          } else {
            setScanError("Kamera tidak ditemukan. Harap pastikan kamera terhubung.");
            setSimulateMode(true); // Default to simulation if no camera available
          }
        })
        .catch((err) => {
          console.warn("enumerateDevices error:", err);
          setScanError("Gagal mengakses daftar kamera. Akses kamera mungkin diblokir.");
          setSimulateMode(true); // Default to simulation if blocked or not allowed
        });
    } else {
      setScanError("Browser Anda tidak mendukung akses media kamera.");
      setSimulateMode(true);
    }

    return () => {
      // Clean up scanner on unmount
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        qrCodeInstanceRef.current.stop().catch((e) => console.error("Error stopping scanner on unmount", e));
      }
    };
  }, []);

  // Handle start scanning
  const startScanner = async () => {
    setScanError("");
    setLastScanned(null);
    try {
      // Create HTML5 QR Code instance
      const html5QrCode = new Html5Qrcode(containerId);
      qrCodeInstanceRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (width: number, height: number) => {
          // Responsive box based on viewport
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
        (errorMessage) => {
          // Verbose error logging can be noisy during scanning, ignore standard frame-parse errors
        }
      );
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setScannerActive(false);
      setScanError(err?.message || "Gagal memulai kamera. Mohon izinkan akses kamera di browser Anda.");
    }
  };

  // Handle stop scanning
  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop();
        }
        qrCodeInstanceRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
    setScannerActive(false);
  };

  // Process the scanned QR code or barcode
  const handleScannedCode = (code: string) => {
    const trimmedCode = code.trim().toLowerCase();
    
    // Find matching product
    // 1. By ID match (e.g. prod_1)
    // 2. By partial name match
    // 3. Or by standard simulation barcode numbers mapping
    const barcodeMappings: Record<string, string> = {
      "8895431201": "prod_1", // Lenovo
      "1928471048": "prod_2", // ASUS
      "3049182740": "prod_3", // Dell PowerEdge
      "4095817263": "prod_4", // Synology NAS
      "5120394857": "prod_5", // Mikrotik Router
      "6238475910": "prod_6", // Ubiquiti AP
      "7349581023": "prod_7", // Hikvision Camera
      "8450192837": "prod_8", // Office 365
    };

    let matchedProduct: ProductItem | undefined;

    // Check mapping table first
    if (barcodeMappings[trimmedCode]) {
      matchedProduct = catalogProducts.find(p => p.id === barcodeMappings[trimmedCode]);
    }

    // Direct ID match
    if (!matchedProduct) {
      matchedProduct = catalogProducts.find(p => p.id.toLowerCase() === trimmedCode);
    }

    // Name match as fallback
    if (!matchedProduct) {
      matchedProduct = catalogProducts.find(p => 
        p.name.toLowerCase().includes(trimmedCode) || 
        trimmedCode.includes(p.name.toLowerCase())
      );
    }

    if (matchedProduct) {
      onScanSuccess(matchedProduct);
      setLastScanned(matchedProduct);
      
      const newHistoryItem = {
        product: matchedProduct,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      };
      setScanHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);

      // Vibrate if supported by device
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }

      // Briefly stop camera and restart to allow user to view scan or scan again
      stopScanner();
    } else {
      // Show unknown scan warning but keep scanning
      console.warn("Unregistered product code scanned:", code);
    }
  };

  // Handle simulate scan
  const simulateScan = (productId: string) => {
    const matchedProduct = catalogProducts.find(p => p.id === productId);
    if (matchedProduct) {
      handleScannedCode(productId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Scan className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Scanner Label Produk</h3>
              <p className="text-[10px] text-slate-400">Scan QR Code / Barcode produk untuk menambah ke RFQ</p>
            </div>
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

        {/* Scanner Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[80vh]">
          {/* Tabs: Camera vs Simulator */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-white/5">
            <button
              onClick={() => {
                setSimulateMode(false);
                stopScanner();
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${!simulateMode ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Kamera Perangkat
            </button>
            <button
              onClick={() => {
                setSimulateMode(true);
                stopScanner();
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${simulateMode ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Simulasi Scanner
            </button>
          </div>

          {/* Interactive Camera Area */}
          {!simulateMode ? (
            <div className="space-y-4">
              {/* Camera selection dropdown */}
              {cameras.length > 1 && !scannerActive && (
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Pilih Kamera</label>
                  <div className="relative">
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8 appearance-none"
                    >
                      {cameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Kamera ${cameras.indexOf(camera) + 1}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <RotateCw className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport Box */}
              <div className="relative aspect-video bg-slate-950 border border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
                <div id={containerId} className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

                {/* Laser Overlay scanning effect */}
                {scannerActive && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-scanLine z-10" />
                )}

                {!scannerActive && (
                  <div className="text-center p-4 space-y-3 z-10">
                    <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">Kamera Siap</p>
                      <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto">Klik tombol di bawah untuk mengaktifkan video scanner.</p>
                    </div>
                    <button
                      onClick={startScanner}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10"
                    >
                      Aktifkan Kamera
                    </button>
                  </div>
                )}

                {scannerActive && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                    <button
                      onClick={stopScanner}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg"
                    >
                      Matikan Kamera
                    </button>
                  </div>
                )}
              </div>

              {scanError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-red-200">Akses Kamera Bermasalah</p>
                    <p className="text-[10px] text-slate-400 leading-normal">{scanError}</p>
                    <button 
                      onClick={() => setSimulateMode(true)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline block mt-1"
                    >
                      Gunakan Fitur Simulasi Scanner Sebagai Gantinya
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Simulation mode panel */
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-1.5">
                <div className="flex items-center space-x-1 text-indigo-400 text-xs font-bold">
                  <Info className="h-4 w-4" />
                  <span>Petunjuk Simulasi Barcode/QR</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Gunakan simulator ini untuk menguji penambahan produk secara cepat jika kamera Anda diblokir, tidak tersedia, atau sedang dijalankan di dalam iframe. Cukup klik tombol produk di bawah ini untuk mensimulasikan hasil pemindaian label barcode secara instan.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Simulasikan Scan Label Produk:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catalogProducts.map((product) => {
                    // Match a custom barcode mock number for each
                    const mockBarcodes: Record<string, string> = {
                      "prod_1": "8895431201",
                      "prod_2": "1928471048",
                      "prod_3": "3049182740",
                      "prod_4": "4095817263",
                      "prod_5": "5120394857",
                      "prod_6": "6238475910",
                      "prod_7": "7349581023",
                      "prod_8": "8450192837",
                    };
                    const code = mockBarcodes[product.id] || product.id;

                    return (
                      <button
                        key={product.id}
                        onClick={() => simulateScan(product.id)}
                        className="flex items-center p-2.5 bg-slate-950 border border-white/5 rounded-xl text-left hover:border-indigo-500/30 hover:bg-white/5 transition-all group"
                      >
                        <div className="p-1.5 bg-white/5 rounded-lg mr-2.5 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5">
                          <Scan className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate leading-tight">{product.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono tracking-wide">Code: {code}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recently Scanned Result */}
          {lastScanned && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 animate-scaleIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="h-4 w-4" />
                  <span>Pemindaian Berhasil!</span>
                </div>
                <div className="text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-white/5">
                  Berhasil ditambahkan
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-slate-950/40 p-2 rounded-lg border border-white/5">
                {lastScanned.image ? (
                  <img 
                    src={lastScanned.image} 
                    alt={lastScanned.name} 
                    className="w-10 h-10 object-contain bg-white rounded p-1 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-500/10 rounded flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
                    {lastScanned.id}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-black text-white truncate leading-tight">{lastScanned.name}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{lastScanned.category} • {lastScanned.estimatedPriceRange}</p>
                </div>
              </div>
              {!simulateMode && (
                <button
                  onClick={startScanner}
                  className="w-full py-1.5 bg-slate-950 border border-white/5 hover:border-indigo-500/20 hover:text-white rounded-lg text-[10px] text-slate-300 font-bold transition-all"
                >
                  Pindai Label Berikutnya
                </button>
              )}
            </div>
          )}

          {/* Scanning History logs */}
          {scanHistory.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Riwayat Pemindaian Sesi</span>
                <button 
                  onClick={() => setScanHistory([])} 
                  className="text-[9px] text-slate-500 hover:text-slate-400"
                >
                  Hapus
                </button>
              </div>
              <div className="space-y-1.5">
                {scanHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-[10px] text-slate-400 p-2 bg-slate-950/30 rounded-lg border border-white/5">
                    <span className="font-bold text-slate-300 truncate max-w-[280px]">{item.product.name}</span>
                    <span className="text-[9px] font-mono text-indigo-400 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShoppingCart className="h-3.5 w-3.5 text-indigo-400" />
            <span>Format label yang didukung: <b>QR Code, EAN-13, Code-128</b></span>
          </div>
          <div>
            V1.0
          </div>
        </div>
      </div>
    </div>
  );
}
