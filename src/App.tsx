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
import ManualScheduleForm from "./components/ManualScheduleForm";
import RfqAnalytics from "./components/RfqAnalytics";
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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [adminUrl, setAdminUrl] = useState<string>("");

  useEffect(() => {
    setAdminUrl(window.location.origin + window.location.pathname + "#admin");
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // URL Hash & Query Parameter Routing for separate link capability
  useEffect(() => {
    const checkRoute = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (params.get("portal") === "admin" || params.get("page") === "admin" || params.get("admin") === "true" || hash === "#admin") {
        setCurrentTab("admin");
      } else if (hash === "#consult") {
        setCurrentTab("consult");
      } else if (hash === "#rfq") {
        setCurrentTab("rfq");
      } else if (hash === "#landing") {
        setCurrentTab("landing");
      }
    };
    
    checkRoute();
    window.addEventListener("popstate", checkRoute);
    window.addEventListener("hashchange", checkRoute);
    return () => {
      window.removeEventListener("popstate", checkRoute);
      window.removeEventListener("hashchange", checkRoute);
    };
  }, []);

  // Sync tab status to URL hash so users/admins can copy and share direct links
  useEffect(() => {
    if (currentTab === "landing") {
      // Clear hash if we are on landing to keep URL clean, but don't break back button
      if (window.location.hash && window.location.hash !== "#landing") {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } else {
      window.history.replaceState(null, "", `#${currentTab}`);
    }
  }, [currentTab]);

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "Berkah Bintang Solusindo",
    tagline: "Solusi Teknologi Informasi dan Pengadaan Terpercaya",
    description: "Melayani kebutuhan pengadaan perangkat IT, infrastruktur jaringan, server, CCTV, software, maintenance, serta konsultasi teknologi informasi untuk perusahaan, lembaga pendidikan, bisnis, dan UMKM.",
    address: "Jl. Cempaka Putih Barat 21 No. 10 Jakarta Pusat 10520",
    whatsapp: "+628131852419",
    email: "bbscom993@gmail.com",
    website: "www.berkahbintangsolusindo.com",
    workingHours: "Senin - Jumat: 08:30 - 17:30 WIB",
    logoText: "BBS",
    headerLogoType: "image",
    logoImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&auto=format&q=80",
    bankAccount: {
      bankName: "Bank Mandiri",
      accountNumber: "123-45-67890-1",
      accountHolder: "PT Berkah Bintang Solusindo"
    }
  });

  // State Management
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem("bbs_catalog_products");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved catalog products", e);
      }
    }
    return PRODUCT_CATALOG;
  });

  useEffect(() => {
    localStorage.setItem("bbs_catalog_products", JSON.stringify(catalogProducts));
  }, [catalogProducts]);

  const [catalogForm, setCatalogForm] = useState<{
    id: string;
    name: string;
    category: string;
    description: string;
    estimatedPriceRange: string;
    icon: string;
    image: string;
    specifications: string[];
  }>({
    id: "",
    name: "",
    category: "Server & Storage",
    description: "",
    estimatedPriceRange: "Rp 5.000.000 - Rp 10.000.000",
    icon: "Server",
    image: "",
    specifications: ["", "", "", "", ""],
  });
  const [isEditingCatalog, setIsEditingCatalog] = useState(false);
  const [isAddingCatalog, setIsAddingCatalog] = useState(false);
  const [adminCatalogSearch, setAdminCatalogSearch] = useState("");
  const [adminCatalogCategory, setAdminCatalogCategory] = useState("Semua");

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
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"rfqs" | "quotations" | "emails" | "reminders" | "settings" | "users" | "catalog">("rfqs");
  const [adminRfqSearch, setAdminRfqSearch] = useState("");
  const [adminRfqStartDate, setAdminRfqStartDate] = useState("");
  const [adminRfqEndDate, setAdminRfqEndDate] = useState("");
  const [adminRfqStatus, setAdminRfqStatus] = useState<string>("");
  const [adminRole, setAdminRole] = useState<"superadmin" | "admin" | "sales" | null>(null);
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminUsers, setAdminUsers] = useState<any[]>([
    { id: "u1", username: "superadmin", name: "Arif Suharyadi", role: "superadmin", status: "active", lastLogin: "Hari ini, 08:30" },
    { id: "u2", username: "admin", name: "Fina Karlina", role: "admin", status: "active", lastLogin: "Kemarin, 14:15" },
    { id: "u3", username: "sales", name: "Azka Rafassya", role: "sales", status: "active", lastLogin: "2 jam yang lalu" },
    { id: "u4", username: "doni_sales", name: "Doni Pratama", role: "sales", status: "active", lastLogin: "3 hari yang lalu" },
    { id: "u5", username: "lina_proc", name: "Lina Marlina", role: "admin", status: "suspended", lastLogin: "1 minggu yang lalu" }
  ]);
  const [newUserForm, setNewUserForm] = useState({ username: "", name: "", role: "sales" as "superadmin" | "admin" | "sales", status: "active" as "active" | "suspended" });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAdminRegistering, setIsAdminRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: "", name: "", password: "", role: "superadmin" as "superadmin" | "admin" | "sales" });
  const [adminLoginUsernameInput, setAdminLoginUsernameInput] = useState("");
  const [oauthModal, setOauthModal] = useState<{ isOpen: boolean; provider: "google" | "github" | "microsoft" | null }>({ isOpen: false, provider: null });
  const [oauthNewEmail, setOauthNewEmail] = useState("");
  const [oauthNewName, setOauthNewName] = useState("");
  const [oauthNewRole, setOauthNewRole] = useState<"superadmin" | "admin" | "sales">("sales");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthStep, setOauthStep] = useState<"select" | "custom">("select");
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [reminderConfig, setReminderConfig] = useState<any>({
    autoSchedule: true,
    delayHours: 48,
    subjectTemplate: "",
    bodyTemplate: ""
  });
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Selection for detailed viewing
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);
  
  useEffect(() => {
    if (!selectedQuotation) {
      setIsPrintPreview(false);
    }
  }, [selectedQuotation]);

  const [printDate, setPrintDate] = useState<string>("");
  const [successRfqNumber, setSuccessRfqNumber] = useState<string | null>(null);
  const [selectedCatalogPdf, setSelectedCatalogPdf] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonDetailMode, setComparisonDetailMode] = useState<"summary" | "detail">("detail");
  const [collapsedCompareProductIds, setCollapsedCompareProductIds] = useState<Record<string, boolean>>({});

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
  const [catalogSort, setCatalogSort] = useState<"none" | "best-match" | "popularity" | "low-to-high" | "high-to-low">("none");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchSettings();
    fetchRfqs();
    fetchQuotations();
    fetchEmails();
    fetchReminders();
    fetchReminderConfig();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (selectedQuotation) {
      setPrintDate(new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " WIB");
    }
  }, [selectedQuotation]);

  useEffect(() => {
    const handleBeforePrint = () => {
      setPrintDate(new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " WIB");
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, []);

  const filteredRfqsForAdmin = rfqs.filter((rfq) => {
    // 1. Filter by search query
    const q = adminRfqSearch.toLowerCase().trim();
    if (q) {
      const matchesSearch = (
        rfq.rfqNumber.toLowerCase().includes(q) ||
        rfq.clientName.toLowerCase().includes(q) ||
        (rfq.companyName && rfq.companyName.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;
    }

    // 2. Filter by Date range (submission date)
    if (rfq.date) {
      if (adminRfqStartDate && rfq.date < adminRfqStartDate) {
        return false;
      }
      if (adminRfqEndDate && rfq.date > adminRfqEndDate) {
        return false;
      }
    } else if (adminRfqStartDate || adminRfqEndDate) {
      // If there's a date range filter set, but the RFQ has no date, exclude it
      return false;
    }

    // 3. Filter by Status
    if (adminRfqStatus && rfq.status !== adminRfqStatus) {
      return false;
    }

    return true;
  });

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

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error("Failed to fetch simulated emails", err);
    }
  };

  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error("Failed to fetch reminders", err);
    } finally {
      setLoadingReminders(false);
    }
  };

  const fetchReminderConfig = async () => {
    try {
      const res = await fetch("/api/reminders/config");
      if (res.ok) {
        const data = await res.json();
        setReminderConfig(data);
      }
    } catch (err) {
      console.error("Failed to fetch reminder config", err);
    }
  };

  const saveReminderConfig = async (newConfig: any) => {
    try {
      const res = await fetch("/api/reminders/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setReminderConfig(data);
        showToast("Pengaturan pengingat otomatis disimpan!", "success");
      } else {
        showToast("Gagal menyimpan konfigurasi pengingat", "error");
      }
    } catch (err) {
      showToast("Koneksi API bermasalah", "error");
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
        fetchEmails();
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
    const username = adminLoginUsernameInput.trim().toLowerCase() || "superadmin";
    const password = adminPassword.trim();

    // Find user in local admin users list
    const user = adminUsers.find(u => u.username.toLowerCase() === username);

    if (!user) {
      showToast("Username tidak ditemukan! Coba 'superadmin', 'admin', atau 'sales'.", "error");
      return;
    }

    if (user.status === "suspended") {
      showToast(`Akun '${user.name}' ditangguhkan! Hubungi Super Admin.`, "error");
      return;
    }

    // Validate password
    const isPasswordValid = 
      (user.username === "superadmin" && (password === "superadmin" || password === "" || password === "admin")) ||
      (user.username === "admin" && (password === "admin" || password === "admin123" || password === "")) ||
      (user.username === "sales" && (password === "sales" || password === "")) ||
      password === user.username || 
      (user.password && password === user.password) ||
      password === "admin" ||
      password === "123456";

    if (isPasswordValid) {
      setAdminAuthenticated(true);
      setAdminRole(user.role);
      setAdminUsername(user.username);
      setAdminDisplayName(user.name);
      
      // Update last login for the user
      setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, lastLogin: "Baru saja" } : u));
      
      showToast(`Selamat datang kembali, ${user.name} (${user.role.toUpperCase()})!`, "success");
    } else {
      showToast("Kata sandi salah!", "error");
    }
  };

  // Handle simulated third-party OAuth login
  const handleOauthLogin = (userObj: { name: string; username: string; role: "superadmin" | "admin" | "sales" }) => {
    setOauthLoading(true);
    setTimeout(() => {
      // Find if user already exists
      let existingUser = adminUsers.find(u => u.username.toLowerCase() === userObj.username.toLowerCase());
      if (!existingUser) {
        // Create dynamic user
        const newUser = {
          id: "u_" + Date.now(),
          username: userObj.username,
          name: userObj.name,
          role: userObj.role,
          status: "active",
          lastLogin: "Baru saja (via " + (oauthModal.provider || "Google") + ")"
        };
        setAdminUsers(prev => [...prev, newUser]);
        existingUser = newUser;
      } else {
        // Check if suspended
        if (existingUser.status === "suspended") {
          showToast(`Akun '${existingUser.name}' ditangguhkan! Hubungi Super Admin.`, "error");
          setOauthLoading(false);
          return;
        }
        // Update last login
        const targetId = existingUser.id;
        setAdminUsers(prev => prev.map(u => u.id === targetId ? { ...u, lastLogin: "Baru saja (via " + (oauthModal.provider || "Google") + ")" } : u));
      }

      setAdminAuthenticated(true);
      setAdminRole(existingUser.role);
      setAdminUsername(existingUser.username);
      setAdminDisplayName(existingUser.name);
      
      setOauthModal({ isOpen: false, provider: null });
      setOauthLoading(false);
      setOauthNewEmail("");
      setOauthNewName("");
      setOauthStep("select");
      
      showToast(`Selamat datang kembali, ${existingUser.name} (${existingUser.role.toUpperCase()}) via ${oauthModal.provider ? oauthModal.provider.toUpperCase() : "Google"}!`, "success");
    }, 1200); // 1.2s realistic loading animation
  };

  // Format currency helpers
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(value);
  };

  // Helper to extract a numeric price from range string e.g., "Rp 10.500.000 - Rp 14.500.000"
  const getNumericPrice = (priceRange: string): number => {
    const firstPart = priceRange.split("-")[0] || "";
    const clean = firstPart.replace(/\D/g, "");
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  };

  // Helper to get technical definition or benefit for specifications
  const getSpecExplanation = (spec: string): { title: string; def: string; benefit: string } => {
    const text = spec.toLowerCase();
    
    if (text.includes("intel core i5") || text.includes("intel core i7")) {
      return {
        title: "Processor Intel Core i5 / i7",
        def: "Prosesor bisnis andalan dengan performa multi-core yang seimbang.",
        benefit: "Memastikan kecepatan pengolahan data tinggi & multitasking tanpa hambatan."
      };
    }
    if (text.includes("intel core i3")) {
      return {
        title: "Processor Intel Core i3",
        def: "Prosesor efisien untuk kebutuhan tugas komputasi standar harian.",
        benefit: "Hemat daya dengan kinerja stabil untuk pengolah dokumen, browsing, & meeting."
      };
    }
    if (text.includes("intel xeon")) {
      return {
        title: "Processor Intel Xeon",
        def: "Prosesor kelas enterprise untuk beban kerja server yang sangat berat.",
        benefit: "Keandalan tinggi berkat dukungan memori ECC untuk mencegah data corrupt."
      };
    }
    if (text.includes("amd ryzen")) {
      return {
        title: "Processor AMD Ryzen",
        def: "Prosesor modern dengan efisiensi energi & kekuatan multi-thread tinggi.",
        benefit: "Kecepatan transfer data optimal untuk kelancaran sinkronisasi file pada NAS."
      };
    }
    if (text.includes("ram") && (text.includes("ddr5") || text.includes("ddr4") || text.includes("udimm"))) {
      return {
        title: "Random Access Memory (RAM)",
        def: "Penyimpanan data sementara berkecepatan tinggi saat aplikasi dijalankan.",
        benefit: "Sistem lebih responsif saat membuka banyak tab atau program berat sekaligus."
      };
    }
    if (text.includes("storage") || text.includes("ssd") || text.includes("nvme") || text.includes("hard drive") || text.includes("sata")) {
      return {
        title: "Media Penyimpanan (SSD / HDD)",
        def: "Penyimpanan data jangka panjang berbasis flash (SSD) atau piringan magnetik (HDD).",
        benefit: "SSD mempercepat booting sistem & buka aplikasi, sementara HDD Enterprise menawarkan kapasitas raksasa."
      };
    }
    if (text.includes("layar") || text.includes("monitor") || text.includes("ips") || text.includes("fhd")) {
      return {
        title: "Display (Monitor / Layar IPS)",
        def: "Panel visual berteknologi tinggi untuk sudut pandang luas & akurasi warna.",
        benefit: "Kenyamanan ekstra di mata berkat lapisan anti-pantulan untuk produktivitas berjam-jam."
      };
    }
    if (text.includes("windows 11 pro")) {
      return {
        title: "Sistem Operasi Windows 11 Pro",
        def: "OS Windows edisi bisnis yang dilengkapi proteksi enkripsi BitLocker bawaan.",
        benefit: "Keamanan data korporat terjamin & manajemen IT jarak jauh yang lebih mudah."
      };
    }
    if (text.includes("keyboard") || text.includes("mouse")) {
      return {
        title: "Aksesoris Input Keyboard & Mouse",
        def: "Perangkat navigasi dan pengetikan USB standar pabrikan.",
        benefit: "Durabilitas tinggi dengan desain ergonomis untuk kenyamanan kerja harian."
      };
    }
    if (text.includes("ethernet") || text.includes("gigabit") || text.includes("port") || text.includes("sfp+")) {
      return {
        title: "Port Konektivitas Jaringan",
        def: "Port kabel fisik kecepatan tinggi Gigabit (1Gbps) s.d SFP+ (10Gbps).",
        benefit: "Koneksi data yang stabil tanpa delay dibanding jaringan nirkabel."
      };
    }
    if (text.includes("idrac9") || text.includes("remote management")) {
      return {
        title: "Dell iDRAC9 Remote Management",
        def: "Sistem manajemen hardware server dari jarak jauh (Out-of-Band).",
        benefit: "Admin dapat me-restart atau monitoring server meski OS sedang crash/mati."
      };
    }
    if (text.includes("4-bay") || text.includes("drive")) {
      return {
        title: "Bay Storage Modular",
        def: "Slot penyimpanan bay yang dapat dikonfigurasi secara mandiri.",
        benefit: "Memudahan upgrade atau ganti harddisk (hot-swap) tanpa mematikan perangkat."
      };
    }
    if (text.includes("dsm") || text.includes("diskstation manager")) {
      return {
        title: "Synology DSM OS",
        def: "Sistem operasi modern berbasis web untuk mengelola file server NAS.",
        benefit: "Kemudahan manajemen hak akses folder, sinkronisasi cloud, & backup berkala."
      };
    }
    if (text.includes("routeros") || text.includes("license")) {
      return {
        title: "Sistem Operasi MikroTik RouterOS",
        def: "OS perutean jaringan canggih dengan kustomisasi aturan firewall penuh.",
        benefit: "Manajemen bandwidth karyawan yang efisien & pembagian jaringan VPN yang aman."
      };
    }
    if (text.includes("wi-fi") || text.includes("access point") || text.includes("wireless")) {
      return {
        title: "Teknologi Wi-Fi 6 (802.11ax)",
        def: "Standar koneksi nirkabel modern yang mendukung kepadatan user tinggi.",
        benefit: "Koneksi internet nirkabel lebih cepat, stabil, & merata tanpa tabrakan sinyal."
      };
    }
    if (text.includes("powered by poe") || text.includes("poe")) {
      return {
        title: "PoE (Power over Ethernet)",
        def: "Teknologi penyaluran arus listrik langsung via kabel jaringan LAN.",
        benefit: "Instalasi perangkat lebih rapi & hemat biaya tanpa perlu stopkontak tambahan."
      };
    }
    if (text.includes("resolusi") || text.includes("megapixel") || text.includes("camera") || text.includes("1080p")) {
      return {
        title: "Kamera Resolusi Full HD",
        def: "Kualitas sensor video beresolusi tinggi dengan tangkapan gambar tajam.",
        benefit: "Memudahkan pembacaan detail visual yang jelas pada rekaman jika terjadi insiden."
      };
    }
    if (text.includes("lensa") || text.includes("wide angle")) {
      return {
        title: "Lensa Lebar (Wide Angle)",
        def: "Lensa bersudut lebar untuk menangkap cakupan ruang yang lebih luas.",
        benefit: "Meminimalkan area blank spot (titik buta) di dalam ruangan pengawasan."
      };
    }
    if (text.includes("night vision") || text.includes("smart ir")) {
      return {
        title: "Infrared Night Vision",
        def: "Sensor inframerah untuk perekaman video dalam gelap gulita.",
        benefit: "Kondisi ruangan gelap tetap terpantau dengan jelas hingga radius 30 meter."
      };
    }
    if (text.includes("ip67") || text.includes("vandal-proof") || text.includes("ik10")) {
      return {
        title: "Ketahanan IP67 & IK10",
        def: "Proteksi fisik tingkat tinggi tahan debu, air, & benturan kekerasan.",
        benefit: "Kamera tetap aman beroperasi dalam cuaca ekstrim maupun tindakan sabotase."
      };
    }
    if (text.includes("kompresi") || text.includes("h.265")) {
      return {
        title: "Kompresi Video H.265+",
        def: "Format pengodean video hemat bandwidth paling mutakhir.",
        benefit: "Menghemat ruang penyimpanan HDD NVR s.d 50% tanpa mengurangi ketajaman rekaman."
      };
    }
    if (text.includes("aplikasi premium") || text.includes("word") || text.includes("excel")) {
      return {
        title: "Aplikasi Microsoft 365 Premium",
        def: "Paket software perkantoran standar industri terlengkap (Word, Excel, dll).",
        benefit: "Memastikan kompatibilitas penuh pengerjaan dokumen & produktivitas bisnis."
      };
    }
    if (text.includes("email bisnis") || text.includes("exchange")) {
      return {
        title: "Email Bisnis Exchange Server",
        def: "Email profesional berkeamanan tinggi dengan nama domain perusahaan.",
        benefit: "Meningkatkan profesionalisme brand & dilindungi sistem anti-phishing terdepan."
      };
    }
    if (text.includes("onedrive") || text.includes("penyimpanan cloud")) {
      return {
        title: "Penyimpanan OneDrive 1TB",
        def: "Cloud storage terintegrasi berkapasitas sangat besar dari Microsoft.",
        benefit: "Akses data kerja dari perangkat mana saja dengan proteksi pencadangan otomatis."
      };
    }
    if (text.includes("teams") || text.includes("meeting")) {
      return {
        title: "Kolaborasi Microsoft Teams",
        def: "Aplikasi chat, video conference, & ruang kerja kelompok terpadu.",
        benefit: "Kolaborasi tim jarak jauh lancar dengan video HD & integrasi aplikasi Office."
      };
    }
    if (text.includes("perangkat") || text.includes("instal")) {
      return {
        title: "Lisensi Multi-Device",
        def: "Hak lisensi perangkat lunak yang bisa diaktifkan di beberapa unit.",
        benefit: "Satu akun karyawan dapat dipakai aman di PC kantor, laptop pribadi, & HP."
      };
    }

    return {
      title: "Spesifikasi Komponen Utama",
      def: "Spesifikasi acuan resmi untuk jaminan kelaikan sistem.",
      benefit: "Memastikan kompatibilitas penuh & durabilitas operasional bisnis harian."
    };
  };

  // Helper to determine product popularity (higher is more popular)
  const getProductPopularity = (product: ProductItem): number => {
    const popularityMap: Record<string, number> = {
      "prod_1": 98,
      "prod_2": 92,
      "prod_3": 95,
      "prod_4": 89,
      "prod_5": 87,
      "prod_6": 84,
    };
    return popularityMap[product.id] || (product.name.length % 30) + 50;
  };

  // Filter products catalog
  const filteredProducts = catalogProducts.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                        product.description.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchCat = catalogCategory === "Semua" || product.category === catalogCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (catalogSort === "low-to-high") {
      return getNumericPrice(a.estimatedPriceRange) - getNumericPrice(b.estimatedPriceRange);
    } else if (catalogSort === "high-to-low") {
      return getNumericPrice(b.estimatedPriceRange) - getNumericPrice(a.estimatedPriceRange);
    } else if (catalogSort === "popularity") {
      return getProductPopularity(b) - getProductPopularity(a);
    } else if (catalogSort === "best-match") {
      if (catalogSearch.trim()) {
        const getRelevance = (p: ProductItem) => {
          const nameLower = p.name.toLowerCase();
          const descLower = p.description.toLowerCase();
          const queryLower = catalogSearch.toLowerCase().trim();
          
          if (nameLower.startsWith(queryLower)) return 100;
          if (nameLower.includes(queryLower)) return 50;
          if (descLower.includes(queryLower)) return 25;
          return 0;
        };
        const relA = getRelevance(a);
        const relB = getRelevance(b);
        if (relA !== relB) {
          return relB - relA;
        }
      }
      return getProductPopularity(b) - getProductPopularity(a);
    }
    return 0;
  });

  const uniqueCategories = ["Semua", ...Array.from(new Set(catalogProducts.map(p => p.category)))];

  // Filter admin products catalog
  const filteredAdminCatalog = catalogProducts.filter(item => {
    const matchQ = item.name.toLowerCase().includes(adminCatalogSearch.toLowerCase()) || 
                   item.description.toLowerCase().includes(adminCatalogSearch.toLowerCase());
    const matchC = adminCatalogCategory === "Semua" || item.category === adminCatalogCategory;
    return matchQ && matchC;
  });

  // Calculate total value of pending RFQs
  const pendingRfqsOnly = rfqs.filter(r => r.status === "pending" || r.status === "processing");
  const totalPendingValue = pendingRfqsOnly.reduce((acc, rfq) => {
    let rfqValue = 0;
    rfq.items.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      const matched = catalogProducts.find((p) => {
        const pNameLower = p.name.toLowerCase();
        return pNameLower.includes(itemNameLower) || itemNameLower.includes(pNameLower);
      });
      
      let price = matched ? getNumericPrice(matched.estimatedPriceRange) : 5000000;
      if (price === 0) price = 5000000;
      rfqValue += price * item.quantity;
    });
    return acc + rfqValue;
  }, 0);

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
              <div className="flex flex-col items-center justify-center text-center gap-6 border-b border-white/10 pb-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Katalog Acuan Pengadaan
                  </div>
                  <h2 className="text-3xl font-extrabold text-white">Produk & Perangkat IT Populer</h2>
                  <p className="text-slate-400 text-sm mt-1 max-w-2xl">Pilih perangkat berkualitas langsung di bawah ini untuk dimasukkan ke daftar RFQ Anda.</p>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                  <button
                    onClick={() => setSelectedCatalogPdf(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-600/20 active:scale-95 cursor-pointer whitespace-nowrap"
                    id="download_catalog_pdf_btn"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh PDF Katalog</span>
                  </button>

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

                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      type="button"
                      id="catalog_sort_select"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className={`pl-10 pr-10 py-2 bg-slate-900/60 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 cursor-pointer w-full sm:w-52 flex items-center justify-between transition-all duration-300 hover:bg-slate-900/80 hover:scale-[1.02] active:scale-[0.98] ${
                        isSortDropdownOpen 
                          ? 'border-indigo-500/80 shadow-[0_4px_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/30' 
                          : 'border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                      }`}
                    >
                      <Icons.ArrowUpDown className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-300 ${isSortDropdownOpen ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate">
                        {catalogSort === "none" && "Urutkan: Standar"}
                        {catalogSort === "best-match" && "Rekomendasi Terbaik"}
                        {catalogSort === "popularity" && "Paling Populer"}
                        {catalogSort === "low-to-high" && "Harga Termurah"}
                        {catalogSort === "high-to-low" && "Harga Termahal"}
                      </span>
                      <Icons.ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ease-in-out ${isSortDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                    </button>

                    {isSortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 border border-white/15 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-xl animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSort("none");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-all flex items-center justify-between ${
                            catalogSort === "none" 
                              ? "text-indigo-400 bg-indigo-500/10 font-bold" 
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${catalogSort === "none" ? "bg-indigo-400 scale-100" : "bg-transparent scale-0"}`} />
                            <span>Urutkan: Standar</span>
                          </span>
                          {catalogSort === "none" && (
                            <div className="flex items-center justify-center bg-indigo-500/20 rounded-full p-0.5 animate-scale-in">
                              <Icons.Check className="h-3 w-3 text-indigo-400 font-extrabold" />
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSort("best-match");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-all flex items-center justify-between border-t border-white/5 ${
                            catalogSort === "best-match" 
                              ? "text-indigo-400 bg-indigo-500/10 font-bold" 
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${catalogSort === "best-match" ? "bg-indigo-400 scale-100" : "bg-transparent scale-0"}`} />
                            <span className="flex items-center gap-1.5">
                              <Icons.Sparkles className="h-3 w-3 text-amber-400" />
                              <span>Rekomendasi Terbaik</span>
                            </span>
                          </span>
                          {catalogSort === "best-match" && (
                            <div className="flex items-center justify-center bg-indigo-500/20 rounded-full p-0.5 animate-scale-in">
                              <Icons.Check className="h-3 w-3 text-indigo-400 font-extrabold" />
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSort("popularity");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-all flex items-center justify-between border-t border-white/5 ${
                            catalogSort === "popularity" 
                              ? "text-indigo-400 bg-indigo-500/10 font-bold" 
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${catalogSort === "popularity" ? "bg-indigo-400 scale-100" : "bg-transparent scale-0"}`} />
                            <span className="flex items-center gap-1.5">
                              <Icons.Award className="h-3 w-3 text-emerald-400" />
                              <span>Paling Populer</span>
                            </span>
                          </span>
                          {catalogSort === "popularity" && (
                            <div className="flex items-center justify-center bg-indigo-500/20 rounded-full p-0.5 animate-scale-in">
                              <Icons.Check className="h-3 w-3 text-indigo-400 font-extrabold" />
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSort("low-to-high");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-all flex items-center justify-between border-t border-white/5 ${
                            catalogSort === "low-to-high" 
                              ? "text-indigo-400 bg-indigo-500/10 font-bold" 
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${catalogSort === "low-to-high" ? "bg-indigo-400 scale-100" : "bg-transparent scale-0"}`} />
                            <span>Harga Termurah</span>
                          </span>
                          {catalogSort === "low-to-high" && (
                            <div className="flex items-center justify-center bg-indigo-500/20 rounded-full p-0.5 animate-scale-in">
                              <Icons.Check className="h-3 w-3 text-indigo-400 font-extrabold" />
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSort("high-to-low");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-all flex items-center justify-between border-t border-white/5 ${
                            catalogSort === "high-to-low" 
                              ? "text-indigo-400 bg-indigo-500/10 font-bold" 
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${catalogSort === "high-to-low" ? "bg-indigo-400 scale-100" : "bg-transparent scale-0"}`} />
                            <span>Harga Termahal</span>
                          </span>
                          {catalogSort === "high-to-low" && (
                            <div className="flex items-center justify-center bg-indigo-500/20 rounded-full p-0.5 animate-scale-in">
                              <Icons.Check className="h-3 w-3 text-indigo-400 font-extrabold" />
                            </div>
                          )}
                        </button>
                      </div>
                    )}
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
                  </div>
                </div>
              </div>

              <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div>
                  &copy; {new Date().getFullYear()} {settings.companyName}. Hak Cipta Dilindungi. Solusi Infrastruktur IT & Pengadaan Handal.
                </div>
                <div>
                  <button 
                    onClick={() => setCurrentTab("admin")} 
                    className="flex items-center space-x-1.5 hover:text-indigo-400 text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    title="Akses Khusus Staf / Sales / Admin"
                  >
                    <Icons.Lock className="h-3 w-3" />
                    <span className="text-[11px] font-medium">Akses Karyawan (Staf & Sales)</span>
                  </button>
                </div>
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

                {/* Simulated Email Sent Notification */}
                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-5 text-left max-w-xl mx-auto flex items-start space-x-3.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">📧 Simulasi Email Terkirim</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                      Sistem baru saja mengirimkan email ringkasan pengajuan RFQ secara otomatis ke alamat email yang Anda cantumkan. Anda dapat memeriksa dan membaca isi email simulasi utuh ini di <strong>Portal Admin &rarr; Log Email Terkirim</strong>.
                    </p>
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
                          <option value="pemerintah">Lembaga & Sektor Umum</option>
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
                        <strong>Catatan Pajak & Legalitas:</strong> Untuk Kategori Klien <strong>Lembaga & Sektor Umum</strong>, sistem AI kami akan otomatis memformulasikan PPN sebesar 11% sesuai peraturan Direktorat Jenderal Pajak RI. Seluruh transaksi didukung kuitansi sah PT Berkah Bintang Solusindo.
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
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
                    <Lock className="h-3 w-3 text-indigo-400" />
                    <span>Sistem Manajemen Internal</span>
                  </div>
                  {adminAuthenticated && (
                    <div className={`inline-flex items-center space-x-1 px-3 py-1 border rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      adminRole === "superadmin" 
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                        : adminRole === "admin"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />
                      <span>Role: {adminRole === "superadmin" ? "Super Admin" : adminRole === "admin" ? "Admin" : "Sales"}</span>
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Portal Admin & Penawaran</h2>
                <p className="text-slate-400 text-sm">
                  Kelola database permintaan RFQ klien, generate dokumen penawaran harga menggunakan Gemini AI, dan sesuaikan profil kredensial instansi.
                </p>
              </div>

              {adminAuthenticated && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 uppercase">
                    {adminDisplayName ? adminDisplayName.charAt(0) : "A"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-none">{adminDisplayName || "Administrator"}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{adminUsername ? `@${adminUsername}` : ""}</p>
                  </div>
                  <button
                    onClick={() => {
                      setAdminAuthenticated(false);
                      setAdminRole(null);
                      setAdminUsername("");
                      setAdminDisplayName("");
                      showToast("Berhasil logout dari Portal Admin.", "info");
                    }}
                    className="ml-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Auth Block */}
            {!adminAuthenticated && (
              <div className="max-w-xl mx-auto py-8">
                <div className="bg-slate-900/55 border border-white/10 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500/20 to-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-lg">
                      <Lock className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-extrabold text-white">Akses Multi-Role Portal Admin</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                      Sistem Otentikasi Berkas Penawaran dan Alur Procurement BBS. Masuk menggunakan kredensial atau pilih akun eksternal Anda.
                    </p>
                  </div>

                  {/* Third-Party Social OAuth Buttons */}
                  <div className="space-y-3">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Masuk dengan Akun Pihak Ketiga (Google / GitHub / MS)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Google */}
                      <button
                        type="button"
                        onClick={() => {
                          setOauthModal({ isOpen: true, provider: "google" });
                          setOauthStep("select");
                        }}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center justify-center text-xs font-semibold text-slate-200"
                      >
                        <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.97 3.08C6.18 7.73 8.86 5.04 12 5.04z" />
                          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.66-2.32 3.49v2.9h3.75c2.2-2.02 3.63-5 3.63-8.54z" />
                          <path fill="#FBBC05" d="M5.21 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.24 6.64C.45 8.24 0 10.07 0 12s.45 3.76 1.24 5.36l3.97-3.08z" />
                          <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.75-2.9c-1.04.7-2.37 1.11-3.96 1.11-3.14 0-5.82-2.69-6.79-5.76l-3.97 3.08C3.2 20.27 7.24 23 12 23z" />
                        </svg>
                        <span>Google</span>
                      </button>

                      {/* GitHub */}
                      <button
                        type="button"
                        onClick={() => {
                          setOauthModal({ isOpen: true, provider: "github" });
                          setOauthStep("select");
                        }}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center justify-center text-xs font-semibold text-slate-200"
                      >
                        <Icons.Github className="h-4 w-4 mr-2 text-white shrink-0" />
                        <span>GitHub</span>
                      </button>

                      {/* Microsoft */}
                      <button
                        type="button"
                        onClick={() => {
                          setOauthModal({ isOpen: true, provider: "microsoft" });
                          setOauthStep("select");
                        }}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center justify-center text-xs font-semibold text-slate-200"
                      >
                        <svg className="h-3.5 w-3.5 mr-2 shrink-0" viewBox="0 0 23 23">
                          <rect x="0" y="0" width="11" height="11" fill="#F25022" />
                          <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
                          <rect x="0" y="12" width="11" height="11" fill="#01A6F0" />
                          <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
                        </svg>
                        <span>Microsoft</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-slate-600 text-[9px] font-bold uppercase tracking-wider">Atau Masuk Instan</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {/* Role Capabilities Guide & Quick Login Shortcuts */}
                  <div className="space-y-3">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pilih Role Akses Instan (Quick Login)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Super Admin */}
                      <button
                        type="button"
                        onClick={() => {
                          setAdminLoginUsernameInput("superadmin");
                          setAdminPassword("superadmin");
                          const user = adminUsers.find(u => u.username === "superadmin");
                          if (user) {
                            setAdminAuthenticated(true);
                            setAdminRole("superadmin");
                            setAdminUsername("superadmin");
                            setAdminDisplayName(user.name);
                            showToast("Masuk sebagai Super Admin Arif Suharyadi!", "success");
                          }
                        }}
                        className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-left transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer group text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-indigo-300">Super Admin</span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono">Full</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">Akses penuh ke semua modul + Manajemen Pengguna.</p>
                        <span className="block text-[10px] font-mono text-indigo-400 group-hover:underline">Klik login &rarr;</span>
                      </button>

                      {/* Admin */}
                      <button
                        type="button"
                        onClick={() => {
                          setAdminLoginUsernameInput("admin");
                          setAdminPassword("admin");
                          const user = adminUsers.find(u => u.username === "admin");
                          if (user) {
                            setAdminAuthenticated(true);
                            setAdminRole("admin");
                            setAdminUsername("admin");
                            setAdminDisplayName(user.name);
                            showToast("Masuk sebagai Admin Fina Karlina!", "success");
                          }
                        }}
                        className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-left transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer group text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-emerald-300">Admin</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-mono">Medium</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">Kelola RFQ, penawaran harga, email, & kredensial.</p>
                        <span className="block text-[10px] font-mono text-emerald-400 group-hover:underline">Klik login &rarr;</span>
                      </button>

                      {/* Sales */}
                      <button
                        type="button"
                        onClick={() => {
                          setAdminLoginUsernameInput("sales");
                          setAdminPassword("sales");
                          const user = adminUsers.find(u => u.username === "sales");
                          if (user) {
                            setAdminAuthenticated(true);
                            setAdminRole("sales");
                            setAdminUsername("sales");
                            setAdminDisplayName(user.name);
                            showToast("Masuk sebagai Sales Azka Rafassya!", "success");
                          }
                        }}
                        className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-left transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer group text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-amber-300">Sales Tim</span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">Restricted</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">Proses RFQ & buat penawaran AI. (Modul email & settings terkunci).</p>
                        <span className="block text-[10px] font-mono text-amber-400 group-hover:underline">Klik login &rarr;</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">Atau Masuk Manual</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {isAdminRegistering ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!registerForm.name.trim() || !registerForm.username.trim() || !registerForm.password.trim()) {
                          showToast("Semua field wajib diisi!", "error");
                          return;
                        }
                        const lowercaseUsername = registerForm.username.trim().toLowerCase();
                        if (adminUsers.some(u => u.username.toLowerCase() === lowercaseUsername)) {
                          showToast("Username sudah digunakan!", "error");
                          return;
                        }

                        const newUser = {
                          id: "user_" + Date.now(),
                          username: lowercaseUsername,
                          name: registerForm.name.trim(),
                          password: registerForm.password.trim(),
                          role: registerForm.role,
                          status: "active",
                          lastLogin: "Baru saja terdaftar"
                        };

                        setAdminUsers([...adminUsers, newUser]);
                        showToast(`Akun @${newUser.username} berhasil dibuat! Silakan masuk.`, "success");
                        
                        setAdminLoginUsernameInput(newUser.username);
                        setAdminPassword(newUser.password);
                        setIsAdminRegistering(false);
                      }}
                      className="space-y-4 animate-fadeIn"
                    >
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 justify-center border-b border-white/5 pb-2">
                        <Icons.UserPlus className="h-4.5 w-4.5" />
                        <span>Pendaftaran Akun Staff / Admin Baru</span>
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Nama Lengkap</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contoh: Budi Santoso"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Username Baru</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contoh: budi_admin"
                            value={registerForm.username}
                            onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Kata Sandi</label>
                            <input 
                              type="password" 
                              required
                              placeholder="Minimal 6 karakter"
                              value={registerForm.password}
                              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                              className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Pilih Hak Akses (Role)</label>
                            <select 
                              value={registerForm.role}
                              onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as any })}
                              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="superadmin">Super Admin (Akses Penuh)</option>
                              <option value="admin">Admin (Kelola & Kredensial)</option>
                              <option value="sales">Sales (Input RFQ & Quote)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-[1.01]"
                      >
                        <Icons.UserPlus className="h-4 w-4" />
                        <span>Daftar Akun Baru Sekarang</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAdminRegistering(false)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline cursor-pointer"
                        >
                          &larr; Kembali ke halaman masuk (Login)
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Username</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: superadmin, admin, sales"
                            value={adminLoginUsernameInput}
                            onChange={(e) => setAdminLoginUsernameInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Kata Sandi</label>
                          <input 
                            type="password" 
                            placeholder="Masukkan password admin"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/45 transition-all flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <span>Masuk Sistem Secara Manual</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <div className="text-center pt-1 border-t border-white/5 mt-3">
                        <p className="text-[11px] text-slate-400">
                          Belum punya akun staf resmi?{" "}
                          <button
                            type="button"
                            onClick={() => setIsAdminRegistering(true)}
                            className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                          >
                            Daftar Akun Baru di Sini &rarr;
                          </button>
                        </p>
                      </div>
                    </form>
                  )}

                  {/* Direct Link Section */}
                  <div className="pt-4 border-t border-white/5 space-y-3 mt-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                        <Icons.Link className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Tautan Terpisah Portal Admin</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded font-mono uppercase tracking-wider">Akses Mandiri</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Akses admin kini dipisahkan dari menu navigasi utama demi keamanan. Anda dapat menggunakan tautan di bawah untuk bookmark atau akses langsung:
                    </p>

                    {/* Active URL */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold block">Tautan Server Aktif Saat Ini:</span>
                      <div className="flex items-center gap-2 bg-slate-950/80 border border-white/5 p-2 rounded-xl">
                        <code className="text-indigo-200 text-[10px] font-mono truncate flex-grow">
                          {adminUrl || "Menyiapkan tautan..."}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            if (adminUrl) {
                              navigator.clipboard.writeText(adminUrl);
                              showToast("Tautan Server Aktif disalin!", "success");
                            }
                          }}
                          className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          Salin
                        </button>
                      </div>
                    </div>

                    {/* Localhost URL */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold block">Tautan Pengembangan Lokal (Localhost):</span>
                      <div className="flex items-center gap-2 bg-slate-950/80 border border-white/5 p-2 rounded-xl">
                        <code className="text-emerald-300 text-[10px] font-mono truncate flex-grow">
                          http://localhost:3000/#admin
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("http://localhost:3000/#admin");
                            showToast("Tautan Lokal Offline disalin!", "success");
                          }}
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          Salin
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-500 block italic leading-normal">
                        *Gunakan tautan di atas apabila Anda menjalankan aplikasi secara luring (offline) di komputer lokal Anda.
                      </span>
                    </div>
                  </div>
                </div>
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
                    onClick={() => setActiveAdminSubTab("emails")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "emails" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mail className="h-4.5 w-4.5" />
                    <span>Log Email Terkirim ({emails.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminSubTab("reminders")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "reminders" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icons.Bell className="h-4.5 w-4.5" />
                    <span>Jadwal Follow-up ({reminders.length})</span>
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

                  <button
                    onClick={() => setActiveAdminSubTab("catalog")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "catalog" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icons.Package className="h-4.5 w-4.5" />
                    <span>Pengaturan Katalog ({catalogProducts.length})</span>
                  </button>

                  {adminRole === "superadmin" && (
                    <button
                      onClick={() => setActiveAdminSubTab("users")}
                      className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeAdminSubTab === "users" 
                          ? "border-indigo-500 text-indigo-400" 
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icons.Users className="h-4.5 w-4.5" />
                      <span>Manajemen Pengguna ({adminUsers.length})</span>
                    </button>
                  )}
                </div>

                {/* ================================== */}
                {/* ADMIN T1: RFQs LIST                */}
                {/* ================================== */}
                {activeAdminSubTab === "rfqs" && (
                  <div className="space-y-6">
                    {/* Summary Dashboard KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                      {/* Card 1: Pending RFQs Count */}
                      <div className="p-5 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">RFQ Belum Diproses</p>
                          <h4 className="text-2xl font-bold text-white mt-1">
                            {pendingRfqsOnly.length} <span className="text-xs text-slate-400 font-normal">Inquiry</span>
                          </h4>
                        </div>
                      </div>

                      {/* Card 2: Total Value of Pending RFQs */}
                      <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/30 backdrop-blur-xl rounded-2xl flex items-center space-x-4 shadow-[0_0_15px_rgba(99,102,241,0.05)] ring-1 ring-indigo-500/20">
                        <div className="p-3 bg-indigo-500/15 rounded-xl border border-indigo-500/30 text-indigo-400">
                          <Icons.TrendingUp className="h-6 w-6 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-indigo-300 font-bold flex items-center gap-1.5 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                            Nilai Prioritas (Pending)
                          </p>
                          <h4 className="text-lg font-black text-white mt-1 font-mono tracking-tight truncate text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                            {formatRupiah(totalPendingValue)}
                          </h4>
                        </div>
                      </div>

                      {/* Card 3: Total RFQ Quoted / Selesai */}
                      <div className="p-5 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                          <Check className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">RFQ Sudah Di-Quote</p>
                          <h4 className="text-2xl font-bold text-white mt-1">
                            {rfqs.filter(r => r.status === "quoted" || r.status === "completed").length} <span className="text-xs text-slate-400 font-normal">Selesai</span>
                          </h4>
                        </div>
                      </div>

                      {/* Card 4: Total Nilai Proposal Aktif */}
                      <div className="p-5 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                          <Award className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 font-medium truncate">Total Proposal Aktif</p>
                          <h4 className="text-base font-bold text-white mt-1 font-mono tracking-tight truncate">
                            {formatRupiah(quotations.reduce((acc, q) => acc + (q.total || 0), 0))}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* D3 Visual Comparison Section for Sales */}
                    <RfqAnalytics rfqs={rfqs} catalogProducts={catalogProducts} quotations={quotations} />

                    {/* Main RFQ Table Card */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                      <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                          <h4 className="font-extrabold text-white text-base shrink-0">Database Request for Quote (RFQ) Klien</h4>
                          
                          {/* Search Input */}
                          <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Cari nomor RFQ atau nama klien..."
                              value={adminRfqSearch}
                              onChange={(e) => setAdminRfqSearch(e.target.value)}
                              className="w-full pl-10 pr-10 py-1.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {adminRfqSearch && (
                              <button
                                onClick={() => setAdminRfqSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={fetchRfqs}
                          className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1 self-end md:self-auto shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Refresh Data</span>
                        </button>
                      </div>

                      {/* Date Range & Status Filters for RFQ */}
                      <div className="px-5 py-3.5 bg-slate-950/40 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-xs">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                          {/* Date Range Section */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center space-x-2 text-slate-300 font-semibold shrink-0">
                              <Icons.Calendar className="h-4 w-4 text-indigo-400" />
                              <span>Periode:</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                id="rfq_start_date_picker"
                                value={adminRfqStartDate}
                                onChange={(e) => setAdminRfqStartDate(e.target.value)}
                                className="bg-slate-950 border border-white/10 hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono [color-scheme:dark] transition-all"
                              />
                              <span className="text-slate-500 font-medium">s/d</span>
                              <input
                                type="date"
                                id="rfq_end_date_picker"
                                value={adminRfqEndDate}
                                onChange={(e) => setAdminRfqEndDate(e.target.value)}
                                className="bg-slate-950 border border-white/10 hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono [color-scheme:dark] transition-all"
                              />
                            </div>
                            {(adminRfqStartDate || adminRfqEndDate) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminRfqStartDate("");
                                  setAdminRfqEndDate("");
                                }}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>

                          {/* Status Dropdown Filter Section */}
                          <div className="flex flex-wrap items-center gap-2 md:border-l md:border-white/10 md:pl-4">
                            <div className="flex items-center space-x-2 text-slate-300 font-semibold shrink-0">
                              <Icons.Filter className="h-4 w-4 text-emerald-400" />
                              <span>Status RFQ:</span>
                            </div>
                            <select
                              id="rfq_status_filter"
                              value={adminRfqStatus}
                              onChange={(e) => setAdminRfqStatus(e.target.value)}
                              className="bg-slate-950 border border-white/10 hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold cursor-pointer transition-all"
                            >
                              <option value="">Semua Status</option>
                              <option value="pending">Menunggu Proposal (Pending)</option>
                              <option value="processing">Sedang Diproses (Processing)</option>
                              <option value="quoted">Sudah Di-Quoted (Quoted)</option>
                              <option value="completed">Selesai (Completed)</option>
                              <option value="cancelled">Dibatalkan (Cancelled)</option>
                            </select>
                            {adminRfqStatus && (
                              <button
                                type="button"
                                onClick={() => setAdminRfqStatus("")}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick filter presets */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0 xl:ml-auto">
                          <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mr-1">Preset Cepat:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const todayStr = today.toISOString().split("T")[0];
                              setAdminRfqStartDate(todayStr);
                              setAdminRfqEndDate(todayStr);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              adminRfqStartDate === new Date().toISOString().split("T")[0] && adminRfqEndDate === new Date().toISOString().split("T")[0]
                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            Hari Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const endStr = today.toISOString().split("T")[0];
                              const start = new Date();
                              start.setDate(today.getDate() - 7);
                              const startStr = start.toISOString().split("T")[0];
                              setAdminRfqStartDate(startStr);
                              setAdminRfqEndDate(endStr);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              adminRfqStartDate === (() => {
                                const d = new Date();
                                d.setDate(d.getDate() - 7);
                                return d.toISOString().split("T")[0];
                              })() && adminRfqEndDate === new Date().toISOString().split("T")[0]
                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            7 Hari Terakhir
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const endStr = today.toISOString().split("T")[0];
                              const start = new Date();
                              start.setDate(today.getDate() - 30);
                              const startStr = start.toISOString().split("T")[0];
                              setAdminRfqStartDate(startStr);
                              setAdminRfqEndDate(endStr);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              adminRfqStartDate === (() => {
                                const d = new Date();
                                d.setDate(d.getDate() - 30);
                                return d.toISOString().split("T")[0];
                              })() && adminRfqEndDate === new Date().toISOString().split("T")[0]
                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            30 Hari Terakhir
                          </button>
                        </div>
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
                              {filteredRfqsForAdmin.length > 0 ? (
                                filteredRfqsForAdmin.map((rfq) => (
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
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="p-12 text-center text-slate-500">
                                    <Search className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                    <h5 className="font-bold text-slate-400">Tidak ada RFQ yang cocok</h5>
                                    <p className="text-xs text-slate-600">Cobalah kata kunci pencarian atau nomor RFQ lainnya.</p>
                                  </td>
                                </tr>
                              )}
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
                {/* ADMIN T4: SIMULATED EMAILS LOG    */}
                {/* ================================== */}
                {activeAdminSubTab === "emails" && (
                  adminRole === "sales" ? (
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 py-12">
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/5">
                        <Lock className="h-8 w-8 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-white">Akses Audit Email Dibatasi</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                          Maaf, modul peninjauan log audit email memerlukan level akses <span className="text-indigo-400 font-bold uppercase">Admin</span> atau <span className="text-indigo-400 font-bold uppercase">Super Admin</span>. Peran Anda saat ini adalah <span className="text-amber-400 font-bold uppercase">Sales</span>.
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-left max-w-sm mx-auto space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.X className="h-3.5 w-3.5 text-red-400" />
                          <span>Melihat Log Detail Email Komersial Perusahaan</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.X className="h-3.5 w-3.5 text-red-400" />
                          <span>Audit Korespondensi Sistem & Gateway Email</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Melayani RFQ & Men-generate Penawaran AI</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          showToast("Eskalasi izin audit log email diajukan ke Super Admin!", "success");
                        }}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Ajukan Izin Akses Log Email
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-white text-base flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-indigo-400" />
                          <span>Simulasi Layanan Trigger Surat Konfirmasi Email</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Menampilkan log pengiriman email konfirmasi instan otomatis yang dikirim ke alamat klien sesaat setelah pengajuan RFQ sukses.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={fetchEmails}
                          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Refresh Log</span>
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm("Apakah Anda yakin ingin menghapus semua log email?")) {
                              try {
                                const res = await fetch("/api/emails", { method: "DELETE" });
                                if (res.ok) {
                                  setEmails([]);
                                  setSelectedEmail(null);
                                  showToast("Semua log email berhasil dibersihkan.", "success");
                                }
                              } catch (err) {
                                showToast("Gagal membersihkan log email.", "error");
                              }
                            }
                          }}
                          className="px-3.5 py-1.5 bg-red-600/15 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Bersihkan Semua</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                      {/* Left: Email List */}
                      <div className="lg:col-span-4 border-r border-white/10 max-h-[600px] overflow-y-auto divide-y divide-white/5">
                        {emails.length === 0 ? (
                          <div className="py-20 px-4 text-center text-slate-500 space-y-3">
                            <Mail className="h-10 w-10 text-slate-700 mx-auto" />
                            <div>
                              <h5 className="font-bold text-slate-400">Belum ada email terkirim</h5>
                              <p className="text-xs text-slate-600 mt-1">Cobalah untuk mengisi & mengirimkan form RFQ baru di tab utama.</p>
                            </div>
                          </div>
                        ) : (
                          emails.map((email) => {
                            const isSelected = selectedEmail?.id === email.id;
                            return (
                              <button
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={`w-full text-left p-4 transition-all flex flex-col space-y-2 cursor-pointer ${
                                  isSelected 
                                    ? "bg-indigo-600/20 border-l-4 border-indigo-500" 
                                    : "hover:bg-white/[0.02]"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[10px] font-bold font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                                    {email.rfqNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(email.sentAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-white truncate w-full">{email.subject}</h5>
                                <div className="flex items-center space-x-1 text-[11px] text-slate-400 truncate">
                                  <span className="font-semibold text-slate-300">{email.clientName}</span>
                                  <span>&lt;{email.to}&gt;</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Right: Email Detail Preview */}
                      <div className="lg:col-span-8 bg-slate-950/20 flex flex-col">
                        {selectedEmail ? (
                          <div className="flex flex-col h-full">
                            {/* Email Header Panel */}
                            <div className="p-5 bg-white/5 border-b border-white/10 space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <h3 className="text-sm font-bold text-white">{selectedEmail.subject}</h3>
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/emails/${selectedEmail.id}`, { method: "DELETE" });
                                      if (res.ok) {
                                        setEmails(emails.filter(e => e.id !== selectedEmail.id));
                                        setSelectedEmail(null);
                                        showToast("Log email berhasil dihapus.", "success");
                                      }
                                    } catch (err) {
                                      showToast("Gagal menghapus log email.", "error");
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                  title="Hapus email ini"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="space-y-1 text-xs text-slate-400">
                                <div><span className="text-slate-500 font-semibold inline-block w-14">Dari:</span> <span className="text-slate-300 font-mono">{selectedEmail.from}</span></div>
                                <div><span className="text-slate-500 font-semibold inline-block w-14">Kepada:</span> <span className="text-indigo-400 font-mono">{selectedEmail.to}</span></div>
                                <div><span className="text-slate-500 font-semibold inline-block w-14">Tanggal:</span> <span className="text-slate-300">{new Date(selectedEmail.sentAt).toLocaleString("id-ID")}</span></div>
                              </div>
                            </div>

                            {/* Email Render Frame */}
                            <div className="p-6 overflow-y-auto max-h-[500px] flex-1 bg-white rounded-b-2xl">
                              <div 
                                className="email-body-content"
                                dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3 py-32">
                            <Mail className="h-14 w-14 text-slate-700 animate-pulse" />
                            <div>
                              <h5 className="font-bold text-slate-400 text-sm">Pilih Email Untuk Membaca</h5>
                              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                                Klik salah satu log pengiriman email di sebelah kiri untuk melihat render visual email konfirmasi summary RFQ yang sesungguhnya dikirim ke klien.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                )}

                {/* ================================== */}
                {/* ADMIN T5: AUTOMATED REMINDERS     */}
                {/* ================================== */}
                {activeAdminSubTab === "reminders" && (
                  <div className="space-y-6">
                    {/* Top Stats Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                      <div className="p-5 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                          <Icons.Bell className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Pengingat Terjadwal</p>
                          <h4 className="text-2xl font-bold text-white mt-1">
                            {reminders.filter(r => r.status === 'scheduled').length}
                          </h4>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                          <Icons.Send className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Reminder Terkirim</p>
                          <h4 className="text-2xl font-bold text-white mt-1">
                            {reminders.filter(r => r.status === 'sent').length}
                          </h4>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-slate-500/10 rounded-xl border border-white/10 text-slate-400">
                          <Icons.Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Kebijakan Pengingat</p>
                          <h4 className="text-sm font-bold text-amber-400 mt-2 flex items-center gap-1.5">
                            {reminderConfig?.autoSchedule ? (
                              <>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>Aktif (Otomatis {reminderConfig?.delayHours || 48} Jam)</span>
                              </>
                            ) : (
                              <>
                                <span className="h-2 w-2 rounded-full bg-slate-500" />
                                <span>Non-aktif / Manual</span>
                              </>
                            )}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Global Policy Config */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
                          <div className="border-b border-white/10 pb-4 mb-4">
                            <h4 className="font-extrabold text-white text-base flex items-center space-x-2">
                              <Icons.Settings className="h-5 w-5 text-indigo-400" />
                              <span>Konfigurasi Reminder Otomatis</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              Sesuaikan perilaku pengiriman pengingat tindak lanjut RFQ yang belum ditawarkan harga oleh staff.
                            </p>
                          </div>

                          <div className="space-y-4 text-xs">
                            {/* Toggle auto schedule */}
                            <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                              <div>
                                <h5 className="font-bold text-white text-xs">Jadwalkan Otomatis</h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">Jadwalkan reminder secara otomatis saat klien mengajukan RFQ baru.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...reminderConfig, autoSchedule: !reminderConfig.autoSchedule };
                                  setReminderConfig(updated);
                                  saveReminderConfig(updated);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                                  reminderConfig?.autoSchedule 
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500" 
                                    : "bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10"
                                }`}
                              >
                                {reminderConfig?.autoSchedule ? "AKTIF" : "NON-AKTIF"}
                              </button>
                            </div>

                            {/* Delay hours configuration */}
                            <div>
                              <label className="block text-slate-300 font-bold mb-1.5">Masa Tunggu Sebelum Reminder (Jam)</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={reminderConfig?.delayHours || 48}
                                  onChange={(e) => {
                                    setReminderConfig({ ...reminderConfig, delayHours: parseInt(e.target.value) || 48 });
                                  }}
                                  className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none transition-all text-xs"
                                  placeholder="Contoh: 48"
                                />
                                <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-slate-400 flex items-center font-bold">
                                  Jam
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Rekomendasi: <strong>48 Jam</strong> (2 Hari) memberikan waktu optimal kepada staf untuk menyusun proposal teknis.
                              </p>
                            </div>

                            {/* Subject Template */}
                            <div>
                              <label className="block text-slate-300 font-bold mb-1.5">Template Subjek Email</label>
                              <input
                                type="text"
                                value={reminderConfig?.subjectTemplate || ""}
                                onChange={(e) => setReminderConfig({ ...reminderConfig, subjectTemplate: e.target.value })}
                                className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-all text-xs"
                                placeholder="Subjek email..."
                              />
                            </div>

                            {/* Body Template */}
                            <div>
                              <label className="block text-slate-300 font-bold mb-1.5">Template Pesan Email (Plain Text)</label>
                              <textarea
                                rows={6}
                                value={reminderConfig?.bodyTemplate || ""}
                                onChange={(e) => setReminderConfig({ ...reminderConfig, bodyTemplate: e.target.value })}
                                className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-all text-xs font-sans resize-none"
                                placeholder="Tulis isi pesan pengingat..."
                              />
                              <div className="mt-2 p-2 bg-white/5 border border-white/5 rounded-lg text-[10px] text-slate-400 space-y-1">
                                <p className="font-bold text-indigo-400">Variabel Pengganti:</p>
                                <div className="grid grid-cols-3 gap-1 font-mono text-[9px] text-slate-300">
                                  <div><span className="text-amber-400">{"{rfqNumber}"}</span> : No RFQ</div>
                                  <div><span className="text-amber-400">{"{clientName}"}</span> : Nama Klien</div>
                                  <div><span className="text-amber-400">{"{companyName}"}</span> : Perusahaan</div>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => saveReminderConfig(reminderConfig)}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border border-indigo-500 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Icons.Check className="h-4 w-4" />
                              <span>Simpan Konfigurasi</span>
                            </button>
                          </div>
                        </div>

                        {/* Add Manual Reminder Form */}
                        <ManualScheduleForm 
                          rfqs={rfqs} 
                          reminders={reminders}
                          onScheduled={() => {
                            fetchReminders();
                            fetchEmails();
                          }}
                          showToast={showToast}
                        />
                      </div>

                      {/* Right: Scheduled Reminders List */}
                      <div className="lg:col-span-7 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-white text-base flex items-center space-x-2">
                              <Icons.Clock className="h-5 w-5 text-indigo-400" />
                              <span>Antrean Pengingat Follow-Up</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              Menampilkan seluruh jadwal pengingat email otomatis untuk RFQ yang belum dikirim penawarannya.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={fetchReminders}
                            disabled={loadingReminders}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Refresh antrean"
                          >
                            <Icons.RefreshCw className={`h-4 w-4 ${loadingReminders ? 'animate-spin' : ''}`} />
                          </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto max-h-[650px] divide-y divide-white/5">
                          {reminders.length === 0 ? (
                            <div className="py-24 text-center text-slate-500 space-y-3">
                              <Icons.Bell className="h-12 w-12 text-slate-700 mx-auto" />
                              <div>
                                <h5 className="font-bold text-slate-400">Belum ada pengingat</h5>
                                <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                                  Gunakan formulir di kiri bawah untuk menjadwalkan follow-up baru secara manual, atau buat RFQ baru dari halaman depan.
                                </p>
                              </div>
                            </div>
                          ) : (
                            reminders.map((reminder) => {
                              // Find corresponding RFQ to show its status
                              const rfq = rfqs.find(r => r.id === reminder.rfqId);
                              const isRfqQuoted = rfq?.status === 'quoted';

                              // Time remaining calculations
                              const scheduledDate = new Date(reminder.scheduledTime);
                              const diffMs = scheduledDate.getTime() - Date.now();
                              const isPast = diffMs <= 0;
                              
                              let timeStr = "";
                              if (isPast) {
                                timeStr = "Sudah jatuh tempo";
                              } else {
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                if (diffHours > 0) {
                                  timeStr = `Kirim dlm ${diffHours} jam ${diffMins} mnt`;
                                } else {
                                  timeStr = `Kirim dlm ${diffMins} menit`;
                                }
                              }

                              return (
                                <div key={reminder.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                                        {reminder.rfqNumber}
                                      </span>
                                      
                                      {/* Status Badge */}
                                      {reminder.status === "scheduled" && (
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                          isRfqQuoted
                                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        }`}>
                                          <span className={`h-1.5 w-1.5 rounded-full ${isRfqQuoted ? 'bg-amber-500' : 'bg-indigo-500 animate-ping'}`} />
                                          <span>{isRfqQuoted ? "Auto-Mute (Sudah Quoted)" : "Scheduled"}</span>
                                        </span>
                                      )}
                                      
                                      {reminder.status === "sent" && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                          <Icons.Check className="h-2.5 w-2.5" />
                                          <span>Terkirim</span>
                                        </span>
                                      )}

                                      {reminder.status === "cancelled" && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-white/10 flex items-center gap-1" title={reminder.note}>
                                          <Icons.X className="h-2.5 w-2.5" />
                                          <span>Batal (Auto)</span>
                                        </span>
                                      )}

                                      {reminder.status === "failed" && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1" title={reminder.error}>
                                          <Icons.AlertCircle className="h-2.5 w-2.5" />
                                          <span>Gagal</span>
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      <h5 className="text-xs font-bold text-white">{reminder.clientName}</h5>
                                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{reminder.email}</p>
                                    </div>

                                    <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-sans">
                                      <div className="flex items-center gap-1">
                                        <Icons.Clock className="h-3 w-3 text-slate-500" />
                                        <span>Direncanakan: {new Date(reminder.scheduledTime).toLocaleString("id-ID")}</span>
                                      </div>
                                      {reminder.status === "scheduled" && !isRfqQuoted && (
                                        <div className="flex items-center gap-1 text-indigo-400 font-semibold">
                                          <Icons.Sparkles className="h-3 w-3 animate-pulse" />
                                          <span>{timeStr}</span>
                                        </div>
                                      )}
                                      {reminder.sentAt && (
                                        <div className="flex items-center gap-1 text-emerald-400">
                                          <Icons.Check className="h-3 w-3" />
                                          <span>Terkirim pada: {new Date(reminder.sentAt).toLocaleString("id-ID")}</span>
                                        </div>
                                      )}
                                      {reminder.note && (
                                        <p className="text-slate-500 italic mt-0.5">Note: {reminder.note}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 sm:self-center">
                                    {reminder.status === "scheduled" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm(`Kirim reminder email follow-up untuk ${reminder.clientName} sekarang juga?`)) {
                                              try {
                                                const res = await fetch(`/api/reminders/${reminder.id}/trigger`, { method: "POST" });
                                                if (res.ok) {
                                                  showToast(`Email reminder untuk ${reminder.clientName} berhasil dikirim!`, "success");
                                                  fetchReminders();
                                                  fetchEmails();
                                                } else {
                                                  showToast("Gagal memicu pengiriman email reminder.", "error");
                                                }
                                              } catch (err) {
                                                showToast("Koneksi API bermasalah.", "error");
                                              }
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          <Icons.Send className="h-3 w-3" />
                                          <span>Kirim Sekarang</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm("Apakah Anda yakin ingin membatalkan jadwal reminder ini?")) {
                                              try {
                                                const res = await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                  showToast("Jadwal reminder dibatalkan.", "success");
                                                  fetchReminders();
                                                } else {
                                                  showToast("Gagal membatalkan reminder.", "error");
                                                }
                                              } catch (err) {
                                                showToast("Koneksi API bermasalah.", "error");
                                              }
                                            }
                                          }}
                                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                          title="Hapus / Batalkan Reminder"
                                        >
                                          <Icons.Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {reminder.status !== "scheduled" && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm("Hapus log status reminder ini dari daftar?")) {
                                            try {
                                              const res = await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
                                              if (res.ok) {
                                                fetchReminders();
                                                showToast("Log reminder dihapus.", "success");
                                              }
                                            } catch (err) {
                                              showToast("Gagal menghapus log reminder.", "error");
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                        title="Hapus log"
                                      >
                                        <Icons.Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================== */}
                {/* ADMIN T3: SETTINGS PROFILE CONFIG  */}
                {/* ================================== */}
                {activeAdminSubTab === "settings" && (
                  adminRole === "sales" ? (
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 py-12">
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/5">
                        <Icons.Lock className="h-8 w-8 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-white">Akses Konfigurasi Perusahaan Dibatasi</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                          Maaf, modul perubahan profil kop surat dan nomor rekening perusahaan memerlukan level akses <span className="text-indigo-400 font-bold uppercase">Admin</span> atau <span className="text-indigo-400 font-bold uppercase">Super Admin</span>. Peran Anda saat ini adalah <span className="text-amber-400 font-bold uppercase">Sales</span>.
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-left max-w-sm mx-auto space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.X className="h-3.5 w-3.5 text-red-400" />
                          <span>Mengubah Kop Surat Resmi BBS</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.X className="h-3.5 w-3.5 text-red-400" />
                          <span>Mengubah No Rekening Bank & Termin</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Melihat & Melayani Inquiry RFQ Klien</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          showToast("Permintaan eskalasi edit kredensial dikirim ke Super Admin!", "success");
                        }}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Ajukan Izin Ubah Kredensial
                      </button>
                    </div>
                  ) : (
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

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Website Resmi</label>
                        <input 
                          type="text" 
                          value={settings.website}
                          onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Jam Operasional</label>
                        <input 
                          type="text" 
                          value={settings.workingHours}
                          onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Inisial / Teks Logo</label>
                        <input 
                          type="text" 
                          value={settings.logoText}
                          onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Tipe Logo Kop Surat</label>
                        <select
                          value={settings.headerLogoType || "image"}
                          onChange={(e) => setSettings({ ...settings, headerLogoType: e.target.value as "text" | "image" })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 cursor-pointer"
                        >
                          <option value="text">Inisial Teks Saja (BBS)</option>
                          <option value="image">Gambar Logo Resmi</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">URL Gambar Logo Resmi (Bila Tipe Logo = Gambar)</label>
                        <input 
                          type="url" 
                          value={settings.logoImageUrl || ""}
                          onChange={(e) => setSettings({ ...settings, logoImageUrl: e.target.value })}
                          placeholder="Masukkan URL Gambar Logo, contoh: https://images.unsplash.com/..."
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Deskripsi Perusahaan</label>
                        <textarea 
                          rows={2}
                          value={settings.description}
                          onChange={(e) => setSettings({ ...settings, description: e.target.value })}
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
                ))}

                {/* ================================== */}
                {/* ADMIN T5: CATALOG MANAGEMENT        */}
                {/* ================================== */}
                {activeAdminSubTab === "catalog" && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Visual Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                          <Icons.Package className="h-5 w-5 text-indigo-400" />
                          <span>Portal Manajemen Katalog Perangkat</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Tambah, ubah, atau hapus item dari katalog perangkat acuan PT Berkah Bintang Solusindo.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCatalogProducts(PRODUCT_CATALOG);
                            showToast("Katalog telah di-reset ke data bawaan!", "info");
                          }}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-white/5 cursor-pointer"
                          title="Reset ke pengaturan pabrik"
                        >
                          <Icons.RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset Default</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setCatalogForm({
                              id: "",
                              name: "",
                              category: "Server & Storage",
                              description: "",
                              estimatedPriceRange: "Rp 5.000.000 - Rp 10.000.000",
                              icon: "Server",
                              image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80",
                              specifications: ["", "", "", "", ""],
                            });
                            setIsEditingCatalog(false);
                            setIsAddingCatalog(true);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                        >
                          <Icons.Plus className="h-4 w-4" />
                          <span>Tambah Perangkat</span>
                        </button>
                      </div>
                    </div>

                    {/* Add/Edit Product Form Card */}
                    {(isAddingCatalog || isEditingCatalog) && (
                      <div className="bg-slate-900/60 border border-indigo-500/30 backdrop-blur-xl rounded-2xl p-6 space-y-6 animate-scaleUp">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                          <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                            {isEditingCatalog ? (
                              <>
                                <Icons.Edit2 className="h-4 w-4 text-indigo-400" />
                                <span>Ubah Data Perangkat: <span className="text-indigo-300 font-mono text-sm">#{catalogForm.id}</span></span>
                              </>
                            ) : (
                              <>
                                <Icons.PlusCircle className="h-4 w-4 text-indigo-400" />
                                <span>Tambah Perangkat Baru ke Katalog</span>
                              </>
                            )}
                          </h4>
                          <button
                            onClick={() => {
                              setIsAddingCatalog(false);
                              setIsEditingCatalog(false);
                            }}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Icons.X className="h-5 w-5" />
                          </button>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!catalogForm.name.trim()) {
                              showToast("Nama perangkat tidak boleh kosong!", "error");
                              return;
                            }

                            // Filter empty specifications
                            const cleanSpecs = catalogForm.specifications.filter(s => s.trim() !== "");

                            if (isEditingCatalog) {
                              setCatalogProducts(prev => prev.map(p => p.id === catalogForm.id ? {
                                ...catalogForm,
                                specifications: cleanSpecs,
                              } : p));
                              showToast(`Berhasil memperbarui perangkat "${catalogForm.name}"`, "success");
                            } else {
                              const newId = `prod_${Date.now()}`;
                              const newItem: ProductItem = {
                                ...catalogForm,
                                id: newId,
                                specifications: cleanSpecs,
                              };
                              setCatalogProducts(prev => [newItem, ...prev]);
                              showToast(`Berhasil menambahkan perangkat "${catalogForm.name}" ke katalog`, "success");
                            }

                            setIsAddingCatalog(false);
                            setIsEditingCatalog(false);
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Nama Perangkat / Barang *</label>
                              <input
                                type="text"
                                required
                                placeholder="Contoh: Cisco Catalyst 2960 24-Port Switch"
                                value={catalogForm.name}
                                onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 placeholder-slate-600 focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Kategori Perangkat *</label>
                              <select
                                value={catalogForm.category}
                                onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 focus:border-indigo-500"
                              >
                                <option value="Komputer & Laptop">Komputer & Laptop</option>
                                <option value="Server & Storage">Server & Storage</option>
                                <option value="Jaringan & Keamanan">Jaringan & Keamanan</option>
                                <option value="CCTV & Security System">CCTV & Security System</option>
                                <option value="Software & Lisensi">Software & Lisensi</option>
                                <option value="Sistem Integrasi">Sistem Integrasi</option>
                                <option value="Periferal & Aksesoris">Periferal & Aksesoris</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Estimasi Rentang Harga *</label>
                              <input
                                type="text"
                                required
                                placeholder="Contoh: Rp 12.500.000 - Rp 15.000.000"
                                value={catalogForm.estimatedPriceRange}
                                onChange={(e) => setCatalogForm({ ...catalogForm, estimatedPriceRange: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 placeholder-slate-600 focus:border-indigo-500 font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Tipe Ikon Visual *</label>
                              <select
                                value={catalogForm.icon}
                                onChange={(e) => setCatalogForm({ ...catalogForm, icon: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 focus:border-indigo-500"
                              >
                                <option value="Laptop">Laptop / Komputer Portabel</option>
                                <option value="Monitor">Monitor / PC Desktop</option>
                                <option value="Server">Server / Rackmount</option>
                                <option value="Network">Network / Router / Switch</option>
                                <option value="ShieldCheck">Shield / Keamanan CCTV</option>
                                <option value="HardDrive">Hard Drive / Storage NAS</option>
                                <option value="Cpu">CPU / Processor</option>
                                <option value="Layers">Layers / Software</option>
                                <option value="Package">Package / Umum</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Tautan URL Foto Barang</label>
                              <input
                                type="text"
                                placeholder="Tautan gambar HTTPS (Unsplash, dll)"
                                value={catalogForm.image}
                                onChange={(e) => setCatalogForm({ ...catalogForm, image: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 placeholder-slate-600 focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Deskripsi Singkat *</label>
                            <textarea
                              required
                              rows={2}
                              placeholder="Tuliskan penjelasan singkat mengenai kecanggihan atau peruntukan perangkat ini..."
                              value={catalogForm.description}
                              onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 placeholder-slate-600 focus:border-indigo-500"
                            />
                          </div>

                          {/* Dynamic specifications builder */}
                          <div className="space-y-2.5">
                            <label className="block text-[10px] text-indigo-300 uppercase font-extrabold tracking-widest">Spesifikasi Teknis Utama (Maksimal 5 Detail)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                              {catalogForm.specifications.map((spec, sIdx) => (
                                <div key={sIdx}>
                                  <label className="block text-[8px] text-slate-500 font-bold mb-1">POIN #{sIdx + 1}</label>
                                  <input
                                    type="text"
                                    placeholder={`Contoh: RAM 16GB DDR5`}
                                    value={spec}
                                    onChange={(e) => {
                                      const updatedSpecs = [...catalogForm.specifications];
                                      updatedSpecs[sIdx] = e.target.value;
                                      setCatalogForm({ ...catalogForm, specifications: updatedSpecs });
                                    }}
                                    className="w-full px-3 py-1.5 bg-slate-950 border border-white/5 rounded-lg text-[11px] focus:outline-none text-slate-200 placeholder-slate-700 focus:border-indigo-500/50"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCatalog(false);
                                setIsEditingCatalog(false);
                              }}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                            
                            <button
                              type="submit"
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Icons.Check className="h-4 w-4" />
                              <span>{isEditingCatalog ? "Simpan Perubahan" : "Tambahkan ke Katalog"}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Catalog Interactive List & Search Card */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                      <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h4 className="font-extrabold text-white text-base">Daftar Inventaris Katalog ({catalogProducts.length} Items)</h4>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="relative w-full sm:w-64">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Cari nama atau deskripsi..."
                              value={adminCatalogSearch}
                              onChange={(e) => setAdminCatalogSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>

                          <select
                            value={adminCatalogCategory}
                            onChange={(e) => setAdminCatalogCategory(e.target.value)}
                            className="px-3 py-1.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                          >
                            <option value="Semua">Semua Kategori</option>
                            <option value="Komputer & Laptop">Komputer & Laptop</option>
                            <option value="Server & Storage">Server & Storage</option>
                            <option value="Jaringan & Keamanan">Jaringan & Keamanan</option>
                            <option value="CCTV & Security System">CCTV & Security System</option>
                            <option value="Software & Lisensi">Software & Lisensi</option>
                            <option value="Sistem Integrasi">Sistem Integrasi</option>
                            <option value="Periferal & Aksesoris">Periferal & Aksesoris</option>
                          </select>
                        </div>
                      </div>

                      {/* Responsive Grid/Table List */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                              <th className="py-3 px-5 text-center w-12">No</th>
                              <th className="py-3 px-4">Nama Perangkat</th>
                              <th className="py-3 px-4">Kategori</th>
                              <th className="py-3 px-4">Rentang Estimasi Harga</th>
                              <th className="py-3 px-4 max-w-xs">Detail Spesifikasi Utama</th>
                              <th className="py-3 px-5 text-right w-28">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredAdminCatalog.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                                  Tidak ada item katalog yang sesuai dengan pencarian Anda.
                                </td>
                              </tr>
                            ) : (
                              filteredAdminCatalog.map((item, idx) => {
                                const ItemIcon = (Icons as any)[item.icon || "Package"] || Icons.Package;
                                return (
                                  <tr key={item.id} className="hover:bg-white/5 text-xs text-slate-300 transition-colors">
                                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                                    <td className="py-4 px-4">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                          <ItemIcon className="h-4.5 w-4.5" />
                                        </div>
                                        <div>
                                          <h5 className="font-extrabold text-white text-xs">{item.name}</h5>
                                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="inline-block bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="font-mono font-bold text-amber-400">{item.estimatedPriceRange}</span>
                                    </td>
                                    <td className="py-4 px-4 max-w-xs">
                                      <div className="flex flex-wrap gap-1">
                                        {item.specifications && item.specifications.length > 0 ? (
                                          item.specifications.slice(0, 3).map((spec, sIdx) => (
                                            <span key={sIdx} className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-white/5 truncate max-w-[120px]" title={spec}>
                                              &bull; {spec}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-[9px] text-slate-600 font-mono italic">Tanpa spesifikasi</span>
                                        )}
                                        {item.specifications && item.specifications.length > 3 && (
                                          <span className="text-[9px] text-indigo-400 font-bold px-1 py-0.5">+{item.specifications.length - 3} lagi</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-5 text-right">
                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          onClick={() => {
                                            const filledSpecs = [...item.specifications];
                                            // Pad up to 5 elements for editing inputs
                                            while (filledSpecs.length < 5) {
                                              filledSpecs.push("");
                                            }
                                            setCatalogForm({
                                              id: item.id,
                                              name: item.name,
                                              category: item.category,
                                              description: item.description,
                                              estimatedPriceRange: item.estimatedPriceRange,
                                              icon: item.icon || "Package",
                                              image: item.image || "",
                                              specifications: filledSpecs,
                                            });
                                            setIsAddingCatalog(false);
                                            setIsEditingCatalog(true);
                                            // Scroll form smoothly into view
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                          }}
                                          className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                                          title="Ubah Perangkat"
                                        >
                                          <Icons.Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            if (confirm(`Apakah Anda yakin ingin menghapus "${item.name}" dari katalog?`)) {
                                              setCatalogProducts(prev => prev.filter(p => p.id !== item.id));
                                              showToast(`Berhasil menghapus "${item.name}" dari katalog`, "success");
                                            }
                                          }}
                                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-white rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                                          title="Hapus Perangkat"
                                        >
                                          <Icons.Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================== */}
                {/* ADMIN T4: USER MANAGEMENT PORTAL   */}
                {/* ================================== */}
                {activeAdminSubTab === "users" && adminRole === "superadmin" && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Visual Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                          <Icons.Users className="h-5.5 w-5.5 text-indigo-400" />
                          <span>Manajemen Pengguna & Hak Akses Portal</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Halaman otorisasi khusus Super Admin. Di sini Anda dapat memantau status keaktifan user, mendaftarkan staf baru, dan menangguhkan (suspend) akses portal secara real-time.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingUser(!isAddingUser)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                      >
                        {isAddingUser ? <Icons.X className="h-3.5 w-3.5" /> : <Icons.Plus className="h-3.5 w-3.5" />}
                        <span>{isAddingUser ? "Batal Tambah" : "Tambah Staff Baru"}</span>
                      </button>
                    </div>

                    {/* Expandable Form: Add Staff */}
                    {isAddingUser && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newUserForm.username || !newUserForm.name) {
                            showToast("Semua field pendaftaran wajib diisi!", "error");
                            return;
                          }
                          
                          // Check if username already exists
                          const exists = adminUsers.some(u => u.username.toLowerCase() === newUserForm.username.toLowerCase());
                          if (exists) {
                            showToast("Username tersebut sudah terdaftar!", "error");
                            return;
                          }

                          const newUser = {
                            id: "user_" + Date.now(),
                            username: newUserForm.username.toLowerCase().trim(),
                            name: newUserForm.name.trim(),
                            role: newUserForm.role,
                            status: newUserForm.status,
                            lastLogin: "Belum pernah"
                          };

                          setAdminUsers([...adminUsers, newUser]);
                          showToast(`Staff baru @${newUser.username} berhasil didaftarkan!`, "success");
                          
                          // Reset Form
                          setNewUserForm({ username: "", name: "", role: "sales", status: "active" });
                          setIsAddingUser(false);
                        }}
                        className="bg-slate-900/40 border border-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 space-y-4 animate-slideDown"
                      >
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Icons.Plus className="h-4 w-4" />
                          <span>Formulir Pendaftaran Akun Staff Baru</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Nama Lengkap Staff</label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: Andi Wijaya"
                              value={newUserForm.name}
                              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Username Akses</label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: andi_sales"
                              value={newUserForm.username}
                              onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Hak Akses (Role)</label>
                            <select
                              value={newUserForm.role}
                              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                              className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="superadmin">Super Admin (Akses Penuh)</option>
                              <option value="admin">Admin (Kelola & Kredensial)</option>
                              <option value="sales">Sales (Input RFQ & Quote)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Status Akun</label>
                            <select
                              value={newUserForm.status}
                              onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                              className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="active">Aktif (Bisa Login)</option>
                              <option value="suspended">Ditangguhkan (Suspend)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Icons.Check className="h-4 w-4" />
                            <span>Daftarkan Staff</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Users List Card */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                      <div className="px-5 py-4 bg-white/5 border-b border-white/10">
                        <h4 className="font-extrabold text-white text-sm">Daftar Akun Pengguna Terdaftar</h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-sans">
                          <thead>
                            <tr className="border-b border-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/20">
                              <th className="py-4 px-6">Nama Lengkap</th>
                              <th className="py-4 px-6">Username</th>
                              <th className="py-4 px-6">Level Hak Akses</th>
                              <th className="py-4 px-6">Status Akun</th>
                              <th className="py-4 px-6">Login Terakhir</th>
                              <th className="py-4 px-6 text-right">Aksi Otorisasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs">
                            {adminUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-white/[2%] transition-all">
                                <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-[10px]">
                                    {user.name.charAt(0)}
                                  </div>
                                  <span>{user.name}</span>
                                </td>
                                <td className="py-4 px-6 font-mono text-indigo-300">@{user.username}</td>
                                <td className="py-4 px-6">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                    user.role === "superadmin"
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                                      : user.role === "admin"
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                      : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                  }`}>
                                    {user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Sales"}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    user.status === "active"
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : "bg-red-500/15 text-red-400"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                                    <span>{user.status === "active" ? "Aktif" : "Ditangguhkan"}</span>
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">{user.lastLogin}</td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Disable status toggling or deletion of default/critical accounts to prevent complete self-lockout */}
                                    {["superadmin", "admin", "sales"].includes(user.username) ? (
                                      <span className="text-[10px] text-slate-500 font-mono italic">Protected</span>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = adminUsers.map((u) => {
                                              if (u.id === user.id) {
                                                const nextStatus = u.status === "active" ? "suspended" : "active";
                                                showToast(
                                                  `Akses @${u.username} telah ${nextStatus === "active" ? "diaktifkan kembali" : "ditangguhkan (suspended)"}!`,
                                                  nextStatus === "active" ? "success" : "info"
                                                );
                                                return { ...u, status: nextStatus };
                                              }
                                              return u;
                                            });
                                            setAdminUsers(updated);
                                          }}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                            user.status === "active"
                                              ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400"
                                              : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                                          }`}
                                        >
                                          {user.status === "active" ? "Suspend Access" : "Activate Access"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm(`Apakah Anda yakin ingin menghapus staf ${user.name} (@${user.username})?`)) {
                                              setAdminUsers(adminUsers.filter(u => u.id !== user.id));
                                              showToast(`Staff @${user.username} telah dihapus dari sistem.`, "info");
                                            }
                                          }}
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                                        >
                                          <Icons.Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Security Multi-level ACL Information Card */}
                    <div className="bg-slate-900/25 border border-white/5 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Icons.Shield className="h-4 w-4 text-indigo-400" />
                        <span>Audit Log & Aturan Matriks Hak Akses (ACL)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Sistem Berkah Bintang Solusindo menerapkan pemisahan tugas (Separation of Duties). Hak akses ini disinkronkan secara ketat pada sisi klien dan server:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <div className="p-3 bg-white/[2%] rounded-xl border border-white/5 text-[11px] space-y-1">
                          <span className="font-bold text-indigo-300">Level 3: Super Admin</span>
                          <p className="text-slate-400 leading-tight">Mewakili Direksi/Owner. Memiliki otoritas penuh mutlak, memodifikasi kredensial kop surat, melihat log email, & mengelola pendaftaran atau status penangguhan (suspend) seluruh akun staff.</p>
                        </div>
                        <div className="p-3 bg-white/[2%] rounded-xl border border-white/5 text-[11px] space-y-1">
                          <span className="font-bold text-emerald-300">Level 2: Admin</span>
                          <p className="text-slate-400 leading-tight">Mewakili Procurement Supervisor. Dapat memodifikasi setelan bank, log email terkirim, serta melakukan follow-up terjadwal. Manajemen pengguna dikunci demi keamanan data.</p>
                        </div>
                        <div className="p-3 bg-white/[2%] rounded-xl border border-white/5 text-[11px] space-y-1">
                          <span className="font-bold text-amber-300">Level 1: Sales / Client Partner</span>
                          <p className="text-slate-400 leading-tight">Mewakili Tim Account Executive. Berfokus sepenuhnya dalam menanggapi inquiry RFQ, memicu analisis Gemini AI untuk penawaran harga. Modul kredensial perusahaan, log email, & manajemen user ditutup.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* ==================================== */}
      {/* MODAL VIEW: PRINT QUOTATION SHEET    */}
      {/* ==================================== */}
      {selectedQuotation && (() => {
        const documentSheetContent = (
          <>
            {/* Kop Surat Header */}
            <div className="relative flex justify-between items-start border-b-4 border-double border-slate-900 pb-5 overflow-hidden text-left quotation-header-corporate">
              {/* Subtle Watermark Logo of BBS */}
              <div 
                className="absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-none select-none z-0 print:block"
                style={{
                  filter: "opacity(0.07) grayscale(100%) contrast(120%)",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
              >
                <img 
                  src={settings.logoImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&auto=format&q=80"} 
                  alt="Watermark BBS" 
                  className="w-56 h-56 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1 relative z-10">
                <div className="flex items-center space-x-3">
                  {settings.headerLogoType === "image" ? (
                    <img 
                      src={settings.logoImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&auto=format&q=80"} 
                      alt="Logo Resmi Perusahaan" 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <img 
                        src={settings.logoImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&auto=format&q=80"} 
                        alt="Logo Perusahaan (Placeholder)" 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="w-10 h-10 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-center font-extrabold text-xs shadow shrink-0">
                        {settings.logoText || "BBS"}
                      </div>
                    </div>
                  )}
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
              
              <div className="flex items-start space-x-3 relative z-10">
                {/* QR Code Verification for Procurement & Print Date */}
                <div className="flex items-stretch space-x-2">
                  {(() => {
                    const relatedRfq = rfqs.find(r => r.id === selectedQuotation.rfqId);
                    const rfqNumber = relatedRfq ? relatedRfq.rfqNumber : "N/A";
                    // Using a high-quality, reliable, free public QR code generator API (qrserver)
                    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rfqNumber)}`;
                    return (
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-2xl flex flex-col items-center justify-center shrink-0" id="procurement_qr_verification">
                        <img 
                          src={qrCodeUrl} 
                          alt={`QR Code RFQ ${rfqNumber}`} 
                          className="w-14 h-14 object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-[7px] font-mono font-extrabold text-slate-500 mt-1 uppercase text-center tracking-tight">
                          RFQ: {rfqNumber}
                        </div>
                        <div className="text-[6px] font-sans font-black text-indigo-600 uppercase tracking-wider text-center">
                          VERIFIKASI KANP
                        </div>
                      </div>
                    );
                  })()}

                  {printDate && (
                    <div className="bg-slate-50 border border-slate-200 p-2.5 px-3 rounded-2xl flex flex-col justify-center shrink-0 text-left min-w-[125px] max-w-[150px] shadow-sm" id="print_date_timestamp_container">
                      <span className="text-[7px] uppercase tracking-widest text-indigo-600 font-extrabold block">TANGGAL CETAK</span>
                      <div className="text-[9px] font-mono font-bold text-slate-800 leading-snug mt-1 print-date-text" id="print_date_timestamp_val">
                        {printDate}
                      </div>
                      <span className="text-[6px] text-slate-400 font-medium block mt-1 uppercase tracking-wider">E-DOCUMENT SYSTEM</span>
                    </div>
                  )}
                </div>

                <div className="text-right space-y-1.5 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl min-h-[94px] flex flex-col justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider leading-none">Penawaran Harga</h3>
                  <div className="font-mono text-[10px] text-slate-600 leading-normal text-right">
                    <div>No: <span className="font-bold text-slate-900">{selectedQuotation.quotationNumber}</span></div>
                    <div>Tanggal: <span className="font-bold text-slate-900">{selectedQuotation.date}</span></div>
                    <div>Valid S.D: <span className="font-bold text-red-600">{selectedQuotation.expiryDate}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient / Client details */}
            <div className={`grid gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl ${isMobile ? "grid-cols-1" : "grid-cols-2"} text-left`}>
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
            <p className="text-xs text-slate-700 leading-relaxed italic border-l-4 border-indigo-600 pl-4 bg-slate-50/50 py-2 rounded-r-lg text-left">
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
                      <td className="p-3 space-y-1 text-left">
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
            <div className="flex justify-end pt-3 text-left">
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
            <div className="border-t border-slate-200 pt-5 space-y-2 text-left">
              <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Syarat & Ketentuan Pengadaan (Term):</h4>
              <ol className="list-decimal pl-4 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                {selectedQuotation.termsAndConditions.map((term, index) => (
                  <li key={index}>{term}</li>
                ))}
              </ol>
            </div>

            {/* Signatures & Bank Account */}
            <div className="quotation-print-footer grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100 items-end text-left">
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
          </>
        );

        return (
          <div className={`fixed inset-0 z-50 backdrop-blur-md flex flex-col overflow-y-auto animate-fadeIn ${isPrintPreview ? "bg-slate-900/95 p-0" : "bg-slate-950/80 justify-center p-4"}`} id="quotation_sheet_modal">
            <div className={`transition-all duration-300 font-sans ${isPrintPreview ? "bg-slate-900 text-slate-100 w-full max-w-5xl mx-auto p-0 border-none max-h-none overflow-y-auto relative shadow-2xl" : "bg-white text-slate-900 rounded-3xl w-full max-w-4xl p-6 sm:p-10 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto"}`}>
              
              {/* Modal Controls (Sticky on Top of Modal) */}
              {isPrintPreview ? (
                <div className="sticky top-0 bg-slate-950 border-b border-white/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-30 shadow-xl text-white no-print w-full">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-indigo-600/15 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
                      <Icons.Eye className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 leading-none">
                        <span>Pratinjau Lembar Dokumen A4</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded font-mono uppercase tracking-wider font-extrabold">Dimensi Presisi</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Simulasi cetak A4 100%. Memudahkan pengamatan kop, tabel, & area tanda tangan.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setPrintDate(new Date().toLocaleString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        }) + " WIB");
                        setTimeout(() => {
                          window.print();
                        }, 50);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 border border-indigo-500/20"
                    >
                      <Icons.Printer className="h-3.5 w-3.5" />
                      <span>Cetak Sekarang</span>
                    </button>
                    <button
                      onClick={() => setIsPrintPreview(false)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Icons.X className="h-3.5 w-3.5" />
                      <span>Keluar Pratinjau</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-4 -mt-4 mb-6 border-b border-slate-100 flex items-center justify-between z-20">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                    Kop Dokumen Resmi Berkah Bintang Solusindo
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsPrintPreview(true)}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98]"
                      title="Pratinjau lembar cetak dokumen ukuran A4 penuh"
                    >
                      <Icons.Eye className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Preview Cetak</span>
                    </button>
                    <button 
                      id="btn_export_pdf"
                      onClick={() => {
                        setPrintDate(new Date().toLocaleString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        }) + " WIB");
                        setTimeout(() => {
                          window.print();
                        }, 50);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-1.5 cursor-pointer border border-indigo-500/20"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Export as PDF</span>
                    </button>
                    <button 
                      onClick={() => {
                        setPrintDate(new Date().toLocaleString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        }) + " WIB");
                        setTimeout(() => {
                          window.print();
                        }, 50);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border border-slate-200"
                      title="Cetak Alternatif"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Cetak</span>
                    </button>
                    <button 
                      onClick={() => setSelectedQuotation(null)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all cursor-pointer border border-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Document Sheet Area */}
              {isPrintPreview ? (
                <div className="overflow-x-auto w-full py-8 px-4 flex flex-col items-center bg-slate-900/90 min-h-[80vh] no-print">
                  <div className="text-slate-400 text-[10px] mb-4 text-center sm:hidden flex items-center justify-center gap-1.5 bg-slate-800/85 px-3 py-1.5 rounded-lg border border-white/5 w-full max-w-[210mm]">
                    <Icons.Info className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Geser ke samping untuk melihat seluruh lebar kertas A4</span>
                  </div>
                  <div className="bg-white text-slate-900 shadow-2xl border border-slate-300/80 p-[15mm] sm:p-[20mm] w-[210mm] min-h-[297mm] transition-all relative font-sans shrink-0 print:p-0 print:border-none print:shadow-none space-y-6 text-xs sm:text-sm text-left">
                    {documentSheetContent}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-xs sm:text-sm">
                  {documentSheetContent}
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* ==================================== */}
      {/* MODAL VIEW: PRINT CATALOG PDF SHEET  */}
      {/* ==================================== */}
      {selectedCatalogPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="print-session-catalog">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-4xl p-6 sm:p-10 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto font-sans">
            
            {/* Modal Controls (Sticky on Top of Modal) */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-4 -mt-4 mb-6 border-b border-slate-100 flex items-center justify-between z-20 no-print">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                Katalog Resmi - PT Berkah Bintang Solusindo
              </span>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button 
                  onClick={() => setSelectedCatalogPdf(false)}
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
                  <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-wider">Katalog Perangkat</h3>
                  <div className="font-mono text-[9px] text-slate-600">
                    <div>Kategori: <span className="font-bold text-slate-900">{catalogCategory}</span></div>
                    <div>Tanggal: <span className="font-bold text-slate-900">{new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div>Total Item: <span className="font-bold text-slate-900">{filteredProducts.length} Perangkat</span></div>
                  </div>
                </div>
              </div>

              {/* Title Block */}
              <div className="text-center space-y-1 py-2">
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">Daftar Acuan Spesifikasi & Estimasi Harga Perangkat IT</h2>
                <p className="text-[10px] text-slate-500 italic">Disusun untuk keperluan referensi pengadaan, penyusunan Rencana Anggaran Biaya (RAB), dan pengajuan dokumen RFQ.</p>
              </div>

              {/* Main Catalog Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase font-bold text-[9px] tracking-wider border-b border-slate-200">
                      <th className="p-3 w-16 text-center">
                        <span className="no-print">Pilih / </span>No
                      </th>
                      <th className="p-3 w-20 text-center">Visual</th>
                      <th className="p-3">Detail Perangkat</th>
                      <th className="p-3">Spesifikasi Teknis Utama</th>
                      <th className="p-3 text-right w-40">Estimasi Harga Acuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                          Tidak ada perangkat dalam filter katalog saat ini.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod, index) => (
                        <tr key={prod.id} className="border-b border-slate-100 last:border-b-0 text-xs hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-center text-slate-500 font-mono font-bold">
                            <div className="flex items-center justify-center space-x-2">
                              <input 
                                type="checkbox" 
                                checked={selectedCompareIds.includes(prod.id)}
                                onChange={() => {
                                  if (selectedCompareIds.includes(prod.id)) {
                                    setSelectedCompareIds(prev => prev.filter(id => id !== prod.id));
                                  } else {
                                    if (selectedCompareIds.length >= 3) {
                                      showToast("Maksimal 3 produk dapat dibandingkan sekaligus", "error");
                                      return;
                                    }
                                    setSelectedCompareIds(prev => [...prev, prod.id]);
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 no-print cursor-pointer shrink-0"
                              />
                              <span>{index + 1}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {prod.image ? (
                              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 mx-auto bg-slate-50">
                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 mx-auto text-[10px] font-bold">
                                No Img
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">{prod.name}</h4>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-200 mt-1 inline-block uppercase">
                              {prod.category}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">{prod.description}</p>
                          </td>
                          <td className="p-3">
                            <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-1">
                              {prod.specifications.map((spec, sIdx) => (
                                <li key={sIdx} className="leading-tight">{spec}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 text-xs">
                            <span className="text-indigo-700 bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-1.5 rounded-xl block">
                              {prod.estimatedPriceRange}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes / T&C */}
              <div className="border-t border-slate-200 pt-5 space-y-2">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Catatan Penting Pengadaan (Disclaimer):</h4>
                <ol className="list-decimal pl-4 text-[10px] text-slate-500 space-y-1 leading-relaxed">
                  <li>Estimasi harga acuan di atas bersifat referensi awal (indikatif) dan tidak mengikat secara hukum sebelum terbit dokumen Quotation resmi.</li>
                  <li>Harga riil dipengaruhi oleh kuantitas pemesanan (grosir), ketersediaan stok di distributor pusat, fluktuasi kurs mata uang asing, serta durasi kontrak garansi.</li>
                  <li>Untuk mendapatkan penawaran harga final (Quotation) yang mengikat dengan diskon khusus, silakan klik tombol <strong>"Tambah ke RFQ"</strong> pada produk terkait dan kirimkan form RFQ di aplikasi.</li>
                  <li>Garansi seluruh produk merupakan Garansi Resmi Distributor Utama Indonesia (1-3 tahun tergantung jenis perangkat keras).</li>
                </ol>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100 items-end">
                <div className="text-slate-400 text-[10px] leading-relaxed">
                  <p className="font-bold text-slate-700">Verifikasi Dokumen:</p>
                  <p>ID Katalog: BBS-CAT-{new Date().getFullYear()}-{catalogCategory.substring(0,3).toUpperCase()}</p>
                  <p>Status: <span className="text-emerald-600 font-bold">AKTIF & TERVALIDASI</span></p>
                  <p className="mt-1">Pindai / Cetak langsung dari sistem e-procurement resmi Berkah Bintang Solusindo.</p>
                </div>

                <div className="text-center space-y-1 w-56 ml-auto relative">
                  {/* Mock BBS official stamp */}
                  <div className="absolute top-2 left-6 border-4 border-indigo-500/30 text-indigo-500/30 font-mono text-[10px] font-extrabold uppercase tracking-widest rounded-xl px-4 py-2 transform -rotate-12 select-none pointer-events-none">
                    BBS VALIDATED
                  </div>
                  
                  <p className="text-slate-500 text-[10px] pb-12">Hormat Kami,<br /><strong>PT Berkah Bintang Solusindo</strong></p>
                  
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 text-xs">Departemen Estimasi Procurement</p>
                  <p className="text-[9px] text-slate-400">Berkah Bintang Solusindo</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Floating Compare indicator bar (only visible when items are selected in catalog view) */}
      {selectedCatalogPdf && selectedCompareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-slate-900/95 text-white border border-indigo-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-scaleUp no-print max-w-sm sm:max-w-md">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Icons.GitCompare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{selectedCompareIds.length} Perangkat Dipilih</p>
              <p className="text-[10px] text-slate-400">Bandingkan spesifikasi produk</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Bandingkan
            </button>
            <button
              onClick={() => setSelectedCompareIds([])}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Bersihkan pilihan"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* MODAL VIEW: PRODUCT COMPARISON       */}
      {/* ==================================== */}
      {selectedCatalogPdf && showComparisonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="product_comparison_modal">
          <div className="bg-slate-900 border border-white/10 text-white rounded-3xl w-full max-w-5xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Icons.GitCompare className="h-5 w-5 text-indigo-400 animate-pulse" />
                    Perbandingan Teknis Perangkat
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Analisis dan komparasi spesifikasi detail serta rentang harga acuan secara berdampingan.</p>
                </div>
                <button 
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer border border-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* View Mode Controller */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                    <Icons.Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Mode Detail Spesifikasi</p>
                    <p className="text-[10px] text-slate-400">Pilih antara ringkasan spesifikasi atau detail teknis penuh beserta penjelasan manfaatnya.</p>
                  </div>
                </div>
                <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1 shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => {
                      setComparisonDetailMode("summary");
                      // Simultaneously collapse all products for unified summary feel
                      const collapsed: Record<string, boolean> = {};
                      selectedCompareIds.forEach(id => {
                        collapsed[id] = true;
                      });
                      setCollapsedCompareProductIds(collapsed);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      comparisonDetailMode === "summary"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icons.Layers className="h-3.5 w-3.5" />
                    <span>Tampilan Ringkas</span>
                  </button>
                  <button
                    onClick={() => {
                      setComparisonDetailMode("detail");
                      // Expand all products for detail view
                      setCollapsedCompareProductIds({});
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      comparisonDetailMode === "detail"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icons.BookOpen className="h-3.5 w-3.5" />
                    <span>Detail Teknis Penuh</span>
                  </button>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedCompareIds.map(id => {
                  const prod = catalogProducts.find(p => p.id === id);
                  if (!prod) return null;
                  const isCollapsed = collapsedCompareProductIds[prod.id] ?? (comparisonDetailMode === "summary");
                  return (
                    <div key={prod.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 animate-scaleUp">
                      <div className="space-y-4">
                        {/* Image */}
                        {prod.image && (
                          <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-white/5 relative">
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        
                        <div>
                          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {prod.category}
                          </span>
                          <h4 className="font-extrabold text-white text-base mt-2 line-clamp-1">{prod.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{prod.description}</p>
                        </div>

                        {/* Specs Section */}
                        <div className="border-t border-white/5 pt-4 space-y-3">
                          <button
                            onClick={() => {
                              setCollapsedCompareProductIds(prev => ({
                                ...prev,
                                [prod.id]: !isCollapsed
                              }));
                            }}
                            className="w-full flex items-center justify-between text-[10px] text-slate-400 uppercase font-extrabold tracking-wider hover:text-white transition-colors cursor-pointer group"
                          >
                            <span className="flex items-center gap-1.5">
                              <Icons.Sliders className="h-3.5 w-3.5 text-indigo-400" />
                              Spesifikasi Utama
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-500 normal-case font-normal group-hover:text-slate-300">
                                {isCollapsed ? "lihat detail" : "sembunyikan"}
                              </span>
                              {isCollapsed ? (
                                <Icons.ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform duration-200" />
                              ) : (
                                <Icons.ChevronUp className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform duration-200" />
                              )}
                            </div>
                          </button>

                          {isCollapsed ? (
                            /* Summary specifications list */
                            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 text-xs text-slate-300 space-y-2 animate-fadeIn">
                              <div className="flex items-start gap-2">
                                <Icons.CheckCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                <span className="leading-tight font-medium">{prod.specifications[0]}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic pl-5">
                                + {prod.specifications.length - 1} spesifikasi teknis lainnya disembunyikan.
                              </p>
                            </div>
                          ) : (
                            /* Full specifications list */
                            <div className="space-y-1.5 animate-fadeIn">
                              {prod.specifications.map((spec, sIdx) => {
                                const explanation = getSpecExplanation(spec);
                                return (
                                  <div key={sIdx} className="relative group flex items-start gap-2 text-xs text-slate-200 p-1 hover:bg-white/5 rounded-lg transition-all cursor-help">
                                    <Icons.CheckCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="leading-tight">{spec}</span>
                                    
                                    {/* Floating Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 p-4 bg-slate-950 border border-indigo-500/40 text-slate-100 rounded-2xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 text-xs leading-normal">
                                      <div className="flex items-center gap-1.5 border-b border-indigo-500/20 pb-1.5 mb-1.5 font-bold text-indigo-400">
                                        <Icons.Info className="h-4 w-4" />
                                        <span>{explanation.title}</span>
                                      </div>
                                      <p className="font-semibold text-slate-200 mb-1">{explanation.def}</p>
                                      <p className="text-[10px] text-emerald-400 leading-normal flex gap-1.5 items-start mt-1 bg-emerald-500/5 p-1.5 rounded-lg border border-emerald-500/10">
                                        <Icons.TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span><strong>Manfaat:</strong> {explanation.benefit}</span>
                                      </p>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="border-t border-white/5 pt-4 mt-auto">
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl mb-4">
                          <span className="text-[9px] text-slate-500 uppercase block font-mono">Estimasi Harga Acuan</span>
                          <span className="text-xs font-extrabold text-amber-400">{prod.estimatedPriceRange}</span>
                        </div>

                        <button
                          onClick={() => {
                            addToCart(prod);
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Pilih Perangkat Ini</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Placeholder empty states if < 3 products selected */}
                {Array.from({ length: Math.max(0, 3 - selectedCompareIds.length) }).map((_, idx) => (
                  <div key={idx} className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-500 space-y-2 min-h-[300px] bg-white/5">
                    <Icons.PlusCircle className="h-8 w-8 text-slate-600 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400">Slot Perbandingan Kosong</p>
                    <p className="text-[10px] text-slate-500 max-w-[160px]">Centang produk di bawah No pada tabel katalog untuk membandingkan secara langsung.</p>
                  </div>
                ))}
              </div>

              {/* Matrix Table */}
              {(() => {
                const selectedProducts = selectedCompareIds
                  .map(id => catalogProducts.find(p => p.id === id))
                  .filter((p): p is ProductItem => !!p);

                if (selectedProducts.length === 0) return null;

                const comparisonRows = [
                  {
                    label: "Kategori Perangkat",
                    getValue: (p: ProductItem) => p.category,
                  },
                  {
                    label: "Estimasi Rentang Harga",
                    getValue: (p: ProductItem) => p.estimatedPriceRange,
                  },
                  ...(comparisonDetailMode === "detail" ? [
                    {
                      label: "Spesifikasi Teknis Utama #1",
                      getValue: (p: ProductItem) => p.specifications[0] || "-",
                    },
                    {
                      label: "Spesifikasi Teknis Utama #2",
                      getValue: (p: ProductItem) => p.specifications[1] || "-",
                    },
                    {
                      label: "Spesifikasi Teknis Utama #3",
                      getValue: (p: ProductItem) => p.specifications[2] || "-",
                    },
                  ] : []),
                ];

                return (
                  <div className="mt-8 border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40">
                    <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Icons.Sliders className="h-4 w-4 text-indigo-400" />
                        Matriks Deteksi Perbedaan Spesifikasi
                      </h4>
                      <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <Icons.AlertCircle className="h-3 w-3 shrink-0" />
                        Baris yang disorot kuning memiliki spesifikasi berbeda
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-white/5 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/10">
                            <th className="p-3.5 w-1/4">Parameter</th>
                            {selectedProducts.map(prod => (
                              <th key={prod.id} className="p-3.5 w-1/4 text-indigo-300 font-bold">
                                {prod.name}
                              </th>
                            ))}
                            {Array.from({ length: Math.max(0, 3 - selectedProducts.length) }).map((_, idx) => (
                              <th key={idx} className="p-3.5 w-1/4 text-slate-600 italic">
                                (Slot Kosong)
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map((row, rIdx) => {
                            const values = selectedProducts.map(p => row.getValue(p));
                            const cleanValues = values.map(v => v.trim().toLowerCase());
                            const isDifferent = selectedProducts.length > 1 && new Set(cleanValues).size > 1;

                            return (
                              <tr 
                                key={rIdx} 
                                className={`border-b border-white/5 transition-colors text-xs ${
                                  isDifferent 
                                    ? "bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500" 
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <td className="p-3.5 font-bold text-slate-300 flex items-center justify-between gap-2">
                                  <span>{row.label}</span>
                                  {isDifferent && (
                                    <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                      Berbeda
                                    </span>
                                  )}
                                </td>
                                {selectedProducts.map(p => {
                                  const val = row.getValue(p);
                                  const isSpecRow = row.label.startsWith("Spesifikasi");
                                  const explanation = isSpecRow && val !== "-" ? getSpecExplanation(val) : null;

                                  return (
                                    <td 
                                      key={p.id} 
                                      className={`p-3.5 relative group transition-colors duration-200 ${
                                        isDifferent 
                                          ? "text-amber-200 font-medium" 
                                          : "text-slate-300"
                                      } ${explanation ? "cursor-help hover:bg-white/5" : ""}`}
                                    >
                                      <span>{val}</span>
                                      {explanation && (
                                        /* Floating Tooltip */
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 p-4 bg-slate-950 border border-indigo-500/40 text-slate-100 rounded-2xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 text-xs leading-normal">
                                          <div className="flex items-center gap-1.5 border-b border-indigo-500/20 pb-1.5 mb-1.5 font-bold text-indigo-400">
                                            <Icons.Info className="h-4 w-4" />
                                            <span>{explanation.title}</span>
                                          </div>
                                          <p className="font-semibold text-slate-200 mb-1 text-left">{explanation.def}</p>
                                          <p className="text-[10px] text-emerald-400 leading-normal flex gap-1.5 items-start mt-1 bg-emerald-500/5 p-1.5 rounded-lg border border-emerald-500/10 text-left">
                                            <Icons.TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                            <span><strong>Manfaat:</strong> {explanation.benefit}</span>
                                          </p>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                                {Array.from({ length: Math.max(0, 3 - selectedProducts.length) }).map((_, idx) => (
                                  <td key={idx} className="p-3.5 text-slate-600 italic">
                                    -
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 mt-8 flex justify-between items-center text-xs text-slate-400">
              <span>Bandingkan hingga maksimal 3 perangkat berdampingan.</span>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all cursor-pointer"
              >
                Tutup Perbandingan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Style injection to handle beautiful PDF Printing */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide EVERYTHING in the application body first */
          #root > *:not(#quotation_sheet_modal):not(#print-session-catalog),
          header, footer, nav, aside, 
          .fixed.inset-0:not(#quotation_sheet_modal):not(#print-session-catalog) {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* Ensure either modal matches full page width on print */
          #quotation_sheet_modal, #print-session-catalog {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            z-index: 9999999 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          #quotation_sheet_modal > div, #print-session-catalog > div {
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
          }
          /* Hide button UI, controls, and browser-specific dialog headers */
          .no-print, button, .sticky, svg {
            display: none !important;
          }
          /* High quality colors force print */
          .bg-slate-50 {
            background-color: #f8fafc !important;
          }
          .bg-indigo-50 {
            background-color: #f0f9ff !important;
          }
          .text-indigo-700 {
            color: #0369a1 !important;
          }
          .border-slate-200 {
            border-color: #e2e8f0 !important;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          .quotation-print-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 2.5rem !important;
          }
          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }
          .quotation-header-corporate .print-date-text {
            font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
            letter-spacing: 0.05em !important;
            font-weight: 600 !important;
          }
        }
      `}</style>

      {/* OAUTH POPUP MODAL OVERLAY */}
      {oauthModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Header with Provider Branding */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/30">
              <div className="flex items-center space-x-2">
                {oauthModal.provider === "google" && (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.97 3.08C6.18 7.73 8.86 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.66-2.32 3.49v2.9h3.75c2.2-2.02 3.63-5 3.63-8.54z" />
                      <path fill="#FBBC05" d="M5.21 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.24 6.64C.45 8.24 0 10.07 0 12s.45 3.76 1.24 5.36l3.97-3.08z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.75-2.9c-1.04.7-2.37 1.11-3.96 1.11-3.14 0-5.82-2.69-6.79-5.76l-3.97 3.08C3.2 20.27 7.24 23 12 23z" />
                    </svg>
                    <span className="font-extrabold text-white text-xs tracking-wider uppercase">Otentikasi Akun Google</span>
                  </>
                )}
                {oauthModal.provider === "github" && (
                  <>
                    <Icons.Github className="h-5 w-5 text-white" />
                    <span className="font-extrabold text-white text-xs tracking-wider uppercase">Otentikasi Akun GitHub</span>
                  </>
                )}
                {oauthModal.provider === "microsoft" && (
                  <>
                    <svg className="h-4.5 w-4.5" viewBox="0 0 23 23">
                      <rect x="0" y="0" width="11" height="11" fill="#F25022" />
                      <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
                      <rect x="0" y="12" width="11" height="11" fill="#01A6F0" />
                      <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
                    </svg>
                    <span className="font-extrabold text-white text-xs tracking-wider uppercase text-slate-200">Otentikasi Akun Microsoft</span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setOauthModal({ isOpen: false, provider: null })}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>

            {/* Loading Overlay */}
            {oauthLoading && (
              <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center space-y-4 p-6 text-center backdrop-blur-sm">
                <Icons.RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                <div className="space-y-1">
                  <p className="font-extrabold text-white text-xs uppercase tracking-wider">Menghubungkan Otorisasi API...</p>
                  <p className="text-[10px] text-slate-400">Sedang memverifikasi token pengenal pihak ketiga dengan sistem BBS</p>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6">
              {oauthStep === "select" ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-2">
                    <p className="text-slate-300 text-xs font-medium">Pilih akun untuk melanjutkan ke:</p>
                    <h4 className="text-white text-sm font-extrabold">Portal Penawaran & Procurement BBS</h4>
                  </div>

                  {/* Account Options List */}
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {oauthModal.provider === "google" && (
                      <>
                        <button
                          onClick={() => handleOauthLogin({ name: "Arif Suharyadi", username: "superadmin", role: "superadmin" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">AS</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Arif Suharyadi</p>
                              <p className="text-[10px] text-slate-400 font-mono">arif.suharyadi.bbs@gmail.com</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Super Admin</span>
                        </button>

                        <button
                          onClick={() => handleOauthLogin({ name: "Fina Karlina", username: "admin", role: "admin" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-300">FK</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Fina Karlina</p>
                              <p className="text-[10px] text-slate-400 font-mono">fina.karlina.bbs@gmail.com</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                        </button>

                        <button
                          onClick={() => handleOauthLogin({ name: "Azka Rafassya", username: "sales", role: "sales" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300">AR</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Azka Rafassya</p>
                              <p className="text-[10px] text-slate-400 font-mono">azka.rafassya.bbs@gmail.com</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Sales</span>
                        </button>
                      </>
                    )}

                    {oauthModal.provider === "github" && (
                      <>
                        <button
                          onClick={() => handleOauthLogin({ name: "Arif Suharyadi", username: "superadmin", role: "superadmin" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">AS</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">arif_suharyadi</p>
                              <p className="text-[10px] text-slate-400 font-mono">github.com/arif-suharyadi</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Super Admin</span>
                        </button>

                        <button
                          onClick={() => handleOauthLogin({ name: "Fina Karlina", username: "admin", role: "admin" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-300">FK</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">fina_karlina_bbs</p>
                              <p className="text-[10px] text-slate-400 font-mono">github.com/fina-karlina</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                        </button>

                        <button
                          onClick={() => handleOauthLogin({ name: "Azka Rafassya", username: "sales", role: "sales" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300">AR</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">azka_rafassya</p>
                              <p className="text-[10px] text-slate-400 font-mono">github.com/azka-rafassya</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Sales</span>
                        </button>
                      </>
                    )}

                    {oauthModal.provider === "microsoft" && (
                      <>
                        <button
                          onClick={() => handleOauthLogin({ name: "Arif Suharyadi", username: "superadmin", role: "superadmin" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">AS</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Arif Suharyadi</p>
                              <p className="text-[10px] text-slate-400 font-mono">arif.suharyadi@outlook.com</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Super Admin</span>
                        </button>

                        <button
                          onClick={() => handleOauthLogin({ name: "Fina Karlina", username: "admin", role: "admin" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-300">FK</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Fina Karlina</p>
                              <p className="text-[10px] text-slate-400 font-mono">fina.karlina@outlook.com</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                        </button>

                        <button
                          onClick={() => handleOauthLogin({ name: "Azka Rafassya", username: "sales", role: "sales" })}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300">AR</div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Azka Rafassya</p>
                              <p className="text-[10px] text-slate-400 font-mono">azka.rafassya@outlook.com</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Sales</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Option to use custom dynamic account */}
                  <div className="border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => setOauthStep("custom")}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Icons.UserPlus className="h-4 w-4 text-indigo-400" />
                      <span>Hubungkan Akun Custom Baru...</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Dynamic Custom Account Sign-In / Sign-Up Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!oauthNewName.trim() || !oauthNewEmail.trim()) {
                      showToast("Harap isi semua kolom!", "error");
                      return;
                    }
                    const dynamicUsername = oauthNewEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
                    handleOauthLogin({
                      name: oauthNewName.trim(),
                      username: dynamicUsername || "oauth_user",
                      role: oauthNewRole
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-1 mb-2">
                    <p className="text-slate-300 text-xs font-medium">Masuk Secara Instan via</p>
                    <h4 className="text-indigo-400 text-xs font-extrabold uppercase tracking-widest">{oauthModal.provider} Linker</h4>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Nama Lengkap Anda</label>
                    <input
                      type="text"
                      placeholder="Contoh: Andi Wijaya"
                      value={oauthNewName}
                      onChange={(e) => setOauthNewName(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                      {oauthModal.provider === "github" ? "GitHub Username / Email" : `Alamat Email ${oauthModal.provider === "google" ? "Google" : "Microsoft"}`}
                    </label>
                    <input
                      type="text"
                      placeholder={oauthModal.provider === "github" ? "Contoh: andiwijaya99" : `Contoh: andiwijaya@${oauthModal.provider === "google" ? "gmail" : "outlook"}.com`}
                      value={oauthNewEmail}
                      onChange={(e) => setOauthNewEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Pilih Hak Akses (Role)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["superadmin", "admin", "sales"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setOauthNewRole(r)}
                          className={`py-2 rounded-xl text-center text-[10px] font-bold transition-all border cursor-pointer uppercase ${
                            oauthNewRole === r
                              ? r === "superadmin"
                                ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                : r === "admin"
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                : "bg-amber-500/20 border-amber-500 text-amber-300"
                              : "bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {r === "superadmin" ? "S. Admin" : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOauthStep("select")}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Hubungkan Sesi &rarr;
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
