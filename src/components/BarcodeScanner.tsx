import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Scan, X, RotateCw, CheckCircle, AlertCircle, ShoppingCart, Info, History, Trash2, Search, Filter } from "lucide-react";
import { ProductItem } from "../types";

interface BarcodeScannerProps {
  catalogProducts: ProductItem[];
  onScanSuccess: (product: ProductItem) => void;
  onClose: () => void;
  onAddCustomItem?: (item: { name: string; quantity: number; description?: string }) => void;
  isCatalogScanBtn?: boolean;
}

interface RecentScanItem {
  product: ProductItem;
  scannedAt: number;
}

const playBeepSound = (isCatalogScanBtn?: boolean) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Dynamic volume adjustment from localStorage (defaulting to 0.5)
    let volumeLevel = 0.5;
    try {
      const storedVol = localStorage.getItem("bbs_scanner_volume");
      if (storedVol !== null) {
        volumeLevel = parseFloat(storedVol);
      }
    } catch (e) {
      console.warn("Could not retrieve volume from localStorage", e);
    }

    if (isCatalogScanBtn) {
      // Crisp, high-frequency 'beep' sound effect (exclusively for #scan_barcode_from_catalog_btn)
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(2500, audioCtx.currentTime); // Crisp 2500Hz high pitch
      
      const targetGain = 0.22 * volumeLevel;
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.004); // Instantaneous attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.065); // Snappy decay
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.07);
    } else {
      // Standard pleasant system scan beep
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz (A5)
      
      const targetGain = 0.15 * volumeLevel;
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.01); // fast fade-in
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12); // smooth decay

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.12);
    }
  } catch (e) {
    console.warn("Failed to play scan beep sound:", e);
  }
};

export default function BarcodeScanner({ 
  catalogProducts, 
  onScanSuccess, 
  onClose, 
  onAddCustomItem,
  isCatalogScanBtn = false
}: BarcodeScannerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scanError, setScanError] = useState<string>("");
  const [lastScanned, setLastScanned] = useState<ProductItem | null>(null);
  const [scanHistory, setScanHistory] = useState<{ product: ProductItem; time: string }[]>([]);
  const [simulateMode, setSimulateMode] = useState<boolean>(false);

  // Success Confirmation overlay states
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);
  const [scannedProductName, setScannedProductName] = useState<string>("");

  const triggerScanSuccessConfirmation = (productName: string) => {
    setScannedProductName(productName);
    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
    }, 1500);
  };

  // Dynamic Scan Counters
  const [modalTotalScans, setModalTotalScans] = useState<number>(() => {
    try {
      const val = localStorage.getItem("bbs_total_scanned_count");
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [modalSessionScans, setModalSessionScans] = useState<number>(() => {
    try {
      const val = sessionStorage.getItem("bbs_session_scanned_count");
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const handleSuccessfulScanCountIncrement = () => {
    setModalTotalScans((prev) => {
      const next = prev + 1;
      localStorage.setItem("bbs_total_scanned_count", next.toString());
      return next;
    });
    setModalSessionScans((prev) => {
      const next = prev + 1;
      sessionStorage.setItem("bbs_session_scanned_count", next.toString());
      return next;
    });
  };

  // Haptic feedback state and action handlers
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("bbs_haptic_enabled");
      return stored !== "false"; // default to true
    } catch {
      return true;
    }
  });

  const triggerHapticFeedback = (pattern: number | number[] = 100) => {
    if (hapticEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic feedback error:", e);
      }
    }
  };

  const toggleHaptic = () => {
    setHapticEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("bbs_haptic_enabled", next.toString());
      if (next && typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([80, 40, 80]);
        } catch {}
      }
      return next;
    });
  };

  // Dynamic categories and category filter state
  const categories = ["Semua", ...Array.from(new Set(catalogProducts.map(p => p.category)))];
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [categoryMismatchError, setCategoryMismatchError] = useState<{
    productName: string;
    productCategory: string;
    filteredCategory: string;
  } | null>(null);

  // Sorting state for Recent Scans
  const [recentScansSortBy, setRecentScansSortBy] = useState<"date_desc" | "date_asc" | "name_asc">("date_desc");

  // Persistent Recent Scans (last 10 scans) in localStorage with timestamps
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>(() => {
    try {
      const saved = localStorage.getItem("bbs_recent_scans");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          // Backward compatibility support: check if it already has product and scannedAt properties
          if (item && item.product && typeof item.scannedAt === "number") {
            return item as RecentScanItem;
          }
          // Legacy direct ProductItem format
          return { product: item, scannedAt: Date.now() };
        });
      }
      return [];
    } catch (e) {
      console.error("Error reading recent scans from localStorage", e);
      return [];
    }
  });

  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});

  const formatScannedTime = (timestamp: number) => {
    try {
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins}m lalu`;
      const date = new Date(timestamp);
      return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const addToRecentScans = (product: ProductItem) => {
    setRecentScans((prev) => {
      const filtered = prev.filter((item) => item.product.id !== product.id);
      const updated = [{ product, scannedAt: Date.now() }, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("bbs_recent_scans", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving recent scans to localStorage", e);
      }
      return updated;
    });
  };

  const handleQuickAddProduct = (product: ProductItem) => {
    playBeepSound(isCatalogScanBtn);
    onScanSuccess(product);
    addToRecentScans(product);
    handleSuccessfulScanCountIncrement();
    triggerScanSuccessConfirmation(product.name);
    
    // Set transient "Added!" state for visual feedback
    setRecentlyAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setRecentlyAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);

    // Vibration feedback if supported
    triggerHapticFeedback(isCatalogScanBtn ? [35, 25, 35] : 100);
  };

  const clearRecentScans = () => {
    setRecentScans([]);
    try {
      localStorage.removeItem("bbs_recent_scans");
    } catch (e) {
      console.error("Error clearing recent scans from localStorage", e);
    }
  };

  const handleRevisitProduct = (product: ProductItem) => {
    playBeepSound(isCatalogScanBtn);
    onScanSuccess(product);
    setLastScanned(product);
    addToRecentScans(product);
    handleSuccessfulScanCountIncrement();
    triggerScanSuccessConfirmation(product.name);
    triggerHapticFeedback(isCatalogScanBtn ? [35, 25, 35] : 100);
    
    const newHistoryItem = {
      product: product,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
    setScanHistory(prev => [newHistoryItem, ...prev.filter(h => h.product.id !== product.id).slice(0, 4)]);
    
    // Stop the active camera if it is scanning to display the success banner
    stopScanner();
  };

  // New state variables for unmatched barcode and manual fallback input fields
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);
  const [manualName, setManualName] = useState<string>("");
  const [manualQty, setManualQty] = useState<number>(1);
  const [manualDesc, setManualDesc] = useState<string>("");

  // SKU Search state and handler
  const [skuInput, setSkuInput] = useState<string>("");

  const handleSkuSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (skuInput.trim()) {
      handleScannedCode(skuInput.trim());
      setSkuInput("");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    if (onAddCustomItem) {
      onAddCustomItem({
        name: manualName.trim(),
        quantity: manualQty,
        description: manualDesc.trim() || undefined
      });
    }

    setUnmatchedCode(null);
    handleSuccessfulScanCountIncrement();

    // Vibrate to confirm success
    triggerHapticFeedback(isCatalogScanBtn ? [35, 25, 35] : [100, 50, 100]);

    // Auto close or keep open? Usually let's reset or let user continue.
    // Since we added successfully, let's keep it open but reset states so they can scan again if desired.
    setLastScanned(null);
  };

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

  // Autofocus the modal on mount for accessibility
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
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

  // Automatically start the scanner once the component is mounted, camera is ready,
  // and we are not in simulateMode (removing the need for a manual click).
  useEffect(() => {
    let isCurrent = true;
    if (selectedCameraId && !simulateMode) {
      // Set a tiny timeout to ensure the DOM element #html5-qr-reader has fully mounted and is ready
      const autoStartTimer = setTimeout(() => {
        if (isCurrent && !scannerActive && !lastScanned && !categoryMismatchError && !unmatchedCode) {
          startScanner();
        }
      }, 350);

      return () => {
        isCurrent = false;
        clearTimeout(autoStartTimer);
      };
    }
  }, [selectedCameraId, simulateMode]);

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
      // Check if product belongs to the selected category (if not "Semua")
      if (selectedCategory !== "Semua" && matchedProduct.category !== selectedCategory) {
        setCategoryMismatchError({
          productName: matchedProduct.name,
          productCategory: matchedProduct.category,
          filteredCategory: selectedCategory,
        });
        stopScanner();
        return;
      }

      setCategoryMismatchError(null);
      playBeepSound(isCatalogScanBtn);
      onScanSuccess(matchedProduct);
      setLastScanned(matchedProduct);
      handleSuccessfulScanCountIncrement();
      triggerScanSuccessConfirmation(matchedProduct.name);
      
      const newHistoryItem = {
        product: matchedProduct,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      };
      setScanHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);

      // Add to persistent recent scans
      addToRecentScans(matchedProduct);

      // Vibrate if supported by device
      triggerHapticFeedback(isCatalogScanBtn ? [35, 25, 35] : 200);

      // Briefly stop camera and restart to allow user to view scan or scan again
      stopScanner();
    } else {
      // Set unmatched state for custom fallback UI handling and stop the active scanner
      setCategoryMismatchError(null);
      setUnmatchedCode(code);
      setManualName(`Perangkat Kustom (${code})`);
      setManualQty(1);
      setManualDesc(`Ditambahkan dari hasil scan barcode: ${code}`);
      stopScanner();
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
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Scan className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">Scanner Label Produk</h3>
                {modalTotalScans > 0 && (
                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-black rounded-full leading-none animate-scaleIn">
                    {modalTotalScans} Scans
                  </span>
                )}
              </div>
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
          {/* Dedicated SKU Search Field */}
          <form onSubmit={handleSkuSearch} className="space-y-1.5 p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl">
            <div className="flex items-center space-x-1.5 text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
              <Search className="h-3.5 w-3.5" />
              <span>Manual SKU / Barcode Lookup</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  placeholder="Masukkan nomor SKU (e.g. 8895431201) atau ID..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8.5 pr-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-sans"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 hover:scale-[1.02] active:scale-95"
              >
                <span>Cari SKU</span>
              </button>
            </div>
          </form>

          {/* Dropdown Filter Kategori */}
          <div className="space-y-1.5 p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
              <div className="flex items-center space-x-1.5">
                <Filter className="h-3.5 w-3.5 text-indigo-400" />
                <span>Filter Kategori Pemindaian</span>
              </div>
              {selectedCategory !== "Semua" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("Semua");
                    setCategoryMismatchError(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 transition-colors lowercase font-semibold text-[9px] px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCategoryMismatchError(null);
                }}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8 appearance-none font-sans font-bold cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat === "Semua" ? "Semua Kategori (Tanpa Batasan)" : cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
          </div>

          {categoryMismatchError ? (
            /* Category Mismatch Warning UI Component with Bypass Option */
            <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-4 animate-scaleIn">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                  <Filter className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Kategori Produk Dibatasi</h4>
                  <p className="text-[11px] text-slate-300">
                    Produk <strong className="text-white">{categoryMismatchError.productName}</strong> ditemukan, tetapi termasuk dalam kategori <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 border border-white/5 font-mono text-[10px] font-bold">{categoryMismatchError.productCategory}</span>.
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Filter pencarian/pemindaian Anda saat ini membatasi hasil hanya untuk kategori <strong className="text-indigo-400 font-bold">{categoryMismatchError.filteredCategory}</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const matched = catalogProducts.find(p => p.name === categoryMismatchError.productName);
                    if (matched) {
                      onScanSuccess(matched);
                      setLastScanned(matched);
                      addToRecentScans(matched);
                      handleSuccessfulScanCountIncrement();
                      triggerScanSuccessConfirmation(matched.name);
                      triggerHapticFeedback(isCatalogScanBtn ? [35, 25, 35] : 100);
                    }
                    setCategoryMismatchError(null);
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md cursor-pointer text-center font-sans"
                >
                  Bypass Filter & Tambahkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryMismatchError(null);
                    setUnmatchedCode(null);
                    if (!simulateMode) {
                      startScanner();
                    }
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center font-sans"
                >
                  Scan Lagi
                </button>
              </div>
            </div>
          ) : unmatchedCode ? (
            /* Custom Error Handling UI Component with Manual Add Fallback */
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-4 animate-scaleIn">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-xl shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Label Barcode Tidak Dikenal</h4>
                  <p className="text-[11px] text-slate-300">
                    Label barcode <span className="font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">{unmatchedCode}</span> tidak cocok dengan produk mana pun di katalog kami.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <form onSubmit={handleManualSubmit} className="space-y-3 p-3.5 bg-slate-950/60 border border-white/5 rounded-xl">
                  <div className="flex items-center space-x-1 text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Fallback: Tambah Manual ke Keranjang</span>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-black mb-1">Nama Perangkat / Item</label>
                    <input 
                      type="text" 
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-sans"
                      placeholder="Masukkan nama item custom"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[9px] text-slate-500 uppercase font-black mb-1">Jumlah</label>
                      <input 
                        type="number" 
                        min="1"
                        value={manualQty}
                        onChange={(e) => setManualQty(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold font-sans"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] text-slate-500 uppercase font-black mb-1">Keterangan / Spesifikasi</label>
                      <input 
                        type="text" 
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        placeholder="Spesifikasi tambahan (opsional)"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md cursor-pointer"
                    >
                      Tambahkan ke Keranjang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUnmatchedCode(null);
                        if (!simulateMode) {
                          startScanner();
                        }
                      }}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Batal / Scan Lagi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
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
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8 appearance-none font-sans font-bold"
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
                  <div className={`relative aspect-video bg-slate-950 border rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
                    scannerActive 
                      ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.35)] animate-pulseGlow" 
                      : "border-white/10"
                  }`}>
                    <div id={containerId} className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

                    {/* Glowing Perimeter Scan Border Overlay */}
                    {scannerActive && (
                      <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-xl pointer-events-none z-10 animate-pulse" />
                    )}

                    {/* Scanning Target Frame & Brackets overlay */}
                    {scannerActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        {/* Target Frame Area */}
                        <div className="w-40 h-40 border border-indigo-500/30 rounded-2xl relative flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          {/* Corner brackets with neon drop-shadow */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                          
                          {/* Subtle pulsating center target dot */}
                          <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.9)] animate-ping" />
                        </div>
                      </div>
                    )}

                    {/* Laser Overlay scanning effect */}
                    {scannerActive && (
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(129,140,248,1)] animate-scanLine z-10" />
                    )}

                    {!scannerActive && (
                      <div className="text-center p-4 space-y-3 z-10">
                        <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-white font-bold font-sans">Kamera Siap</p>
                          <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">Klik tombol di bawah untuk mengaktifkan video scanner.</p>
                        </div>
                        <button
                          onClick={startScanner}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
                        >
                          Aktifkan Kamera
                        </button>
                      </div>
                    )}

                    {scannerActive && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                        <button
                          onClick={stopScanner}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg cursor-pointer animate-fadeIn"
                        >
                          Matikan Kamera
                        </button>
                      </div>
                    )}

                    {/* Camera Success Confirmation Overlay */}
                    {showSuccessOverlay && (
                      <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fadeIn">
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping" />
                          <CheckCircle className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div className="text-center mt-3 px-4">
                          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block">BERHASIL DIPINDAI!</span>
                          <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-[240px]">{scannedProductName}</h4>
                          <p className="text-[9px] text-emerald-500/70 mt-0.5">Item ditambahkan ke RFQ</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {scanError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-red-200 font-sans">Akses Kamera Bermasalah</p>
                        <p className="text-[10px] text-slate-400 leading-normal">{scanError}</p>
                        <button 
                          onClick={() => setSimulateMode(true)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline block mt-1 cursor-pointer"
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

                  {/* Virtual Scanner Viewport for Simulator Mode */}
                  <div className="relative aspect-video bg-slate-950 border border-indigo-500 rounded-xl overflow-hidden flex flex-col items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)]">
                    {/* Laser overlay effect running continuously in simulator */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,1)] animate-scanLine z-10" />
                    
                    {/* Glowing Perimeter Scan Border Overlay */}
                    <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-xl pointer-events-none z-10 animate-pulse" />

                    {/* Simulator target frames */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      <div className="w-28 h-28 border border-indigo-500/30 rounded-xl relative flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                        <Scan className="h-6 w-6 text-indigo-400 animate-pulse" />
                      </div>
                    </div>

                    <div className="text-center p-4 z-10 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Simulasi Scanner Aktif</span>
                      <p className="text-[9px] text-slate-500">Klik salah satu produk di bawah untuk memindai</p>
                    </div>

                    {/* Success Overlay directly inside the simulator viewport! */}
                    {showSuccessOverlay && (
                      <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fadeIn">
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping" />
                          <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div className="text-center mt-2 px-3">
                          <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-black block">BERHASIL DIPINDAI!</span>
                          <h4 className="text-[11px] font-bold text-white mt-0.5 truncate max-w-[220px]">{scannedProductName}</h4>
                          {hapticEnabled && (
                            <div className="flex items-center justify-center gap-1 mt-1 text-[8px] text-emerald-400/70 font-semibold animate-pulse">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 animate-ping mr-1" />
                              <span>Vibration Feedback Active ⚡</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Simulasikan Scan Label Produk:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catalogProducts
                        .filter((product) => selectedCategory === "Semua" || product.category === selectedCategory)
                        .map((product) => {
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
                            className="flex items-center p-2.5 bg-slate-950 border border-white/5 rounded-xl text-left hover:border-indigo-500/50 hover:bg-slate-900 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 group cursor-pointer"
                          >
                            <div className="p-1.5 bg-white/5 rounded-lg mr-2.5 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5">
                              <Scan className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-white truncate leading-tight font-sans">{product.name}</p>
                              <p className="text-[9px] text-slate-500 font-mono tracking-wide">Code: {code}</p>
                            </div>
                          </button>
                        );
                      })}

                      {/* Simulate Mismatch Scan Button */}
                      <button
                        onClick={() => handleScannedCode("9999999999")}
                        className="flex items-center p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-left hover:border-red-500/30 hover:bg-red-500/10 transition-all group sm:col-span-2 cursor-pointer"
                      >
                        <div className="p-1.5 bg-red-500/10 rounded-lg mr-2.5 text-red-400 group-hover:scale-110 transition-transform shrink-0">
                          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-red-300 truncate leading-tight font-sans">Simulasikan Code Tidak Cocok</p>
                          <p className="text-[9px] text-slate-500 font-mono tracking-wide">Test Error Fallback (9999999999)</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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

          {/* Recent Scans (Persistent in localStorage) */}
          {(() => {
            const filteredRecentScans = recentScans.filter(
              ({ product }) => selectedCategory === "Semua" || product.category === selectedCategory
            );

            const sortedRecentScans = [...filteredRecentScans].sort((a, b) => {
              if (recentScansSortBy === "date_desc") {
                return b.scannedAt - a.scannedAt;
              } else if (recentScansSortBy === "date_asc") {
                return a.scannedAt - b.scannedAt;
              } else if (recentScansSortBy === "name_asc") {
                return a.product.name.localeCompare(b.product.name);
              }
              return 0;
            });

            return (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-1.5">
                    <History className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Scans (localStorage)</span>
                  </div>
                  {recentScans.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={recentScansSortBy}
                        onChange={(e) => setRecentScansSortBy(e.target.value as any)}
                        className="bg-slate-950/60 text-slate-300 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-bold cursor-pointer outline-none focus:border-indigo-500/50 transition-colors"
                      >
                        <option value="date_desc" className="bg-slate-900">Date Newest</option>
                        <option value="date_asc" className="bg-slate-900">Date Oldest</option>
                        <option value="name_asc" className="bg-slate-900">Product Name</option>
                      </select>
                      <button 
                        onClick={clearRecentScans} 
                        className="text-[9px] text-slate-500 hover:text-red-400 flex items-center space-x-1 transition-colors cursor-pointer"
                        title="Hapus riwayat permanen"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {sortedRecentScans.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    {sortedRecentScans.map(({ product, scannedAt }) => {
                      const isAdded = recentlyAddedIds[product.id];
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between text-left p-2 bg-slate-950/40 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all group"
                        >
                          {/* Left Details click area: selects the product and triggers full view / pauses camera */}
                          <button
                            type="button"
                            onClick={() => handleRevisitProduct(product)}
                            className="flex items-center space-x-2.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
                            title="Klik untuk melihat detail / pause kamera"
                          >
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-6 h-6 object-contain bg-white rounded p-0.5 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-indigo-500/10 rounded flex items-center justify-center shrink-0 text-indigo-400 font-bold text-[9px]">
                                {product.id.slice(-2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{product.name}</p>
                                <span className="text-[8px] font-mono text-slate-500 shrink-0">({formatScannedTime(scannedAt)})</span>
                              </div>
                              <p className="text-[9px] text-slate-500 truncate">{product.category} • {product.estimatedPriceRange}</p>
                            </div>
                          </button>

                          {/* Right Quick Add Action: adds immediately without stopping the camera */}
                          <button
                            type="button"
                            onClick={() => handleQuickAddProduct(product)}
                            disabled={isAdded}
                            className={`flex items-center space-x-1 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer focus:outline-none shrink-0 ${
                              isAdded
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 scale-[0.98]"
                                : "text-indigo-400 bg-indigo-500/10 border-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:scale-105 active:scale-95"
                            }`}
                            title="Tambah langsung ke RFQ tanpa menghentikan kamera"
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle className="h-3 w-3 animate-scaleIn" />
                                <span className="animate-fadeIn">Ditambahkan!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-3 w-3" />
                                <span>+ Tambah</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-white/5 rounded-xl text-center space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold">
                      {selectedCategory !== "Semua" ? "Tidak Ada Riwayat untuk Kategori Ini" : "Belum Ada Riwayat Pemindaian"}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {selectedCategory !== "Semua" 
                        ? `Tidak ada produk dengan kategori "${selectedCategory}" di riwayat Anda.` 
                        : "Produk yang baru saja Anda pindai atau cari akan tercatat di sini untuk re-add cepat."}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

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
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleHaptic}
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[9px] font-bold transition-all cursor-pointer ${
                !(typeof navigator !== "undefined" && typeof navigator.vibrate === "function")
                  ? "bg-slate-950/40 text-slate-500 border-white/5 cursor-not-allowed"
                  : hapticEnabled
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-slate-950/40 text-slate-400 border-white/5 hover:bg-white/5"
              }`}
              disabled={!(typeof navigator !== "undefined" && typeof navigator.vibrate === "function")}
              title={typeof navigator !== "undefined" && typeof navigator.vibrate === "function" ? "Toggle getaran haptic ketika sukses scan" : "Haptic tidak didukung oleh browser ini"}
            >
              <span>Vibrate</span>
              <span className={`w-1.5 h-1.5 rounded-full ${!(typeof navigator !== "undefined" && typeof navigator.vibrate === "function") ? "bg-slate-600" : hapticEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            </button>
            <span className="text-slate-700">|</span>
            <span>V1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
