import React from "react";
import { 
  Laptop, 
  ShoppingCart, 
  Sparkles, 
  Settings, 
  FileText, 
  Home,
  Menu,
  X
} from "lucide-react";
import { CompanySettings } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  rfqCartCount: number;
  settings: CompanySettings;
}

export default function Navbar({ currentTab, setCurrentTab, rfqCartCount, settings }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: "landing", label: "Beranda", icon: Home },
    { id: "consult", label: "Asisten AI", icon: Sparkles },
    { id: "rfq", label: "Buat RFQ", icon: ShoppingCart, badge: rfqCartCount > 0 ? rfqCartCount : undefined },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/10 shadow-lg" id="main_navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavClick("landing")}>
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-lg shadow-lg shadow-indigo-500/20 text-white">
                <Laptop className="h-6 w-6 animate-pulse" id="logo_icon" />
              </div>
              <div>
                <span className="font-sans font-extrabold text-lg tracking-tight text-white block leading-tight border border-[#f32323] px-2 py-0.5 rounded-lg">
                  Berkah Bintang <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Solusindo</span>
                </span>
                <span className="font-mono text-[9px] text-slate-400 block uppercase tracking-[0.15em] font-medium mt-0.5">
                  IT & Procurement Solutions
                </span>
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
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-md shadow-indigo-500/30 ring-2 ring-slate-900 animate-pulse">
                      {item.badge}
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
                  </div>
                  {item.badge !== undefined && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shadow-sm">
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
