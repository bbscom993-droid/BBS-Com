import React from "react";
import { 
  Laptop, 
  ShoppingCart, 
  Sparkles, 
  Settings, 
  FileText, 
  Home,
  Menu,
  X,
  Wifi,
  WifiOff,
  Database,
  AlertTriangle,
  Store,
  Mail
} from "lucide-react";
import { CompanySettings } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  rfqCartCount: number;
  settings: CompanySettings;
  isBudgetExceeded?: boolean;
}

export default function Navbar({ currentTab, setCurrentTab, rfqCartCount, settings, isBudgetExceeded }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [cacheState, setCacheState] = React.useState({
    hasServiceWorker: false,
    cachedCount: 0,
    isChecking: false
  });

  const updateCacheStatus = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    setCacheState(prev => ({ ...prev, isChecking: true }));
    
    let count = 0;
    const hasSW = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
    
    try {
      if ('caches' in window) {
        const cache = await window.caches.open('bbs-portal-cache-v1');
        const keys = await cache.keys();
        count = keys.length;
      }
    } catch (e) {
      console.warn("Failed to read Service Worker cache:", e);
    }
    
    setCacheState({
      hasServiceWorker: hasSW,
      cachedCount: count,
      isChecking: false
    });
  }, []);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateCacheStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      updateCacheStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    updateCacheStatus();

    // Check periodically for changes
    const interval = setInterval(updateCacheStatus, 8000);

    // Listen to potential service worker messages or changes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', updateCacheStatus);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', updateCacheStatus);
      }
    };
  }, [updateCacheStatus]);

  const navItems = [
    { id: "landing", label: "Beranda", icon: Home },
    { id: "shop", label: "Toko Online", icon: Store },
    { id: "consult", label: "Konsultasi Team BBS", icon: Sparkles },
    { id: "rfq", label: "Buat RFQ", icon: ShoppingCart, badge: rfqCartCount > 0 ? rfqCartCount : undefined },
    { id: "contact", label: "Kontak", icon: Mail },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/10 shadow-lg" id="main_navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand & Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center cursor-pointer" onClick={() => handleNavClick("landing")}>
              <div className="flex-shrink-0 flex items-center space-x-3">
                {/* Visual design resembling the uploaded BBS logo */}
                <div className="flex items-center space-x-2 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                  {/* "BBS." Block */}
                  <div className="flex items-baseline font-sans font-black text-xl tracking-tighter text-white select-none">
                    <span>BBS</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 ml-0.5 shadow-[0_0_8px_#f59e0b]" />
                  </div>
                  {/* Vertical separator */}
                  <div className="h-4 w-[1px] bg-white/15" />
                  {/* "Berkah Bintang Solusindo" Stacked */}
                  <div className="flex flex-col leading-tight">
                    <span className="font-sans font-extrabold text-[10px] text-white tracking-wide uppercase">
                      Berkah Bintang
                    </span>
                    <span className="font-sans font-bold text-[9px] text-slate-400 uppercase tracking-wider">
                      Solusindo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav_btn_${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? "text-white bg-white/10 border border-white/10 shadow-inner backdrop-blur-md" 
                      : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 ring-slate-900 ${
                      item.id === "rfq" && isBudgetExceeded
                        ? "bg-rose-500 shadow-rose-500/50 animate-bounce"
                        : "bg-indigo-500 shadow-indigo-500/30 animate-pulse"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.id === "rfq" && isBudgetExceeded && (
                    <span className="ml-1 text-rose-400 animate-pulse" title="Anggaran Melampaui Batas!">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
              id="mobile_menu_toggle"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/90 backdrop-blur-lg border-b border-white/10 animate-fadeIn" id="mobile_menu">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile_nav_btn_${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive 
                      ? "text-white bg-white/10 border border-white/10" 
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {item.id === "rfq" && isBudgetExceeded && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse">
                        <AlertTriangle className="h-3 w-3" />
                        <span>OVER BUDGET</span>
                      </span>
                    )}
                  </div>
                  {item.badge !== undefined && (
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                      item.id === "rfq" && isBudgetExceeded
                        ? "bg-rose-500 animate-pulse"
                        : "bg-indigo-500"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
