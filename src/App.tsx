import React, { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { 
  Laptop, 
  ShoppingCart, 
  Sparkles, 
  Settings, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Check, 
  AlertCircle, 
  X, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Download, 
  Printer, 
  ArrowRight, 
  Lock,
  Search,
  Building,
  User,
  Filter,
  RefreshCw,
  Award
} from "lucide-react";
import Navbar from "./components/Navbar";
import { SERVICE_OFFERINGS, PRODUCT_CATALOG } from "./data";
import { 
  CompanySettings, 
  RFQ, 
  Quotation, 
  ProductItem, 
  RFQItem, 
  ConsultMessage 
} from "./types";

// Dynamic Icon Component for rendering dynamic icons from data safely
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className} />;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("landing");
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "Berkah Bintang Solusindo",
    tagline: "Solusi Teknologi Informasi dan Pengadaan Terpercaya",
    description: "Melayani kebutuhan pengadaan perangkat IT, infrastruktur jaringan, server, CCTV, software, maintenance, serta konsultasi teknologi informasi untuk perusahaan, instansi pemerintah, pendidikan, dan UMKM.",
    address: "Grand Slipi Tower Lt. 18, Jl. S. Parman Kav 22, Slipi, Palmerah, Jakarta Barat, DKI Jakarta 11480",
    whatsapp: "+6281234567890",
    email: "bbscom993@gmail.com",
    website: "www.berkahbintangsolusindo.com",
    workingHours: "Senin - Jumat: 08:30 - 17:30 WIB",
    logoText: "BBS",
    bankAccount: {
      bankName: "Bank Mandiri",
      accountNumber: "123-45-67890-1",
      accountHolder: "PT Berkah Bintang Solusindo"
    }
  });

  // State Management
  const [rfqCart, setRfqCart] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [customCartItems, setCustomCartItems] = useState<RFQItem[]>([]);
  
  // Custom item adding inputs
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemDesc, setCustomItemDesc] = useState("");

  // API Lists
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  
  // Loading & status flags
  const [loading, setLoading] = useState(false);
  const [submittingRfq, setSubmittingRfq] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [generatingQuoteId, setGeneratingQuoteId] = useState<string | null>(null);
  
  // Toasts
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Client RFQ Form Inputs
  const [rfqForm, setRfqForm] = useState({
    clientName: "",
    companyName: "",
    whatsapp: "",
    email: "",
    address: "",
    clientCategory: "perusahaan" as "perusahaan" | "pemerintah" | "pendidikan" | "umkm",
    customRequirements: ""
  });

  // Admin Portal Auth (just a simple lock to simulate security)
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"rfqs" | "quotations" | "settings">("rfqs");

  // Selection for detailed viewing
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [successRfqNumber, setSuccessRfqNumber] = useState<string | null>(null);

  // Chat History
  const [chatMessages, setChatMessages] = useState<ConsultMessage[]>([
    {
      role: "model",
      text: "Halo! Selamat datang di Berkah Bintang Solusindo (BBS). Saya adalah Asisten Konsultan IT Anda. Ada kebutuhan perangkat keras, server, instalasi jaringan, sistem CCTV, atau kontrak maintenance yang bisa saya bantu rekomendasikan hari ini?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Product Catalog search
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Semua");

  // Fetch initial data
  useEffect(() => {
    fetchSettings();
    fetchRfqs();
    fetchQuotations();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchRfqs = async () => {
    try {
      const res = await fetch("/api/rfqs");
      if (res.ok) {
        const data = await res.json();
        setRfqs(data);
      }
    } catch (err) {
      console.error("Failed to fetch rfqs", err);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch("/api/quotations");
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      }
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    }
  };

  const updateSettings = async (updated: CompanySettings) => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        showToast("Pengaturan perusahaan berhasil disimpan!", "success");
      } else {
        showToast("Gagal menyimpan pengaturan", "error");
      }
    } catch (err) {
      showToast("Koneksi API bermasalah", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add Product Catalog Item to RFQ Cart
  const addToCart = (product: ProductItem) => {
    const existing = rfqCart.find(item => item.product.id === product.id);
    if (existing) {
      setRfqCart(rfqCart.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setRfqCart([...rfqCart, { product, quantity: 1 }]);
    }
    showToast(`"${product.name}" berhasil ditambahkan ke keranjang RFQ!`, "success");
  };

  // Adjust standard cart quantity
  const updateCartQty = (productId: string, delta: number) => {
    setRfqCart(rfqCart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    }));
  };

  // Remove standard item from cart
  const removeFromCart = (productId: string) => {
    setRfqCart(rfqCart.filter(item => item.product.id !== productId));
    showToast("Item dihapus dari keranjang.", "info");
  };

  // Add a Custom Custom Item not in Catalog
  const addCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) {
      showToast("Nama item custom tidak boleh kosong", "error");
      return;
    }
    const newItem: RFQItem = {
      name: customItemName.trim(),
      quantity: customItemQty,
      description: customItemDesc.trim() || undefined
    };
    setCustomCartItems([...customCartItems, newItem]);
    setCustomItemName("");
    setCustomItemQty(1);
    setCustomItemDesc("");
    showToast("Item custom ditambahkan ke keranjang!", "success");
  };

  const removeCustomItem = (index: number) => {
    setCustomCartItems(customCartItems.filter((_, i) => i !== index));
    showToast("Item custom dihapus.", "info");
  };

  // Submit Final RFQ Form
  const submitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (rfqCart.length === 0 && customCartItems.length === 0) {
      showToast("Keranjang RFQ Anda masih kosong. Silakan tambahkan barang terlebih dahulu.", "error");
      return;
    }
    if (!rfqForm.clientName.trim() || !rfqForm.whatsapp.trim() || !rfqForm.email.trim() || !rfqForm.address.trim()) {
      showToast("Mohon isi lengkap Nama Klien, No WhatsApp, Email, dan Alamat Pengiriman.", "error");
      return;
    }

    setSubmittingRfq(true);

    // Prepare items list
    const items: RFQItem[] = [
      ...rfqCart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        description: item.product.description
      })),
      ...customCartItems
    ];

    const payload = {
      clientName: rfqForm.clientName.trim(),
      companyName: rfqForm.companyName.trim() || undefined,
      whatsapp: rfqForm.whatsapp.trim(),
      email: rfqForm.email.trim(),
      address: rfqForm.address.trim(),
      clientCategory: rfqForm.clientCategory,
      items,
      customRequirements: rfqForm.customRequirements.trim() || undefined
    };

    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdRfq = await res.json();
        setSuccessRfqNumber(createdRfq.rfqNumber);
        
        // Clear forms & cart
        setRfqCart([]);
        setCustomCartItems([]);
        setRfqForm({
          clientName: "",
          companyName: "",
          whatsapp: "",
          email: "",
          address: "",
          clientCategory: "perusahaan",
          customRequirements: ""
        });
        
        // Refresh admin lists in background
        fetchRfqs();
        showToast("RFQ Anda berhasil dikirimkan!", "success");
      } else {
        showToast("Gagal mengirim RFQ, silakan coba lagi.", "error");
      }
    } catch (err) {
      showToast("Gagal menghubungkan ke server.", "error");
    } finally {
      setSubmittingRfq(false);
    }
  };

  // AI Chat Bot Consult Submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ConsultMessage = {
      role: "user",
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatbotLoading(true);

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, text: m.text }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          role: "model",
          text: data.text,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }]);
      } else {
        showToast("Gagal mendapatkan saran AI", "error");
      }
    } catch (err) {
      showToast("Kesalahan jaringan chatbot", "error");
    } finally {
      setChatbotLoading(false);
    }
  };

  // Suggest prompt button clicked
  const sendChatSuggestion = (text: string) => {
    setChatInput(text);
  };

  // Generate Quotation from RFQ using AI
  const generateQuotationWithAI = async (rfqId: string) => {
    setGeneratingQuoteId(rfqId);
    showToast("Menggunakan kecerdasan buatan Gemini AI untuk merancang penawaran spesifikasi & harga terbaik...", "info");
    try {
      const res = await fetch("/api/generate-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfqId })
      });

      if (res.ok) {
        const quotation = await res.json();
        // Refresh RFQs and Quotations
        await fetchRfqs();
        await fetchQuotations();
        setSelectedQuotation(quotation); // Open generated quotation modal instantly!
        showToast("Penawaran Harga Resmi berhasil di-generate secara otomatis oleh AI!", "success");
      } else {
        showToast("Gagal men-generate penawaran AI", "error");
      }
    } catch (err) {
      showToast("Gagal menghubungi server", "error");
    } finally {
      setGeneratingQuoteId(null);
    }
  };

  // Admin login simulation
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "admin" || adminPassword === "admin123" || adminPassword === "") {
      setAdminAuthenticated(true);
      showToast("Berhasil login ke Portal Admin BBS!", "success");
    } else {
      showToast("Password salah! (Gunakan password kosong atau 'admin')", "error");
    }
  };

  // Format currency helpers
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(value);
  };

  // Filter products catalog
  const filteredProducts = PRODUCT_CATALOG.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                        product.description.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchCat = catalogCategory === "Semua" || product.category === catalogCategory;
    return matchSearch && matchCat;
  });

  const uniqueCategories = ["Semua", ...Array.from(new Set(PRODUCT_CATALOG.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 relative flex flex-col selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-100px] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[30%] w-[450px] h-[450px] bg-indigo-800/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Navbar */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        rfqCartCount={rfqCart.length + customCartItems.length}
        settings={settings}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl ${
            toast.type === "success" 
              ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300" 
              : toast.type === "error"
              ? "bg-red-950/80 border-red-500/30 text-red-300"
              : "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
          }`}>
            {toast.type === "success" ? (
              <div className="p-1 bg-emerald-500/20 rounded-full"><Check className="h-4 w-4 text-emerald-400" /></div>
            ) : (
              <div className="p-1 bg-red-500/20 rounded-full"><AlertCircle className="h-4 w-4 text-red-400" /></div>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* TAB CONTENT CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* ==================================== */}
        {/* TAB 1: LANDING PAGE                  */}
        {/* ==================================== */}
        {currentTab === "landing" && (
          <div className="space-y-16 animate-fadeIn">
            
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
              {/* Left Column Text */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
                  <Award className="h-3 w-3 text-indigo-400" />
                  <span>Mitra Solusi IT Terpercaya & Legal</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  Solusi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Teknologi Informasi</span> & Pengadaan Handal
                </h1>
                
                <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                  {settings.description} Kami menyuplai hardware orisinil, instalasi jaringan fiber/LAN, setting server, security system, hingga maintenance dengan SLA tinggi.
                </p>

                {/* Quick Quality Check list */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
                    <span>Produk Original Bergaransi</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
                    <span>Tim Teknisi Sertifikasi</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
                    <span>Harga Kompetitif & Transparan</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
                    <span>SLA Respon Purna Jual Cepat</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => setCurrentTab("rfq")}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center space-x-2 text-base cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Buat Request RFQ</span>
                  </button>
                  <button 
                    onClick={() => setCurrentTab("consult")}
                    className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl font-bold backdrop-blur-sm transition-all duration-300 flex items-center justify-center space-x-2 text-base cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <span>Konsultasi Asisten AI</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Visual Preview Dashboard Mockup */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="w-full max-w-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                  {/* Decorative corner glow */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl"></div>
                  
                  {/* Mock window control buttons */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                      <span className="ml-2 text-xs font-mono text-slate-500">portal-bbs-estimator-v2.0.sh</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 bg-white/5 rounded-md border border-white/5 text-indigo-400 font-bold">
                      BBS Engine Live
                    </span>
                  </div>

                  {/* Mock stats blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Estimasi Penawaran AI</p>
                        <h3 className="text-2xl font-bold mt-1 text-white">Instant <span className="text-xs text-indigo-400 font-medium">via Gemini</span></h3>
                      </div>
                      <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20"><Sparkles className="h-5 w-5 text-indigo-400" /></div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Tingkat Akurasi Spesifikasi</p>
                        <h3 className="text-2xl font-bold mt-1 text-white">100% <span className="text-xs text-emerald-400 font-medium">Original</span></h3>
                      </div>
                      <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Check className="h-5 w-5 text-emerald-400" /></div>
                    </div>
                  </div>

                  {/* Mock Workflow Steps */}
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider font-bold px-1">Cara Kerja Pengadaan Kami:</p>
                    
                    <div className="flex items-start gap-3 p-3 bg-indigo-500/5 border border-indigo-500/25 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">1</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-200">Klien Mengajukan RFQ (Kebutuhan Barang/Jasa)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Klien memilih dari katalog atau input spek kustom di tab "Buat RFQ".</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 font-bold text-xs">2</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-200">Gemini AI Memproses & Merancang Quotation</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Sistem secara instan menganalisis, memilih model brand terbaik, dan menyusun harga.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 font-bold text-xs">3</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-200">Surat Penawaran Resmi Diterbitkan & Dikirim</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Admin menyetujui draft komersil, mengunduh PDF, dan melayani negosiasi.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Grid (Layanan Utama) */}
            <div className="space-y-8 pt-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  Solusi End-to-End
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Layanan Utama Kami</h2>
                <p className="text-slate-400 text-sm">
                  Menawarkan portofolio solusi teknologi informasi dan pengadaan komprehensif yang dirancang khusus untuk memajukan instansi Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SERVICE_OFFERINGS.map((srv) => (
                  <div 
                    key={srv.id}
                    className="p-6 bg-slate-900/30 border border-white/5 hover:border-indigo-500/30 rounded-2xl backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute -right-8 -top-8 w-20 h-20 bg-indigo-500/10 rounded-full blur-lg group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="space-y-4 relative z-10">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl inline-block group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                        <DynamicIcon name={srv.icon} className="h-6 w-6" />
                      </div>
                      <h3 className="font-extrabold text-lg text-white group-hover:text-indigo-300 transition-colors">{srv.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{srv.description}</p>
                      
                      {/* Key Features bullets */}
                      <ul className="space-y-1.5 pt-2 border-t border-white/5">
                        {srv.features.slice(0, 2).map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                            <span className="text-indigo-400 font-bold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <button 
                      onClick={() => setCurrentTab("rfq")}
                      className="mt-6 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 hover:space-x-2 transition-all self-start"
                    >
                      <span>Minta Pengadaan</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Catalog Showcase */}
            <div className="space-y-8 pt-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Katalog Acuan Pengadaan
                  </div>
                  <h2 className="text-3xl font-extrabold text-white">Produk & Perangkat IT Populer</h2>
                  <p className="text-slate-400 text-sm mt-1">Pilih perangkat berkualitas langsung di bawah ini untuk dimasukkan ke daftar RFQ Anda.</p>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari barang..." 
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-56 text-slate-100"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-900/60 border border-white/10 rounded-xl p-1 overflow-x-auto max-w-full">
                    {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCatalogCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          catalogCategory === cat 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group"
                  >
                    <div>
                      {/* Product Image */}
                      {prod.image && (
                        <div className="w-full h-36 rounded-xl overflow-hidden mb-4 relative bg-slate-950 border border-white/5">
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Product Card Top */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-semibold">
                          {prod.category}
                        </span>
                        <div className="p-2 bg-white/5 rounded-lg text-slate-400 border border-white/5">
                          <DynamicIcon name={prod.icon} className="h-5 w-5" />
                        </div>
                      </div>

                      <h4 className="font-bold text-white text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">{prod.name}</h4>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{prod.description}</p>
                      
                      <div className="mt-3 py-1 px-2 rounded bg-indigo-500/5 border border-indigo-500/10 inline-block">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Estimasi Rentang Harga</span>
                        <span className="text-xs font-bold text-amber-400">{prod.estimatedPriceRange}</span>
                      </div>

                      {/* Specs snippet */}
                      <div className="mt-4 space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Spesifikasi Utama:</p>
                        {prod.specifications.slice(0, 3).map((spec, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                            <span className="line-clamp-1">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add to RFQ Button */}
                    <button 
                      onClick={() => addToCart(prod)}
                      className="mt-6 w-full py-2.5 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 text-white hover:text-white rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Masukkan Keranjang RFQ</span>
                    </button>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center">
                    <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                    <h5 className="font-bold text-slate-300">Tidak ada produk ditemukan</h5>
                    <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau kategori Anda.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Consultation Banner */}
            <div className="p-8 sm:p-10 bg-gradient-to-r from-indigo-950/80 to-cyan-950/60 border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="space-y-3 max-w-xl text-center md:text-left">
                <div className="inline-block px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono rounded-md uppercase tracking-widest font-bold">
                  BBS AI CONSULTANT
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Bingung Spesifikasi Perangkat yang Dibutuhkan?</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Konsultasikan gratis dengan AI Assistant khusus kami. Kami merekomendasikan tipe processor, jumlah access point wifi, sudut pandang CCTV, lisensi software, serta kalkulasi penawaran.
                </p>
              </div>

              <button 
                onClick={() => setCurrentTab("consult")}
                className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold shadow-lg transition-all flex items-center space-x-2 shrink-0 cursor-pointer transform hover:scale-[1.02]"
              >
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span>Mulai Konsultasi AI</span>
              </button>
            </div>

            {/* Footer / Info Kontak */}
            <footer className="pt-8 border-t border-white/10 text-slate-400">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
                <div className="space-y-4 col-span-1 md:col-span-2">
                  <h4 className="font-bold text-white text-base">{settings.companyName}</h4>
                  <p className="text-xs leading-relaxed max-w-sm">{settings.description}</p>
                  <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                    <MapPin className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider">Kontak & Jam Kerja</h5>
                  <div className="space-y-2 text-xs">
                    <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 transition-colors">
                      <Phone className="h-4 w-4 text-indigo-400" />
                      <span>{settings.whatsapp} (WhatsApp)</span>
                    </a>
                    <a href={`mailto:${settings.email}`} className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 transition-colors">
                      <Mail className="h-4 w-4 text-indigo-400" />
                      <span>{settings.email}</span>
                    </a>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>{settings.workingHours}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider">Navigasi Cepat</h5>
                  <div className="flex flex-col space-y-2 text-xs">
                    <button onClick={() => setCurrentTab("landing")} className="text-left text-slate-300 hover:text-indigo-400 transition-colors">Halaman Beranda</button>
                    <button onClick={() => setCurrentTab("consult")} className="text-left text-slate-300 hover:text-indigo-400 transition-colors">Konsultasi AI</button>
                    <button onClick={() => setCurrentTab("rfq")} className="text-left text-slate-300 hover:text-indigo-400 transition-colors">Buat Penawaran RFQ</button>
                    <button onClick={() => setCurrentTab("admin")} className="text-left text-slate-300 hover:text-indigo-400 transition-colors">Portal Manajemen Admin</button>
                  </div>
                </div>
              </div>

              <div className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} {settings.companyName}. Hak Cipta Dilindungi. Solusi Infrastruktur IT & Pengadaan Handal.
              </div>
            </footer>

          </div>
        )}

        {/* ==================================== */}
        {/* TAB 2: AI CONSULTATION CHATBOT        */}
        {/* ==================================== */}
        {currentTab === "consult" && (
          <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span>Teknologi Gemini Generative AI</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">Asisten Konsultan Procurement IT</h2>
              <p className="text-slate-400 text-sm mt-1">
                Tanyakan rekomendasi spesifikasi, perancangan topologi jaringan LAN, jumlah titik CCTV ideal, atau penyusunan anggaran pengadaan kantor Anda secara instan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[580px]">
              
              {/* Left Column: Quick Prompts List */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-white/10 pb-2 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Inspirasi Konsultasi</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Pilih topik cepat di bawah ini untuk didiskusikan langsung dengan AI:</p>
                  
                  <div className="space-y-2.5">
                    <button 
                      onClick={() => sendChatSuggestion("Rekomendasikan spesifikasi komputer kantor standar administrasi dan laptop bisnis direktur beserta estimasi budgetnya.")}
                      className="w-full p-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all duration-200 leading-relaxed"
                    >
                      💻 <strong>Laptop & PC Bisnis</strong>
                      <span className="block text-[10px] text-slate-500 mt-1">Minta rekomendasi brand, RAM, SSD, & processor.</span>
                    </button>

                    <button 
                      onClick={() => sendChatSuggestion("Kami memiliki kantor 2 lantai dengan luas 200m2 dan 35 karyawan. Berapa jumlah Access Point Wifi dan tipe Switch manageable Mikrotik yang paling ideal?")}
                      className="w-full p-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all duration-200 leading-relaxed"
                    >
                      🌐 <strong>Rancangan Jaringan LAN</strong>
                      <span className="block text-[10px] text-slate-500 mt-1">Estimasi AP Wifi Ubiquiti / Router Mikrotik.</span>
                    </button>

                    <button 
                      onClick={() => sendChatSuggestion("Berapa biaya pengadaan CCTV 8 titik IP camera Hikvision lengkap dengan NVR, Harddisk khusus surveillance, dan instalasi kabel konduit rapi?")}
                      className="w-full p-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all duration-200 leading-relaxed"
                    >
                      🛡️ <strong>Kebutuhan CCTV & Security</strong>
                      <span className="block text-[10px] text-slate-500 mt-1">Detail IP Cam dome indoor vs outdoor.</span>
                    </button>

                    <button 
                      onClick={() => sendChatSuggestion("Bagaimana skema kontrak SLA Maintenance rutin untuk perawatan 15 PC dan 1 Server kantor? Apa saja layanan purna jual yang didapatkan?")}
                      className="w-full p-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all duration-200 leading-relaxed"
                    >
                      🔧 <strong>Kontrak Maintenance & SLA</strong>
                      <span className="block text-[10px] text-slate-500 mt-1">Skema pembersihan fisik, backup, remote support.</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-2">
                  <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Langkah Selanjutnya?</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Jika spesifikasi yang disarankan AI sudah sesuai, silakan masuk ke tab <strong>"Buat RFQ"</strong> untuk mengirimkan data permintaan resmi agar tim sales kami memproses penawaran harga formal.
                  </p>
                </div>
              </div>

              {/* Right Column: Active Interactive Chatbox */}
              <div className="lg:col-span-8 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
                
                {/* Chatbox Top Header */}
                <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                      </div>
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Procurement Consultant</h4>
                      <p className="text-[10px] text-slate-400">Berkah Bintang Solusindo Expert System</p>
                    </div>
                  </div>
                  
                  {/* Clear button */}
                  <button 
                    onClick={() => setChatMessages([
                      {
                        role: "model",
                        text: "Halo! Selamat datang di Berkah Bintang Solusindo (BBS). Saya adalah Asisten Konsultan IT Anda. Ada kebutuhan perangkat keras, server, instalasi jaringan, sistem CCTV, atau kontrak maintenance yang bisa saya bantu rekomendasikan hari ini?",
                        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      }
                    ])}
                    className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
                  >
                    Bersihkan Chat
                  </button>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[400px] min-h-[350px]">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                        msg.role === "user" 
                          ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/15 border border-indigo-500/30" 
                          : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-none"
                      }`}>
                        {/* Message body text */}
                        <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                        
                        {/* Metadata line */}
                        <div className={`text-[9px] mt-2 block ${msg.role === "user" ? "text-indigo-200" : "text-slate-500"} text-right`}>
                          {msg.role === "user" ? "Anda" : "BBS Assistant"} &bull; {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing/Loader Indicator */}
                  {chatbotLoading && (
                    <div className="flex justify-start items-center space-x-2 p-3 bg-white/5 border border-white/5 rounded-xl max-w-[120px] animate-pulse">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                      <span className="text-[11px] text-slate-400 font-medium">BBS Mengetik...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Send Chat Form */}
                <form onSubmit={handleChatSubmit} className="p-4 bg-white/5 border-t border-white/10 flex items-center space-x-3">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ketik pertanyaan konsultasi Anda di sini..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                    disabled={chatbotLoading}
                  />
                  <button
                    type="submit"
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                    disabled={chatbotLoading}
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>

              </div>

            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* TAB 3: CLIENT RFQ SUBMISSION PANEL   */}
        {/* ==================================== */}
        {currentTab === "rfq" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header banner */}
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <ShoppingCart className="h-3 w-3 text-indigo-400" />
                <span>Pengisian Request For Quote</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">Buat Dokumen Permintaan Penawaran (RFQ)</h2>
              <p className="text-slate-400 text-sm mt-1">
                Kirimkan rincian kebutuhan perangkat keras, software, cctv, atau jasa maintenance Anda. Tim kami dibantu AI akan langsung menerbitkan Surat Penawaran Harga resmi.
              </p>
            </div>

            {/* If successfully submitted an RFQ, show success card */}
            {successRfqNumber && (
              <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-5 backdrop-blur-xl animate-scaleUp">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-white">Permintaan Penawaran Berhasil Dikirim!</h3>
                  <p className="text-slate-400 text-sm">
                    Terima kasih telah mempercayakan kebutuhan IT Anda kepada Berkah Bintang Solusindo. RFQ Anda telah direkam dalam database aman kami dengan kode:
                  </p>
                  <div className="inline-block px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-lg font-bold rounded-xl mt-2 tracking-wide">
                    {successRfqNumber}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Selanjutnya, Anda dapat masuk ke <strong>Portal Admin</strong> di menu navigasi atas untuk melihat daftar RFQ, lalu men-generate <strong>Surat Penawaran Harga Resmi (Quotation)</strong> secara instan dengan kecerdasan buatan Gemini AI.
                </p>

                <div className="flex justify-center space-x-4 pt-3">
                  <button 
                    onClick={() => {
                      setSuccessRfqNumber(null);
                      setCurrentTab("landing");
                    }}
                    className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Kembali Ke Beranda
                  </button>
                  <button 
                    onClick={() => {
                      setSuccessRfqNumber(null);
                      setCurrentTab("admin");
                      setActiveAdminSubTab("rfqs");
                    }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
                  >
                    <span>Buka Portal Admin</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {!successRfqNumber && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: RFQ Cart list */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Cart Items Card */}
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                        <ShoppingCart className="h-5 w-5 text-indigo-400" />
                        <span>Keranjang Pengadaan ({rfqCart.length + customCartItems.length})</span>
                      </h3>
                      {rfqCart.length > 0 || customCartItems.length > 0 ? (
                        <button 
                          onClick={() => { setRfqCart([]); setCustomCartItems([]); }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Kosongkan
                        </button>
                      ) : null}
                    </div>

                    {/* Standard items catalog list */}
                    {rfqCart.length > 0 || customCartItems.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {/* Standard Catalog items added */}
                        {rfqCart.map((item) => (
                          <div 
                            key={item.product.id}
                            className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl group hover:border-indigo-500/20 transition-colors"
                          >
                            <div className="space-y-1 pr-3">
                              <h5 className="font-bold text-xs text-white leading-tight">{item.product.name}</h5>
                              <p className="text-[10px] text-slate-500">{item.product.category}</p>
                            </div>

                            <div className="flex items-center space-x-3.5">
                              {/* Quantity selectors */}
                              <div className="flex items-center space-x-1 bg-slate-950 border border-white/5 rounded-lg p-0.5">
                                <button 
                                  onClick={() => updateCartQty(item.product.id, -1)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold text-slate-200 px-1.5 font-mono">{item.quantity}</span>
                                <button 
                                  onClick={() => updateCartQty(item.product.id, 1)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button 
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/15"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Custom Items added */}
                        {customCartItems.map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl"
                          >
                            <div className="space-y-1 pr-3">
                              <h5 className="font-bold text-xs text-indigo-300 leading-tight flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                <span>{item.name}</span>
                              </h5>
                              <p className="text-[10px] text-slate-500 line-clamp-1">{item.description || "Item Kustom Khusus"}</p>
                            </div>

                            <div className="flex items-center space-x-3.5">
                              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg font-mono">
                                Qty: {item.quantity}
                              </span>

                              <button 
                                onClick={() => removeCustomItem(index)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/15"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-2">
                        <ShoppingCart className="h-8 w-8 text-slate-600 mx-auto" />
                        <h5 className="font-bold text-slate-400 text-xs">Belum ada barang di keranjang</h5>
                        <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                          Silakan tambahkan barang dari <strong>Katalog Acuan</strong> di Halaman Beranda, atau masukkan item custom di bawah ini.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Custom Item Manual Box */}
                  <form onSubmit={addCustomItem} className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center space-x-1.5">
                      <Plus className="h-4 w-4 text-indigo-400" />
                      <span>Input Barang / Jasa Custom</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Butuh barang atau jasa integrasi khusus yang tidak tercantum di katalog? Tuliskan spesifikasinya secara manual:
                    </p>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Nama Item/Jasa</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Pengadaan Fiber Optic Singlemode 12 Core" 
                          value={customItemName}
                          onChange={(e) => setCustomItemName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Jumlah (Unit)</label>
                          <input 
                            type="number" 
                            min="1"
                            value={customItemQty}
                            onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-bold font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Rincian Deskripsi/Spek (Opsional)</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Brand Belden, penarikan kabel 150 meter" 
                            value={customItemDesc}
                            onChange={(e) => setCustomItemDesc(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Masukkan Item Custom</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Column: Submission Client Metadata Form */}
                <div className="lg:col-span-7">
                  <form onSubmit={submitRFQ} className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-6">
                    <h3 className="font-extrabold text-white text-lg border-b border-white/10 pb-3 flex items-center space-x-2">
                      <Building className="h-5.5 w-5.5 text-indigo-400" />
                      <span>Formulir Informasi & Pengiriman Klien</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Nama Kontak Klien <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Nama penanggung jawab"
                            value={rfqForm.clientName}
                            onChange={(e) => setRfqForm({ ...rfqForm, clientName: e.target.value })}
                            className="pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 w-full font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Nama Perusahaan / Instansi (Opsional)</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="PT. / CV. / Universitas / Dinas"
                            value={rfqForm.companyName}
                            onChange={(e) => setRfqForm({ ...rfqForm, companyName: e.target.value })}
                            className="pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 w-full font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">No WhatsApp (Aktif) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Contoh: 0812XXXXXXXX"
                            value={rfqForm.whatsapp}
                            onChange={(e) => setRfqForm({ ...rfqForm, whatsapp: e.target.value })}
                            className="pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 w-full font-semibold font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Alamat Email Resmi <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input 
                            type="email" 
                            placeholder="Contoh: procurement@instansi.com"
                            value={rfqForm.email}
                            onChange={(e) => setRfqForm({ ...rfqForm, email: e.target.value })}
                            className="pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 w-full font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Kategori Klien <span className="text-red-500">*</span></label>
                        <select
                          value={rfqForm.clientCategory}
                          onChange={(e) => setRfqForm({ ...rfqForm, clientCategory: e.target.value as any })}
                          className="px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 w-full font-medium appearance-none"
                        >
                          <option value="perusahaan">Perusahaan Swasta</option>
                          <option value="pemerintah">Instansi Pemerintah</option>
                          <option value="pendidikan">Lembaga Pendidikan</option>
                          <option value="umkm">UMKM / Individu</option>
                        </select>
                      </div>

                      <div className="sm:col-span-8">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Alamat Lengkap Pengiriman <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                          <textarea 
                            rows={1}
                            placeholder="Detail gedung, lantai, jalan, kota, dan kode pos"
                            value={rfqForm.address}
                            onChange={(e) => setRfqForm({ ...rfqForm, address: e.target.value })}
                            className="pl-10 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 w-full h-[38px] resize-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Kebutuhan Khusus / Persyaratan Lain (Opsional)</label>
                      <textarea 
                        rows={3}
                        placeholder="Contoh: Butuh penawaran dalam 2 hari, garansi diperpanjang jadi 2 tahun, atau menyertakan sertifikat pengujian keaslian."
                        value={rfqForm.customRequirements}
                        onChange={(e) => setRfqForm({ ...rfqForm, customRequirements: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                      />
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
                      <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Catatan Pajak & Legalitas:</strong> Untuk Kategori Klien <strong>Instansi Pemerintah</strong>, sistem AI kami akan otomatis memformulasikan PPN sebesar 11% sesuai peraturan Direktorat Jenderal Pajak RI. Seluruh transaksi didukung kuitansi sah PT Berkah Bintang Solusindo.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingRfq}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-indigo-950 disabled:to-indigo-950 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center space-x-2 text-base cursor-pointer transform hover:-translate-y-0.5"
                    >
                      {submittingRfq ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Sedang Mengirim RFQ...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Kirim Request RFQ Resmi</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ==================================== */}
        {/* TAB 4: ADMIN PORTAL WITH AI ENGINE   */}
        {/* ==================================== */}
        {currentTab === "admin" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <Lock className="h-3 w-3 text-indigo-400" />
                  <span>Sistem Manajemen Internal</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">Dashboard Portal Admin & Penawaran</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Kelola database permintaan RFQ klien, generate dokumen penawaran harga menggunakan Gemini AI, dan sesuaikan profil kredensial instansi.
                </p>
              </div>

              {adminAuthenticated && (
                <button
                  onClick={() => {
                    setAdminAuthenticated(false);
                    setAdminPassword("");
                    showToast("Berhasil logout dari Portal Admin.", "info");
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all self-start"
                >
                  Logout Admin
                </button>
              )}
            </div>

            {/* Simulated Auth Block */}
            {!adminAuthenticated && (
              <div className="max-w-md mx-auto py-12">
                <form onSubmit={handleAdminLogin} className="bg-slate-900/55 border border-white/10 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-indigo-500/15 border border-indigo-500/25 rounded-xl flex items-center justify-center mx-auto text-indigo-400 shadow-md">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Akses Terenkripsi Portal Admin</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sistem ini khusus untuk Direktur Pengadaan, Tim Sales, & Staff Procurement Berkah Bintang Solusindo.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Kata Sandi Akses</label>
                      <input 
                        type="password" 
                        placeholder="Masukkan password admin (Kosongkan / 'admin')"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 text-center"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Masuk Sistem</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-[10px] font-mono text-slate-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                      HINT: Tekan Masuk langsung (password kosong)
                    </span>
                  </div>
                </form>
              </div>
            )}

            {/* Authenticated Admin Dashboard Layout */}
            {adminAuthenticated && (
              <div className="space-y-6">
                
                {/* Internal Subtabs */}
                <div className="flex border-b border-white/10 gap-2">
                  <button
                    onClick={() => setActiveAdminSubTab("rfqs")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "rfqs" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="h-4.5 w-4.5" />
                    <span>Inquiry RFQ Masuk ({rfqs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminSubTab("quotations")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "quotations" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Award className="h-4.5 w-4.5" />
                    <span>Dokumen Penawaran Resmi ({quotations.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminSubTab("settings")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "settings" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Settings className="h-4.5 w-4.5" />
                    <span>Kredensial Perusahaan</span>
                  </button>
                </div>

                {/* ================================== */}
                {/* ADMIN T1: RFQs LIST                */}
                {/* ================================== */}
                {activeAdminSubTab === "rfqs" && (
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="font-extrabold text-white text-base">Database Request for Quote (RFQ) Klien</h4>
                      <button 
                        onClick={fetchRfqs}
                        className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Refresh Data</span>
                      </button>
                    </div>

                    {rfqs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
                              <th className="p-4">No RFQ</th>
                              <th className="p-4">Tanggal</th>
                              <th className="p-4">Info Klien</th>
                              <th className="p-4">Kategori</th>
                              <th className="p-4">Daftar Barang</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-center">Aksi / Penawaran AI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {rfqs.map((rfq) => (
                              <tr key={rfq.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-mono font-bold text-indigo-400">{rfq.rfqNumber}</td>
                                <td className="p-4 text-slate-300">{rfq.date}</td>
                                <td className="p-4">
                                  <div className="font-extrabold text-white text-xs">{rfq.clientName}</div>
                                  {rfq.companyName && <div className="text-[10px] text-slate-400 mt-0.5">{rfq.companyName}</div>}
                                  <div className="text-[10px] text-slate-500 font-mono mt-1">{rfq.whatsapp} | {rfq.email}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    rfq.clientCategory === "pemerintah" 
                                      ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
                                      : rfq.clientCategory === "pendidikan"
                                      ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                                      : rfq.clientCategory === "perusahaan"
                                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                                      : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                                  }`}>
                                    {rfq.clientCategory}
                                  </span>
                                </td>
                                <td className="p-4 max-w-xs">
                                  <div className="space-y-1">
                                    {rfq.items.map((it, idx) => (
                                      <div key={idx} className="text-[11px] text-slate-200 flex justify-between gap-2 bg-white/5 px-2 py-1 rounded">
                                        <span className="font-bold">{it.name}</span>
                                        <span className="text-amber-400 font-bold font-mono">x{it.quantity}</span>
                                      </div>
                                    ))}
                                    {rfq.customRequirements && (
                                      <div className="text-[10px] text-amber-300 italic line-clamp-1 mt-1">Req: {rfq.customRequirements}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    rfq.status === "quoted" 
                                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                                      : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                                  }`}>
                                    {rfq.status === "quoted" ? "Sudah Di-Quoted" : "Menunggu Proposal"}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {rfq.status === "quoted" ? (
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => {
                                          const quote = quotations.find(q => q.rfqId === rfq.id || q.id === rfq.generatedQuotationId);
                                          if (quote) {
                                            setSelectedQuotation(quote);
                                          } else {
                                            showToast("File surat penawaran tidak ditemukan", "error");
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/25 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-lg font-bold transition-all flex items-center space-x-1 cursor-pointer"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>Buka Surat Penawaran</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => generateQuotationWithAI(rfq.id)}
                                      disabled={generatingQuoteId !== null}
                                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-indigo-950 disabled:to-indigo-950 text-white rounded-xl font-bold transition-all shadow-md flex items-center space-x-1.5 mx-auto cursor-pointer"
                                    >
                                      {generatingQuoteId === rfq.id ? (
                                        <>
                                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                          <span>AI Menyusun...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                                          <span>Generate Proposal (AI)</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-slate-500 space-y-2">
                        <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                        <h5 className="font-bold text-slate-400">Belum ada inquiry RFQ masuk</h5>
                        <p className="text-xs text-slate-600">Pelanggan belum mengirimkan permintaan pengadaan apapun.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================== */}
                {/* ADMIN T2: QUOTATIONS LIST          */}
                {/* ================================== */}
                {activeAdminSubTab === "quotations" && (
                  <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="font-extrabold text-white text-base">Dokumen Penawaran Komersial Resmi (Quotations)</h4>
                      <button 
                        onClick={fetchQuotations}
                        className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Refresh Data</span>
                      </button>
                    </div>

                    {quotations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
                              <th className="p-4">No Penawaran</th>
                              <th className="p-4">Tanggal Terbit</th>
                              <th className="p-4">Masa Berlaku</th>
                              <th className="p-4">Rincian Nilai Barang (Subtotal)</th>
                              <th className="p-4">Pajak (PPN 11%)</th>
                              <th className="p-4">Total Penawaran</th>
                              <th className="p-4 text-center">Dokumen Cetak</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {quotations.map((quote) => (
                              <tr key={quote.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-mono font-bold text-amber-400">{quote.quotationNumber}</td>
                                <td className="p-4 text-slate-300">{quote.date}</td>
                                <td className="p-4 text-slate-400 font-mono">{quote.expiryDate}</td>
                                <td className="p-4 text-slate-200 font-bold font-mono">{formatRupiah(quote.subtotal)}</td>
                                <td className="p-4 text-red-400 font-mono">{formatRupiah(quote.tax)}</td>
                                <td className="p-4 text-emerald-400 font-extrabold font-mono text-xs">{formatRupiah(quote.total)}</td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => setSelectedQuotation(quote)}
                                    className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/25 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Tampilkan Lembar Cetak</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-slate-500 space-y-2">
                        <Award className="h-10 w-10 text-slate-600 mx-auto" />
                        <h5 className="font-bold text-slate-400">Belum ada Surat Penawaran terbit</h5>
                        <p className="text-xs text-slate-600">Klik "Generate Proposal (AI)" di tab Inquiry RFQ Masuk.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================== */}
                {/* ADMIN T3: SETTINGS PROFILE CONFIG  */}
                {/* ================================== */}
                {activeAdminSubTab === "settings" && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateSettings(settings);
                    }}
                    className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl"
                  >
                    <h3 className="font-extrabold text-white text-lg border-b border-white/10 pb-3 flex items-center space-x-2">
                      <Settings className="h-5.5 w-5.5 text-indigo-400" />
                      <span>Konfigurasi Kredensial Kop Surat & Invoice</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Nama Perusahaan Resmi</label>
                        <input 
                          type="text" 
                          value={settings.companyName}
                          onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Slogan / Tagline Perusahaan</label>
                        <input 
                          type="text" 
                          value={settings.tagline}
                          onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">No WhatsApp Kop Surat</label>
                        <input 
                          type="text" 
                          value={settings.whatsapp}
                          onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-mono font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Email Resmi Kop Surat</label>
                        <input 
                          type="email" 
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Alamat Kantor Resmi</label>
                        <textarea 
                          rows={2}
                          value={settings.address}
                          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Building className="h-4 w-4 text-indigo-400" />
                        <span>Kredensial Bank Untuk Pembayaran Termin</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Nama Bank</label>
                          <input 
                            type="text" 
                            value={settings.bankAccount.bankName}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              bankAccount: { ...settings.bankAccount, bankName: e.target.value } 
                            })}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">No Rekening</label>
                          <input 
                            type="text" 
                            value={settings.bankAccount.accountNumber}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              bankAccount: { ...settings.bankAccount, accountNumber: e.target.value } 
                            })}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-200 font-bold font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Atas Nama Rekening</label>
                          <input 
                            type="text" 
                            value={settings.bankAccount.accountHolder}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              bankAccount: { ...settings.bankAccount, accountHolder: e.target.value } 
                            })}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Simpan Kredensial Baru</span>
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* ==================================== */}
      {/* MODAL VIEW: PRINT QUOTATION SHEET    */}
      {/* ==================================== */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="quotation_sheet_modal">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-4xl p-6 sm:p-10 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto font-sans">
            
            {/* Modal Controls (Sticky on Top of Modal) */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-4 -mt-4 mb-6 border-b border-slate-100 flex items-center justify-between z-20">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                Kop Dokumen Resmi Berkah Bintang Solusindo
              </span>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border border-slate-200"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button 
                  onClick={() => setSelectedQuotation(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-all cursor-pointer border border-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Sheet Area */}
            <div className="space-y-6 text-xs sm:text-sm">
              
              {/* Kop Surat Header */}
              <div className="flex justify-between items-start border-b-4 border-double border-slate-900 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-lg flex items-center justify-center font-extrabold text-lg shadow">
                      BBS
                    </div>
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">{settings.companyName}</h1>
                      <p className="text-[10px] uppercase tracking-widest text-indigo-700 font-bold mt-1">{settings.tagline}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium max-w-md pt-2 leading-relaxed">
                    {settings.address} <br />
                    WhatsApp: {settings.whatsapp} | Email: {settings.email} | Web: {settings.website}
                  </p>
                </div>
                
                <div className="text-right space-y-1.5 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider">Penawaran Harga</h3>
                  <div className="font-mono text-[10px] text-slate-600">
                    <div>No: <span className="font-bold text-slate-900">{selectedQuotation.quotationNumber}</span></div>
                    <div>Tanggal: <span className="font-bold text-slate-900">{selectedQuotation.date}</span></div>
                    <div>Valid S.D: <span className="font-bold text-red-600">{selectedQuotation.expiryDate}</span></div>
                  </div>
                </div>
              </div>

              {/* Recipient / Client details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Kepada Yth. Klien:</span>
                  <div className="font-bold text-slate-900 text-base">
                    {rfqs.find(r => r.id === selectedQuotation.rfqId)?.clientName || "Bapak/Ibu Pimpinan"}
                  </div>
                  <div className="font-bold text-slate-700">
                    {rfqs.find(r => r.id === selectedQuotation.rfqId)?.companyName || "Instansi / Perusahaan Klien"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Kategori: <span className="uppercase font-bold text-slate-700">{rfqs.find(r => r.id === selectedQuotation.rfqId)?.clientCategory || "Umum"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Alamat Pengiriman & Kontak:</span>
                  <p className="text-xs text-slate-700 max-w-xs leading-relaxed">
                    {rfqs.find(r => r.id === selectedQuotation.rfqId)?.address || "Alamat klien pengiriman"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    WA: {rfqs.find(r => r.id === selectedQuotation.rfqId)?.whatsapp} | Email: {rfqs.find(r => r.id === selectedQuotation.rfqId)?.email}
                  </p>
                </div>
              </div>

              {/* Introductory text */}
              <p className="text-xs text-slate-700 leading-relaxed italic border-l-4 border-indigo-600 pl-4 bg-slate-50/50 py-2 rounded-r-lg">
                "{selectedQuotation.introductoryText}"
              </p>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 text-center w-12">No</th>
                      <th className="p-3">Nama Produk & Spesifikasi Teknis yang Ditawarkan</th>
                      <th className="p-3 text-center w-16">Qty</th>
                      <th className="p-3 text-right w-28">Harga Satuan</th>
                      <th className="p-3 text-right w-32">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedQuotation.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="p-3 space-y-1">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.specification && (
                            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed italic">
                              {item.specification}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800 font-mono">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-800 font-mono font-medium">{formatRupiah(item.unitPrice)}</td>
                        <td className="p-3 text-right text-slate-950 font-mono font-bold">{formatRupiah(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations Block */}
              <div className="flex justify-end pt-3">
                <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-1.5">
                    <span>Subtotal Barang:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedQuotation.subtotal)}</span>
                  </div>

                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 border-b border-slate-100 pb-1.5">
                      <span>Diskon Khusus:</span>
                      <span className="font-mono font-bold">- {formatRupiah(selectedQuotation.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-600 border-b border-slate-200 pb-1.5">
                    <span>PPN (11%):</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedQuotation.tax)}</span>
                  </div>

                  <div className="flex justify-between items-center text-base font-extrabold text-slate-900 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>TOTAL BILL:</span>
                    <span className="font-mono text-indigo-700">{formatRupiah(selectedQuotation.total)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="border-t border-slate-200 pt-5 space-y-2">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Syarat & Ketentuan Pengadaan (Term):</h4>
                <ol className="list-decimal pl-4 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  {selectedQuotation.termsAndConditions.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ol>
              </div>

              {/* Signatures & Bank Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100 items-end">
                <div className="space-y-2 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold block">Sistem Pembayaran Resmi:</span>
                  <div className="text-xs text-slate-700 font-medium">
                    <div>Bank Penerima: <strong className="text-slate-900">{settings.bankAccount.bankName}</strong></div>
                    <div>No Rekening: <strong className="text-indigo-700 font-mono font-bold text-sm block mt-0.5">{settings.bankAccount.accountNumber}</strong></div>
                    <div>Atas Nama: <strong className="text-slate-900">{settings.bankAccount.accountHolder}</strong></div>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight pt-1">
                    * Mohon sertakan nomor penawaran {selectedQuotation.quotationNumber} saat melakukan transfer termin / pelunasan.
                  </p>
                </div>

                <div className="text-center space-y-1 w-56 ml-auto relative">
                  {/* Mock BBS official stamp */}
                  <div className="absolute top-2 left-6 border-4 border-indigo-500/30 text-indigo-500/30 font-mono text-[11px] font-extrabold uppercase tracking-widest rounded-xl px-4 py-2 transform -rotate-12 select-none pointer-events-none">
                    BBS APPROVED
                  </div>
                  
                  <p className="text-slate-500 text-[10px] pb-12">Hormat Kami,<br /><strong>PT Berkah Bintang Solusindo</strong></p>
                  
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 text-xs">{selectedQuotation.adminSignature}</p>
                  <p className="text-[9px] text-slate-400">Departemen Estimasi Procurement</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
