import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
  Award,
  ChevronDown,
  QrCode
} from "lucide-react";
import Navbar from "./components/Navbar";
import ManualScheduleForm from "./components/ManualScheduleForm";
import RfqAnalytics from "./components/RfqAnalytics";
import BarcodeScanner from "./components/BarcodeScanner";
import ProductDetailModal from "./components/ProductDetailModal";
import { SERVICE_OFFERINGS, PRODUCT_CATALOG } from "./data";
import { 
  CompanySettings, 
  RFQ, 
  Quotation, 
  ProductItem, 
  RFQItem, 
  ConsultMessage,
  QuickTopic
} from "./types";

// Dynamic Icon Component for rendering dynamic icons from data safely
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className} />;
}

// Get numeric barcode simulation mapping for products
function getBarcodeValue(productId: string) {
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
  return mockBarcodes[productId] || `BBS-${productId.toUpperCase()}`;
}

// Barcode rendering component for printing and previewing
function BarcodeSVG({ value }: { value: string }) {
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    // Determine bar and space widths based on character code
    const barWidth = (charCode % 3) + 1; // 1, 2, or 3
    const spaceWidth = ((charCode >> 1) % 2) + 1; // 1 or 2
    bars.push(barWidth);
    bars.push(spaceWidth);
  }
  
  // Guard bars at start and end
  const finalBars = [1, 1, 1, ...bars, 1, 1, 1];
  const totalWidth = finalBars.reduce((acc, w) => acc + w, 0);
  
  let currentX = 0;
  return (
    <svg className="w-full h-12" viewBox={`0 0 ${totalWidth} 40`} preserveAspectRatio="none">
      <g fill="currentColor">
        {finalBars.map((width, idx) => {
          const x = currentX;
          currentX += width;
          // Alternate black and white bars (idx % 2 === 0 are black bars, odd are white spaces)
          if (idx % 2 === 0) {
            return (
              <rect
                key={idx}
                x={x}
                y="0"
                width={width}
                height="40"
              />
            );
          }
          return null;
        })}
      </g>
    </svg>
  );
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

  // Keyboard shortcut 'S' / 's' to focus and trigger BarcodeScanner modal when catalog is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger only if current tab is landing (where catalog section is active)
      if (currentTab !== "landing") return;

      // Avoid triggering when user is typing inside input/textarea/select or contenteditable elements
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.hasAttribute("contenteditable"))
      ) {
        return;
      }

      // Check if 's' or 'S' is pressed
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setIsScannerOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentTab]);

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "Berkah Bintang Solusindo",
    tagline: "Solusi Teknologi Informasi dan Pengadaan Terpercaya",
    description: "Melayani kebutuhan pengadaan perangkat IT, infrastruktur jaringan, server, CCTV, software, maintenance, serta konsultasi teknologi informasi untuk perusahaan, lembaga pendidikan, bisnis, dan UMKM.",
    address: "Jl.Raya Cempaka No 10 Jakarta",
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
    },
    customRfqStatuses: []
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
    serialNumber?: string;
  }>({
    id: "",
    name: "",
    category: "Server & Storage",
    description: "",
    estimatedPriceRange: "Rp 5.000.000 - Rp 10.000.000",
    icon: "Server",
    image: "",
    specifications: ["", "", "", "", ""],
    serialNumber: "",
  });
  const [isEditingCatalog, setIsEditingCatalog] = useState(false);
  const [isAddingCatalog, setIsAddingCatalog] = useState(false);
  const [adminCatalogSearch, setAdminCatalogSearch] = useState("");
  const [adminCatalogCategory, setAdminCatalogCategory] = useState("Semua");

  const [rfqCart, setRfqCart] = useState<{ product: ProductItem; quantity: number }[]>(() => {
    try {
      const saved = localStorage.getItem("bbs_rfq_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading rfqCart from localStorage", e);
      return [];
    }
  });
  const [customCartItems, setCustomCartItems] = useState<RFQItem[]>(() => {
    try {
      const saved = localStorage.getItem("bbs_custom_cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading customCartItems from localStorage", e);
      return [];
    }
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ProductItem | null>(null);
  const [showSubtotalBreakdown, setShowSubtotalBreakdown] = useState(false);

  // Deep linking to product details or comparison via query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get("product");
    const compareParam = params.get("compare");
    
    if (prodId && catalogProducts) {
      const found = catalogProducts.find(p => p.id === prodId);
      if (found) {
        setSelectedDetailProduct(found);
      }
    }
    
    if (compareParam && catalogProducts) {
      const ids = compareParam.split(",").filter(id => catalogProducts.some(p => p.id === id));
      if (ids.length > 0) {
        setSelectedCompareIds(ids);
        setShowComparisonModal(true);
      }
    }
  }, [catalogProducts]);
  
  // Custom item adding inputs
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemDesc, setCustomItemDesc] = useState("");
  const [customItemSerial, setCustomItemSerial] = useState("");

  // API Lists
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedRfqIds, setSelectedRfqIds] = useState<string[]>([]);
  const [selectedHistoryRfq, setSelectedHistoryRfq] = useState<RFQ | null>(null);
  
  // Loading & status flags
  const [loading, setLoading] = useState(false);
  const [submittingRfq, setSubmittingRfq] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [generatingQuoteId, setGeneratingQuoteId] = useState<string | null>(null);
  
  // Toasts
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Client RFQ Form Inputs
  const [rfqForm, setRfqForm] = useState(() => {
    const defaultForm = {
      clientName: "",
      companyName: "",
      whatsapp: "",
      email: "",
      address: "",
      clientCategory: "perusahaan" as "perusahaan" | "pemerintah" | "pendidikan" | "umkm" | "retail",
      customRequirements: ""
    };
    try {
      const saved = localStorage.getItem("bbs_rfq_form");
      return saved ? JSON.parse(saved) : defaultForm;
    } catch (e) {
      console.error("Error reading rfqForm from localStorage", e);
      return defaultForm;
    }
  });

  // Auto-save RFQ form, standard cart, and custom cart items state to localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem("bbs_rfq_cart", JSON.stringify(rfqCart));
        localStorage.setItem("bbs_custom_cart_items", JSON.stringify(customCartItems));
        localStorage.setItem("bbs_rfq_form", JSON.stringify(rfqForm));
      } catch (e) {
        console.error("Error auto-saving state to localStorage", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [rfqCart, customCartItems, rfqForm]);
  const [emailError, setEmailError] = useState("");

  // Budget threshold and estimation state
  const [budgetThreshold, setBudgetThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("bbs_budget_threshold");
      return saved ? parseInt(saved, 10) : 100000000; // default 100 million IDR
    } catch (e) {
      return 100000000;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bbs_budget_threshold", budgetThreshold.toString());
    } catch (e) {
      console.error("Error saving budgetThreshold to localStorage", e);
    }
  }, [budgetThreshold]);

  const estimatedCartTotal = useMemo(() => {
    const parsePrice = (priceRange: string): number => {
      const firstPart = priceRange.split("-")[0] || "";
      const clean = firstPart.replace(/\D/g, "");
      const num = parseInt(clean, 10);
      return isNaN(num) ? 0 : num;
    };

    let total = 0;
    rfqCart.forEach((item) => {
      const price = parsePrice(item.product.estimatedPriceRange);
      total += price * item.quantity;
    });
    customCartItems.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      const matched = catalogProducts.find((p) => {
        const pNameLower = p.name.toLowerCase();
        return pNameLower.includes(itemNameLower) || itemNameLower.includes(pNameLower);
      });
      let price = matched ? parsePrice(matched.estimatedPriceRange) : 5000000;
      if (price === 0) price = 5000000;
      total += price * item.quantity;
    });
    return total;
  }, [rfqCart, customCartItems, catalogProducts]);

  const isBudgetExceeded = useMemo(() => {
    return (rfqCart.length > 0 || customCartItems.length > 0) && estimatedCartTotal > budgetThreshold;
  }, [estimatedCartTotal, budgetThreshold, rfqCart, customCartItems]);

  // Admin Portal Auth (just a simple lock to simulate security)
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"rfqs" | "quotations" | "emails" | "reminders" | "settings" | "users" | "catalog">("rfqs");
  const [adminRfqSearch, setAdminRfqSearch] = useState("");
  const [newCustomStatusName, setNewCustomStatusName] = useState("");
  const [newCustomStatusColor, setNewCustomStatusColor] = useState("purple");
  const [adminRfqClientFilter, setAdminRfqClientFilter] = useState("");
  const [adminRfqStartDate, setAdminRfqStartDate] = useState("");
  const [adminRfqEndDate, setAdminRfqEndDate] = useState("");
  const [adminRfqStatuses, setAdminRfqStatuses] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("bbs_admin_rfq_statuses");
      if (stored) {
        return JSON.parse(stored);
      }
      // Backward compatibility check
      const legacy = localStorage.getItem("bbs_admin_rfq_status");
      return legacy ? [legacy] : [];
    } catch (e) {
      console.error("Error reading adminRfqStatuses from localStorage", e);
      return [];
    }
  });

  // Persist adminRfqStatuses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bbs_admin_rfq_statuses", JSON.stringify(adminRfqStatuses));
    } catch (e) {
      console.error("Error writing adminRfqStatuses to localStorage", e);
    }
  }, [adminRfqStatuses]);

  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [hoveredStatusItem, setHoveredStatusItem] = useState<string | null>(null);
  const [statusKeywordSearch, setStatusKeywordSearch] = useState("");
  const [draggingStatus, setDraggingStatus] = useState<string | null>(null);
  const [legendStatusOrder, setLegendStatusOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("bbs_rfq_status_priority");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading rfq_status_priority", e);
    }
    return ["pending", "processing", "quoted", "completed", "cancelled"];
  });

  const orderedLegendStatuses = useMemo(() => {
    const defaultStatuses = [
      { value: "pending", label: "Amber = Pending", color: "amber", isCustom: false },
      { value: "processing", label: "Biru = Processing", color: "blue", isCustom: false },
      { value: "quoted", label: "Indigo = Quoted", color: "indigo", isCustom: false },
      { value: "completed", label: "Hijau = Completed", color: "emerald", isCustom: false },
      { value: "cancelled", label: "Merah = Cancelled", color: "rose", isCustom: false },
    ];
    
    const customStatuses = (settings.customRfqStatuses || []).map(cs => ({
      value: cs.value,
      label: cs.label,
      color: cs.color || "#a855f7",
      isCustom: true
    }));
    
    const allStatuses = [...defaultStatuses, ...customStatuses];
    
    return [...allStatuses].sort((a, b) => {
      let idxA = legendStatusOrder.indexOf(a.value);
      let idxB = legendStatusOrder.indexOf(b.value);
      if (idxA === -1) idxA = 9999;
      if (idxB === -1) idxB = 9999;
      return idxA - idxB;
    });
  }, [settings.customRfqStatuses, legendStatusOrder]);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  // Subtle pulse animation state whenever applied filters change
  const [isFilterPulsing, setIsFilterPulsing] = useState(false);

  useEffect(() => {
    setIsFilterPulsing(true);
    const timer = setTimeout(() => setIsFilterPulsing(false), 800);
    return () => clearTimeout(timer);
  }, [adminRfqSearch, adminRfqStartDate, adminRfqEndDate, adminRfqClientFilter, adminRfqStatuses, statusKeywordSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setIsStatusFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
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

  // Online Store & Directly Buy State
  const [orders, setOrders] = useState<any[]>([]);
  const [shopCart, setShopCart] = useState<{ product: ProductItem; quantity: number }[]>(() => {
    try {
      const saved = localStorage.getItem("bbs_shop_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({
    clientName: "",
    companyName: "",
    whatsapp: "",
    email: "",
    address: "",
    deliveryMethod: "bbs_delivery", // bbs_delivery, jne, TIKI, pickup
    paymentMethod: "bank_transfer" // bank_transfer, virtual_account, credit_card
  });
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<any | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [adminOrderSearch, setAdminOrderSearch] = useState("");
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState("Semua");
  const [adminOrderPaymentFilter, setAdminOrderPaymentFilter] = useState("Semua");
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<any | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("bbs_shop_cart", JSON.stringify(shopCart));
    } catch (e) {
      console.error("Error saving shopCart to localStorage", e);
    }
  }, [shopCart]);
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

  // Comment states
  const [readCommentsMap, setReadCommentsMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("rfq_read_comments_counts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const markRfqCommentsAsRead = (rfqId: string, count: number) => {
    setReadCommentsMap(prev => {
      const next = { ...prev, [rfqId]: count };
      try {
        localStorage.setItem("rfq_read_comments_counts", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const [selectedCommentRfq, setSelectedCommentRfqState] = useState<RFQ | null>(null);

  // Comment Camera and Image Attachments
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access failed, falling back to file input", err);
      showToast("Akses kamera langsung ditolak atau tidak didukung. Membuka pemilih file/kamera bawaan...", "info");
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setCapturedImage(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max_width = 800;
          const max_height = 600;
          let width = img.width;
          let height = img.height;
          if (width > max_width || height > max_height) {
            if (width > height) {
              height = Math.round((height * max_width) / width);
              width = max_width;
            } else {
              width = Math.round((width * max_height) / height);
              height = max_height;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setCapturedImage(canvas.toDataURL("image/jpeg", 0.6));
          } else {
            setCapturedImage(result);
          }
        };
        img.onerror = () => {
          setCapturedImage(result);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const setSelectedCommentRfq = (rfq: RFQ | null) => {
    setSelectedCommentRfqState(rfq);
    if (rfq) {
      markRfqCommentsAsRead(rfq.id, rfq.internalComments?.length || 0);
    } else {
      stopCamera();
      setCapturedImage(null);
    }
  };

  const [commentInput, setCommentInput] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const handlePostComment = async () => {
    if ((!commentInput.trim() && !capturedImage) || !selectedCommentRfq) return;
    setIsPostingComment(true);
    try {
      const newComment = {
        id: "c_" + Date.now(),
        author: adminDisplayName || adminUsername || "Staf BBS",
        role: adminRole || "staff",
        text: commentInput.trim(),
        timestamp: new Date().toISOString(),
        imageUrl: capturedImage || undefined
      };
      const updatedComments = [...(selectedCommentRfq.internalComments || []), newComment];
      
      const res = await fetch(`/api/rfqs/${selectedCommentRfq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalComments: updatedComments })
      });

      if (res.ok) {
        const updatedRfq = { ...selectedCommentRfq, internalComments: updatedComments };
        setRfqs(prevRfqs => prevRfqs.map(r => r.id === selectedCommentRfq.id ? updatedRfq : r));
        setSelectedCommentRfq(updatedRfq);
        setCommentInput("");
        setCapturedImage(null);
        showToast("Komentar internal berhasil ditambahkan!", "success");
      } else {
        showToast("Gagal mengirim komentar", "error");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      showToast("Koneksi API bermasalah", "error");
    } finally {
      setIsPostingComment(false);
    }
  };
  
  useEffect(() => {
    if (!selectedQuotation) {
      setIsPrintPreview(false);
    }
  }, [selectedQuotation]);

  const [printDate, setPrintDate] = useState<string>("");
  const [showPrintQrCode, setShowPrintQrCode] = useState(true);
  const [successRfqNumber, setSuccessRfqNumber] = useState<string | null>(null);
  const [selectedCatalogPdf, setSelectedCatalogPdf] = useState(false);
  const [isCatalogMenuOpen, setIsCatalogMenuOpen] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [showQrCardModal, setShowQrCardModal] = useState(false);
  const [showQrInPdf, setShowQrInPdf] = useState(true);
  const [qrCardTheme, setQrCardTheme] = useState<"indigo" | "emerald" | "slate" | "amber">("emerald");
  const [qrCardSize, setQrCardSize] = useState<"standard" | "badge" | "large">("standard");
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [pdfPreviewPage, setPdfPreviewPage] = useState(1);
  const [pdfPreviewZoom, setPdfPreviewZoom] = useState(100);
  const catalogMenuRef = useRef<HTMLDivElement>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [selectedQrProduct, setSelectedQrProduct] = useState<ProductItem | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [barcodeSize, setBarcodeSize] = useState<"small" | "medium" | "large">("medium");
  const [barcodeLayout, setBarcodeLayout] = useState<"grid" | "roll">("grid");
  const [showCompany, setShowCompany] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showId, setShowId] = useState(true);
  const [printItemsList, setPrintItemsList] = useState<string[]>([]);
  const [printSearch, setPrintSearch] = useState("");
  const [comparisonDetailMode, setComparisonDetailMode] = useState<"summary" | "detail">("detail");
  const [collapsedCompareProductIds, setCollapsedCompareProductIds] = useState<Record<string, boolean>>({});
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

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

  // Quick Topics State & Actions
  const [quickTopics, setQuickTopics] = useState<QuickTopic[]>(() => {
    const defaultTopics: QuickTopic[] = [
      {
        id: "topic-1",
        emoji: "💻",
        title: "Laptop & PC Bisnis",
        prompt: "Rekomendasikan spesifikasi komputer kantor standar administrasi dan laptop bisnis direktur beserta estimasi budgetnya.",
        description: "Minta rekomendasi brand, RAM, SSD, & processor.",
        isCustom: false
      },
      {
        id: "topic-2",
        emoji: "🌐",
        title: "Rancangan Jaringan LAN",
        prompt: "Kami memiliki kantor 2 lantai dengan luas 200m2 dan 35 karyawan. Berapa jumlah Access Point Wifi dan tipe Switch manageable Mikrotik yang paling ideal?",
        description: "Estimasi AP Wifi Ubiquiti / Router Mikrotik.",
        isCustom: false
      },
      {
        id: "topic-3",
        emoji: "🛡️",
        title: "Kebutuhan CCTV & Security",
        prompt: "Berapa biaya pengadaan CCTV 8 titik IP camera Hikvision lengkap dengan NVR, Harddisk khusus surveillance, dan instalasi kabel konduit rapi?",
        description: "Detail IP Cam dome indoor vs outdoor.",
        isCustom: false
      },
      {
        id: "topic-4",
        emoji: "🔧",
        title: "Kontrak Maintenance & SLA",
        prompt: "Bagaimana skema kontrak SLA Maintenance rutin untuk perawatan 15 PC dan 1 Server kantor? Apa saja layanan purna jual yang didapatkan?",
        description: "Skema pembersihan fisik, backup, remote support.",
        isCustom: false
      }
    ];
    try {
      const stored = localStorage.getItem("bbs_custom_quick_topics");
      if (stored) {
        const custom: QuickTopic[] = JSON.parse(stored);
        return [...defaultTopics, ...custom];
      }
      return defaultTopics;
    } catch (e) {
      return defaultTopics;
    }
  });

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicEmoji, setNewTopicEmoji] = useState("💡");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicPrompt, setNewTopicPrompt] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");

  const handleAddQuickTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicPrompt.trim()) {
      showToast("Judul dan isi prompt topik wajib diisi!", "error");
      return;
    }

    const newTopic: QuickTopic = {
      id: `custom-topic-${Date.now()}`,
      emoji: newTopicEmoji.trim() || "💡",
      title: newTopicTitle.trim(),
      prompt: newTopicPrompt.trim(),
      description: newTopicDescription.trim() || "Topik konsultasi custom.",
      isCustom: true
    };

    const updated = [...quickTopics, newTopic];
    setQuickTopics(updated);
    
    // Save only custom ones to localStorage
    const customOnly = updated.filter(t => t.isCustom);
    localStorage.setItem("bbs_custom_quick_topics", JSON.stringify(customOnly));

    // Reset fields
    setNewTopicEmoji("💡");
    setNewTopicTitle("");
    setNewTopicPrompt("");
    setNewTopicDescription("");
    setIsAddingTopic(false);
    showToast("Topik cepat custom berhasil ditambahkan!", "success");
  };

  const handleDeleteQuickTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering select topic click
    const updated = quickTopics.filter(t => t.id !== id);
    setQuickTopics(updated);

    const customOnly = updated.filter(t => t.isCustom);
    localStorage.setItem("bbs_custom_quick_topics", JSON.stringify(customOnly));
    showToast("Topik cepat berhasil dihapus!", "success");
  };

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
      if (catalogMenuRef.current && !catalogMenuRef.current.contains(event.target as Node)) {
        setIsCatalogMenuOpen(false);
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
    fetchOrders();
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

  const uniqueClientsAndCompanies = useMemo(() => {
    const names = new Set<string>();
    rfqs.forEach((rfq) => {
      if (rfq.clientName) names.add(rfq.clientName.trim());
      if (rfq.companyName) names.add(rfq.companyName.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, "id"));
  }, [rfqs]);

  const selectedClientRfqs = useMemo(() => {
    if (!adminRfqClientFilter) return [];
    if (adminRfqClientFilter.startsWith("cat:")) {
      const cat = adminRfqClientFilter.substring(4);
      return rfqs.filter((rfq) => rfq.clientCategory === cat);
    }
    const target = adminRfqClientFilter.toLowerCase().trim();
    return rfqs.filter((rfq) => {
      const matchClient = rfq.clientName && rfq.clientName.toLowerCase().trim() === target;
      const matchCompany = rfq.companyName && rfq.companyName.toLowerCase().trim() === target;
      return matchClient || matchCompany;
    });
  }, [rfqs, adminRfqClientFilter]);

  const selectedClientCategory = useMemo(() => {
    if (!adminRfqClientFilter) return null;
    if (adminRfqClientFilter.startsWith("cat:")) {
      return adminRfqClientFilter.substring(4);
    }
    if (selectedClientRfqs.length === 0) return null;
    return selectedClientRfqs[0].clientCategory;
  }, [selectedClientRfqs, adminRfqClientFilter]);

  const selectedClientPendingRfqs = useMemo(() => {
    return selectedClientRfqs.filter((r) => r.status === "pending" || r.status === "processing");
  }, [selectedClientRfqs]);

  const selectedClientPendingValue = useMemo(() => {
    return selectedClientPendingRfqs.reduce((acc, rfq) => {
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
  }, [selectedClientPendingRfqs, catalogProducts]);

  const downloadCsvForSelectedClient = () => {
    if (!adminRfqClientFilter) return;
    const targetRfqs = selectedClientRfqs;
    if (targetRfqs.length === 0) {
      showToast("Tidak ada data RFQ untuk diekspor", "info");
      return;
    }
    
    const headers = [
      "No RFQ",
      "Tanggal",
      "Nama Klien",
      "Perusahaan",
      "Email",
      "Telepon",
      "Kategori Klien",
      "Status",
      "Daftar Item Perangkat",
      "Total Item",
      "Estimasi Nilai RFQ"
    ];
    
    const csvRows = [headers.join(",")];
    
    targetRfqs.forEach((rfq) => {
      const itemsDetail = rfq.items.map(item => `${item.name} (${item.quantity}x)`).join("; ");
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
      const totalItemsCount = rfq.items.reduce((sum, item) => sum + item.quantity, 0);

      const row = [
        `"${(rfq.rfqNumber || "").replace(/"/g, '""')}"`,
        `"${(rfq.date || "").replace(/"/g, '""')}"`,
        `"${(rfq.clientName || "").replace(/"/g, '""')}"`,
        `"${(rfq.companyName || "").replace(/"/g, '""')}"`,
        `"${(rfq.email || "").replace(/"/g, '""')}"`,
        `"${(rfq.phone || "").replace(/"/g, '""')}"`,
        `"${(rfq.clientCategory || "").replace(/"/g, '""')}"`,
        `"${(rfq.status || "").replace(/"/g, '""')}"`,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        totalItemsCount,
        rfqValue
      ];
      csvRows.push(row.join(","));
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(e => e).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const filterCleanName = adminRfqClientFilter.startsWith("cat:") 
      ? `kategori_${adminRfqClientFilter.substring(4)}`
      : adminRfqClientFilter.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BBS_RFQ_History_${filterCleanName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Ekspor CSV Berhasil! Mengunduh riwayat RFQ`, "success");
  };

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

    // 3. Filter by selected client or company name/category
    if (adminRfqClientFilter) {
      if (adminRfqClientFilter.startsWith("cat:")) {
        const cat = adminRfqClientFilter.substring(4);
        if (rfq.clientCategory !== cat) {
          return false;
        }
      } else {
        const target = adminRfqClientFilter.toLowerCase();
        const matchClient = rfq.clientName && rfq.clientName.toLowerCase().trim() === target;
        const matchCompany = rfq.companyName && rfq.companyName.toLowerCase().trim() === target;
        if (!matchClient && !matchCompany) {
          return false;
        }
      }
    }

    // 4. Filter by Status
    if (adminRfqStatuses.length > 0 && !adminRfqStatuses.includes(rfq.status)) {
      return false;
    }

    // 5. Filter by Status Keyword Search
    if (statusKeywordSearch) {
      const qStatus = statusKeywordSearch.toLowerCase().trim();
      const statusLabels: Record<string, string> = {
        pending: "menunggu proposal pending amber",
        processing: "sedang diproses processing blue biru",
        quoted: "sudah di-quoted quoted indigo",
        completed: "selesai completed emerald hijau",
        cancelled: "dibatalkan cancelled rose merah"
      };
      if (settings.customRfqStatuses) {
        settings.customRfqStatuses.forEach((cs) => {
          statusLabels[cs.value] = `${cs.label.toLowerCase()} ${cs.desc.toLowerCase()} ${cs.value.toLowerCase()} ${cs.color || "purple"}`;
        });
      }
      const rfqStatusText = statusLabels[rfq.status] || "";
      if (!rfq.status.toLowerCase().includes(qStatus) && !rfqStatusText.includes(qStatus)) {
        return false;
      }
    }

    return true;
  });

  const adminRfqStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "": 0,
      pending: 0,
      processing: 0,
      quoted: 0,
      completed: 0,
      cancelled: 0,
    };

    if (settings.customRfqStatuses) {
      settings.customRfqStatuses.forEach((st) => {
        counts[st.value] = 0;
      });
    }

    rfqs.forEach((rfq) => {
      // Apply Search query filter
      const q = adminRfqSearch.toLowerCase().trim();
      if (q) {
        const matchesSearch = (
          rfq.rfqNumber.toLowerCase().includes(q) ||
          rfq.clientName.toLowerCase().includes(q) ||
          (rfq.companyName && rfq.companyName.toLowerCase().includes(q))
        );
        if (!matchesSearch) return;
      }

      // Apply Date range filter
      if (rfq.date) {
        if (adminRfqStartDate && rfq.date < adminRfqStartDate) {
          return;
        }
        if (adminRfqEndDate && rfq.date > adminRfqEndDate) {
          return;
        }
      } else if (adminRfqStartDate || adminRfqEndDate) {
        return;
      }

      // Apply Client/Category filter
      if (adminRfqClientFilter) {
        if (adminRfqClientFilter.startsWith("cat:")) {
          const cat = adminRfqClientFilter.substring(4);
          if (rfq.clientCategory !== cat) return;
        } else {
          const target = adminRfqClientFilter.toLowerCase();
          const matchClient = rfq.clientName && rfq.clientName.toLowerCase().trim() === target;
          const matchCompany = rfq.companyName && rfq.companyName.toLowerCase().trim() === target;
          if (!matchClient && !matchCompany) return;
        }
      }

      // Increment matching status
      if (rfq.status) {
        if (!(rfq.status in counts)) {
          counts[rfq.status] = 0;
        }
        counts[rfq.status]++;
      }
      counts[""]++;
    });

    return counts;
  }, [rfqs, adminRfqSearch, adminRfqStartDate, adminRfqEndDate, adminRfqClientFilter, settings]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Berkah Bintang Solusindo - Portal E-Procurement",
          text: "Akses katalog e-procurement lengkap dan request RFQ instan di Berkah Bintang Solusindo.",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link portal berhasil disalin ke clipboard!", "success");
      } catch (err) {
        showToast("Gagal menyalin link portal.", "error");
      }
    }
  };

  // Online Store Operations
  const getProductPrice = (id: string): number => {
    switch (id) {
      case "prod_1": return 11450000;
      case "prod_2": return 8950000;
      case "prod_3": return 27800000;
      case "prod_4": return 13200000;
      case "prod_5": return 3900000;
      case "prod_6": return 2150000;
      case "prod_7": return 1150000;
      case "prod_8": return 210000;
      default: return 500000;
    }
  };

  const addToShopCart = (product: ProductItem) => {
    setShopCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`${product.name} berhasil ditambahkan ke keranjang`, "success");
  };

  const removeFromShopCart = (productId: string) => {
    setShopCart(prev => prev.filter(item => item.product.id !== productId));
    showToast("Item dihapus dari keranjang", "info");
  };

  const updateShopCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromShopCart(productId);
      return;
    }
    setShopCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearShopCart = () => {
    setShopCart([]);
  };

  const handleApplyCoupon = () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      showToast("Masukkan kode kupon terlebih dahulu", "info");
      return;
    }
    if (code === "BBSMERDEKA") {
      setAppliedDiscountPercent(10);
      setAppliedCouponCode(code);
      showToast("Kupon BBSMERDEKA berhasil! Diskon 10% diterapkan.", "success");
    } else if (code === "DISKON20") {
      setAppliedDiscountPercent(20);
      setAppliedCouponCode(code);
      showToast("Kupon DISKON20 berhasil! Diskon 20% diterapkan.", "success");
    } else if (code === "GRANDOPENING") {
      setAppliedDiscountPercent(15);
      setAppliedCouponCode(code);
      showToast("Kupon GRANDOPENING berhasil! Diskon 15% diterapkan.", "success");
    } else {
      showToast("Kode kupon tidak valid", "error");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscountPercent(0);
    setAppliedCouponCode("");
    setCouponCodeInput("");
    showToast("Kupon dihapus", "info");
  };

  const getDeliveryCost = (method: string): number => {
    switch (method) {
      case "bbs_delivery": return 100000;
      case "jne": return 150000;
      case "tiki": return 130000;
      case "pickup": return 0;
      default: return 0;
    }
  };

  const getDeliveryLabel = (method: string): string => {
    switch (method) {
      case "bbs_delivery": return "Kurir Toko BBS (Rekomendasi)";
      case "jne": return "JNE Express";
      case "tiki": return "TIKI Regular";
      case "pickup": return "Ambil Sendiri di Kantor BBS";
      default: return "";
    }
  };

  const getPaymentLabel = (method: string): string => {
    switch (method) {
      case "bank_transfer": return "Transfer Bank Manual (Mandiri)";
      case "virtual_account": return "Virtual Account (Konfirmasi Instan)";
      case "credit_card": return "Kartu Kredit (Simulasi Aman)";
      default: return "";
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shopCart.length === 0) {
      showToast("Keranjang belanja kosong", "error");
      return;
    }
    if (!checkoutForm.clientName || !checkoutForm.whatsapp || !checkoutForm.email || !checkoutForm.address) {
      showToast("Mohon lengkapi seluruh kolom wajib", "error");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const subtotal = shopCart.reduce((sum, item) => sum + (getProductPrice(item.product.id) * item.quantity), 0);
      const discount = Math.round(subtotal * (appliedDiscountPercent / 100));
      const tax = Math.round((subtotal - discount) * 0.11);
      const shippingCost = getDeliveryCost(checkoutForm.deliveryMethod);
      const total = subtotal - discount + tax + shippingCost;

      const orderData = {
        clientName: checkoutForm.clientName,
        companyName: checkoutForm.companyName || "",
        whatsapp: checkoutForm.whatsapp,
        email: checkoutForm.email,
        address: checkoutForm.address,
        deliveryMethod: checkoutForm.deliveryMethod,
        paymentMethod: checkoutForm.paymentMethod,
        items: shopCart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: getProductPrice(item.product.id),
          totalPrice: getProductPrice(item.product.id) * item.quantity
        })),
        subtotal,
        discount,
        tax,
        shippingCost,
        total
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        const data = await res.json();
        setLatestPlacedOrder(data);
        setIsOrderSuccessOpen(true);
        clearShopCart();
        setAppliedDiscountPercent(0);
        setAppliedCouponCode("");
        setCouponCodeInput("");
        setCheckoutForm({
          clientName: "",
          companyName: "",
          whatsapp: "",
          email: "",
          address: "",
          deliveryMethod: "bbs_delivery",
          paymentMethod: "bank_transfer"
        });
        showToast("Pesanan berhasil dikirim!", "success");
        fetchOrders();
      } else {
        showToast("Gagal memproses pesanan Anda", "error");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      showToast("Kesalahan koneksi ke server", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const downloadOrderInvoicePdf = (order: any) => {
    if (!order) return;
    try {
      const doc = new jsPDF();

      // Title & Brand Header
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(14, 15, 4, 16, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text((settings?.companyName || "PT. BERKAH BINTANG SOLUSINDO").toUpperCase(), 22, 21);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(settings?.tagline || "Solusi Teknologi Informasi dan Pengadaan Terpercaya", 22, 26);
      doc.text(`Hubungi: ${settings?.email || 'bbscom993@gmail.com'} | WhatsApp: ${settings?.whatsapp || '+6281234567890'} | Web: ${settings?.website || 'www.berkahbintangsolusindo.com'}`, 22, 30);

      // Decorative divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 35, 196, 35);

      // Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(`INVOICE PEMBELIAN ONLINE`, 14, 44);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Nomor Invoice : ${order.orderNumber}`, 14, 49);
      doc.text(`Tanggal Order : ${order.date}`, 14, 53);

      // Statuses Block
      doc.setFont("helvetica", "bold");
      doc.text(`Status Pembayaran : ${order.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}`, 130, 44);
      doc.text(`Status Pengiriman : ${order.status.toUpperCase()}`, 130, 49);

      // Customer Info Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(14, 58, 182, 38, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("INFORMASI PELANGGAN & ALAMAT PENGIRIMAN", 18, 64);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`Nama Pemesan : ${order.clientName}`, 18, 70);
      if (order.companyName) {
        doc.text(`Perusahaan    : ${order.companyName}`, 18, 75);
      } else {
        doc.text(`Perusahaan    : -`, 18, 75);
      }
      doc.text(`No WhatsApp   : ${order.whatsapp}`, 18, 80);
      doc.text(`Alamat Email  : ${order.email}`, 18, 85);
      doc.text(`Alamat Kirim  : ${order.address}`, 18, 90);

      // Table mapping
      const tableRows: any[] = [];
      order.items.forEach((item: any, idx: number) => {
        tableRows.push([
          (idx + 1).toString(),
          item.name,
          item.quantity.toString(),
          `Rp ${item.price.toLocaleString("id-ID")}`,
          `Rp ${item.totalPrice.toLocaleString("id-ID")}`
        ]);
      });

      (doc as any).autoTable({
        startY: 102,
        head: [['No', 'Nama Barang / Perangkat IT', 'Qty', 'Harga Satuan', 'Total']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [15, 23, 42]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 92 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 32 },
          4: { cellWidth: 33 }
        },
        margin: { left: 14, right: 14 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3
        }
      });

      // Bottom section calculation placement
      let finalY = (doc as any).lastAutoTable.finalY + 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      
      // Right side totals
      doc.text(`Subtotal :`, 130, finalY);
      doc.text(`Rp ${order.subtotal.toLocaleString("id-ID")}`, 162, finalY);

      if (order.discount > 0) {
        finalY += 5;
        doc.text(`Diskon :`, 130, finalY);
        doc.text(`- Rp ${order.discount.toLocaleString("id-ID")}`, 162, finalY);
      }

      finalY += 5;
      doc.text(`PPN (11%) :`, 130, finalY);
      doc.text(`Rp ${order.tax.toLocaleString("id-ID")}`, 162, finalY);

      finalY += 5;
      doc.text(`Ongkos Kirim :`, 130, finalY);
      doc.text(`Rp ${order.shippingCost.toLocaleString("id-ID")}`, 162, finalY);

      finalY += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`TOTAL BAYAR :`, 130, finalY);
      doc.text(`Rp ${order.total.toLocaleString("id-ID")}`, 162, finalY);

      // Bank account instructions on the left bottom
      const leftY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229);
      doc.text("INSTRUKSI PEMBAYARAN:", 14, leftY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Metode: ${getPaymentLabel(order.paymentMethod)}`, 14, leftY + 5);
      doc.text(`Kurir: ${getDeliveryLabel(order.deliveryMethod)}`, 14, leftY + 10);
      
      if (order.paymentMethod === "bank_transfer") {
        doc.text(`Silakan transfer ke rekening resmi kami:`, 14, leftY + 16);
        doc.setFont("helvetica", "bold");
        doc.text(`${settings?.bankAccount?.bankName || 'Bank Mandiri'}`, 14, leftY + 21);
        doc.text(`No. Rek: ${settings?.bankAccount?.accountNumber || '123-45-67890-1'}`, 14, leftY + 26);
        doc.text(`A.N: ${settings?.bankAccount?.accountHolder || 'PT Berkah Bintang Solusindo'}`, 14, leftY + 31);
        doc.setFont("helvetica", "normal");
        doc.text(`*Kirim bukti transfer ke WhatsApp ${settings?.whatsapp || '+6281234567890'} untuk konfirmasi.`, 14, leftY + 37);
      } else {
        doc.text(`Pembayaran diproses secara instan dan otomatis melalui sistem.`, 14, leftY + 16);
        doc.text(`Status: Terverifikasi (Lunas).`, 14, leftY + 21);
      }

      // Footer brand block
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Terima kasih atas kepercayaan Anda berbelanja langsung di Berkah Bintang Solusindo.", 14, 280);

      doc.save(`Invoice-${order.orderNumber}.pdf`);
      showToast("Invoice PDF berhasil diunduh!", "success");
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      showToast("Gagal mencetak Invoice ke PDF", "error");
    }
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

  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkNotifying, setIsBulkNotifying] = useState(false);

  const handleBulkNotifyClients = async () => {
    if (selectedRfqIds.length === 0) return;
    setIsBulkNotifying(true);
    try {
      const res = await fetch("/api/rfqs/bulk-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqIds: selectedRfqIds,
          operator: adminDisplayName || adminUsername || "Staf BBS"
        })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Berhasil mengirimkan ${data.emailsSentCount} email notifikasi status ke klien!`, "success");
        setSelectedRfqIds([]);
        fetchRfqs(); // Refresh lists
        fetchEmails(); // Refresh emails
      } else {
        showToast("Gagal mengirim notifikasi secara massal", "error");
      }
    } catch (err) {
      console.error("Bulk client notification failed:", err);
      showToast("Kesalahan koneksi ke server", "error");
    } finally {
      setIsBulkNotifying(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRfqIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/rfqs/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqIds: selectedRfqIds,
          status,
          operator: adminDisplayName || adminUsername || "Staf BBS"
        })
      });
      if (res.ok) {
        showToast(`Berhasil memperbarui status ${selectedRfqIds.length} RFQ secara massal!`, "success");
        setSelectedRfqIds([]);
        fetchRfqs(); // Refresh lists
      } else {
        showToast("Gagal memperbarui status secara massal", "error");
      }
    } catch (err) {
      console.error("Bulk status update failed:", err);
      showToast("Kesalahan koneksi ke server", "error");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleCreateCustomStatus = async () => {
    const trimmedName = newCustomStatusName.trim();
    if (!trimmedName) {
      showToast("Nama status tidak boleh kosong!", "error");
      return;
    }
    
    const value = trimmedName.toLowerCase().replace(/\s+/g, '_');
    const standardValues = ["pending", "processing", "quoted", "completed", "cancelled"];
    const existingCustom = settings.customRfqStatuses || [];
    
    if (standardValues.includes(value) || existingCustom.some(c => c.value === value)) {
      showToast("Status dengan nama tersebut sudah ada!", "error");
      return;
    }
    
    const newStatusItem = {
      value,
      label: trimmedName,
      desc: `Status kustom: ${trimmedName}`,
      color: newCustomStatusColor
    };
    
    const updatedCustomStatuses = [...existingCustom, newStatusItem];
    
    await updateSettings({
      ...settings,
      customRfqStatuses: updatedCustomStatuses
    });
    
    setNewCustomStatusName("");
    showToast(`Status kustom "${trimmedName}" berhasil dibuat!`, "success");
  };

  const handleDeleteCustomStatus = async (valueToDelete: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus status kustom ini?")) {
      return;
    }
    const existingCustom = settings.customRfqStatuses || [];
    const updatedCustomStatuses = existingCustom.filter(c => c.value !== valueToDelete);
    
    if (adminRfqStatuses.includes(valueToDelete)) {
      setAdminRfqStatuses(adminRfqStatuses.filter(s => s !== valueToDelete));
    }
    
    await updateSettings({
      ...settings,
      customRfqStatuses: updatedCustomStatuses
    });
    showToast("Status kustom berhasil dihapus!", "success");
  };

  const handleUpdateCustomStatusColor = async (statusValue: string, newColor: string) => {
    const existingCustom = settings.customRfqStatuses || [];
    const updatedCustomStatuses = existingCustom.map(c => {
      if (c.value === statusValue) {
        return { ...c, color: newColor };
      }
      return c;
    });
    
    await updateSettings({
      ...settings,
      customRfqStatuses: updatedCustomStatuses
    });
    showToast("Warna status kustom berhasil diperbarui!", "success");
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

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
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

  // Add all compared products to RFQ cart
  const addAllComparedToCart = () => {
    let updatedCart = [...rfqCart];
    const comparedProducts = selectedCompareIds
      .map(id => catalogProducts.find(p => p.id === id))
      .filter((p): p is ProductItem => !!p);

    if (comparedProducts.length === 0) return;

    comparedProducts.forEach(product => {
      const existingIdx = updatedCart.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        updatedCart[existingIdx] = {
          ...updatedCart[existingIdx],
          quantity: updatedCart[existingIdx].quantity + 1
        };
      } else {
        updatedCart.push({ product, quantity: 1 });
      }
    });

    setRfqCart(updatedCart);
    showToast(`${comparedProducts.length} perangkat berhasil ditambahkan ke keranjang RFQ!`, "success");
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
      description: customItemDesc.trim() || undefined,
      serialNumber: customItemSerial.trim() || undefined
    };
    setCustomCartItems([...customCartItems, newItem]);
    setCustomItemName("");
    setCustomItemQty(1);
    setCustomItemDesc("");
    setCustomItemSerial("");
    showToast("Item custom ditambahkan ke keranjang!", "success");
  };

  const removeCustomItem = (index: number) => {
    setCustomCartItems(customCartItems.filter((_, i) => i !== index));
    showToast("Item custom dihapus.", "info");
  };

  // Export RFQ Cart Items to PDF using jsPDF and jsPDF-AutoTable
  const exportRfqCartToPdf = () => {
    if (rfqCart.length === 0 && customCartItems.length === 0) {
      showToast("Keranjang RFQ kosong. Tambahkan barang terlebih dahulu untuk mengekspor ke PDF.", "error");
      return;
    }

    try {
      const doc = new jsPDF();

      // Title & Brand Header
      // Left vertical accent bar in indigo
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(14, 15, 4, 16, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("PT. BERKAH BINTANG SOLUSINDO", 22, 21);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("Solusi IT Terintegrasi, Jaringan, Hardware Supply, CCTV & Jasa Maintenance Sistem", 22, 26);
      doc.text("Hubungi: support@berkahbintangsolusindo.co.id | Telp: 0812-3456-7890 | Web: www.bbs.co.id", 22, 30);

      // Decorative divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 35, 196, 35);

      // Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text("RINGKASAN ESTIMASI KERANJANG PENGAJUAN RFQ", 14, 44);

      // Timestamp of generation
      const currentDateString = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + " WIB";
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Waktu Cetak: ${currentDateString}`, 14, 49);

      // Client Info Block (Subtle box)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(14, 53, 182, 36, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("INFORMASI KLIEN (PERMINTAAN AWAL)", 18, 59);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`Nama Kontak  : ${rfqForm.clientName || "(Belum diisi)"}`, 18, 65);
      doc.text(`No WhatsApp  : ${rfqForm.whatsapp || "(Belum diisi)"}`, 18, 70);
      doc.text(`Alamat Email : ${rfqForm.email || "(Belum diisi)"}`, 18, 75);

      doc.text(`Perusahaan/Instansi : ${rfqForm.companyName || "-"}`, 110, 65);
      doc.text(`Kategori Klien      : ${(rfqForm.clientCategory || "Retail").toUpperCase()}`, 110, 70);
      doc.text(`Alamat Pengiriman   : ${rfqForm.address || "(Belum diisi)"}`, 110, 75);

      // Prepare Items Data for Table
      const tableRows: any[] = [];
      let itemIndex = 1;

      // Standard Catalog Items
      rfqCart.forEach((item) => {
        tableRows.push([
          itemIndex.toString(),
          item.product.name,
          "Katalog: " + item.product.category,
          item.product.serialNumber || "-",
          item.quantity.toString(),
          item.product.estimatedPriceRange || "-"
        ]);
        itemIndex++;
      });

      // Custom Manual Items
      customCartItems.forEach((item) => {
        tableRows.push([
          itemIndex.toString(),
          item.name,
          item.description || "Kustom Khusus",
          item.serialNumber || "-",
          item.quantity.toString(),
          "-"
        ]);
        itemIndex++;
      });

      // Draw table using jspdf-autotable
      (doc as any).autoTable({
        startY: 95,
        head: [['No', 'Nama Perangkat / Jasa', 'Kategori / Deskripsi', 'Serial Number', 'Jumlah', 'Estimasi Harga']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229], // indigo-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [15, 23, 42]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 55 },
          2: { cellWidth: 50 },
          3: { cellWidth: 28 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 24 }
        },
        margin: { left: 14, right: 14 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3
        }
      });

      // Get Y coordinate after table
      let finalY = (doc as any).lastAutoTable.finalY || 130;

      // Special Requirements (if filled)
      if (rfqForm.customRequirements && rfqForm.customRequirements.trim()) {
        if (finalY > 230) {
          doc.addPage();
          finalY = 20;
        } else {
          finalY += 8;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Kebutuhan Khusus / Catatan Tambahan Klien:", 14, finalY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const splitNote = doc.splitTextToSize(rfqForm.customRequirements.trim(), 182);
        doc.text(splitNote, 14, finalY + 4);
        
        finalY += (splitNote.length * 3.5) + 6;
      }

      // Check if signature section fits, if not, add a new page
      if (finalY > 210) {
        doc.addPage();
        finalY = 20;
      } else {
        finalY += 12;
      }

      // Legal disclaimer / Note text
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      const noteText = "Catatan Penting: Dokumen PDF ini diunduh langsung secara mandiri oleh klien melalui portal web sebagai draft/ringkasan acuan pengadaan. Penawaran resmi (Surat Penawaran Harga resmi lengkap dengan kop surat resmi PT, tanda tangan basah/digital, nomor SPH legal, dan PPN 11%) akan dikirimkan secara formal oleh representatif PT. Berkah Bintang Solusindo setelah pengajuan RFQ ini terekam di database.";
      const splitNoteText = doc.splitTextToSize(noteText, 182);
      doc.text(splitNoteText, 14, finalY);

      finalY += (splitNoteText.length * 3.5) + 12;

      // Signature blocks
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      // Client Signature
      doc.text("Tanda Tangan Pengaju / Klien,", 20, finalY);
      doc.line(20, finalY + 20, 75, finalY + 20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rfqForm.clientName || "(Nama Pengaju)", 20, finalY + 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(rfqForm.companyName || "Instansi Klien", 20, finalY + 28);

      // BBS Signature
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Diterbitkan Otomatis Oleh,", 130, finalY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("BBS RFQ System", 130, finalY + 10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.line(130, finalY + 20, 185, finalY + 20);
      doc.text("PT. Berkah Bintang Solusindo", 130, finalY + 24);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Integrated AI Procurement Engine", 130, finalY + 28);

      // Save File
      const filename = `RFQ_Summary_BBS_${new Date().toISOString().slice(0,10)}_${Math.floor(1000 + Math.random() * 9000)}.pdf`;
      doc.save(filename);
      showToast("Dokumen PDF Ringkasan RFQ berhasil di-generate dan diunduh!", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast("Gagal menerbitkan dokumen PDF: " + (error as any).message, "error");
    }
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

    // Email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(rfqForm.email.trim())) {
      setEmailError("Format email tidak valid (contoh: nama@domain.com)");
      showToast("Format Alamat Email tidak valid. Silakan periksa kembali.", "error");
      return;
    } else {
      setEmailError("");
    }

    setSubmittingRfq(true);

    // Prepare items list
    const items: RFQItem[] = [
      ...rfqCart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        description: item.product.description,
        serialNumber: item.product.serialNumber
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
        try {
          localStorage.removeItem("bbs_rfq_cart");
          localStorage.removeItem("bbs_custom_cart_items");
          localStorage.removeItem("bbs_rfq_form");
        } catch (e) {
          console.error("Error clearing auto-save localStorage", e);
        }
        
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
        isBudgetExceeded={isBudgetExceeded}
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
                  <span>Mitra Solusi IT Terpercaya & Murah</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  Solusi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Teknologi Informasi</span> & Pengadaan Barang Jasa
                </h1>
                
                <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                  {settings.description} Kami menyuplai laptop seken dan baru, instalasi jaringan fiber/LAN, setting server, security system, hingga maintenance dengan SLA tinggi.
                </p>

                {/* Quick Quality Check list */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
                    <span>Produk-produk Bergaransi</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
                    <span>Tim Teknisi Berpengalaman</span>
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
                    <span>Konsultasi BBS Asisten AI</span>
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
                        <h3 className="text-2xl font-bold mt-1 text-white">Instant <span className="text-xs text-indigo-400 font-medium">via BBS ENGINE LIVE AI</span></h3>
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
                        <p className="text-xs font-bold text-slate-200">BBS AI Memproses & Merancang Quotation</p>
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
                  Menawarkan portofolio solusi teknologi informasi dan pengadaan komprehensif yang dirancang khusus untuk memajukan bisnis Anda.
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
                  {/* Quick Download Shortcut Button */}
                  <button
                    onClick={() => setSelectedCatalogPdf(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Unduh PDF Katalog Langsung"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Now</span>
                  </button>

                  <div className="relative flex items-center gap-2" ref={catalogMenuRef}>
                    <button
                      onClick={() => setIsCatalogMenuOpen(!isCatalogMenuOpen)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
                      id="download_catalog_pdf_btn"
                    >
                      <QrCode className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Katalog Akses</span>
                      <ChevronDown className="h-3 w-3 opacity-80" />
                    </button>

                    <button
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
                      id="scan_barcode_from_catalog_btn"
                      title="Pindai QR / Barcode Produk"
                    >
                      <Icons.Scan className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Scan</span>
                    </button>

                    {isCatalogMenuOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-xl animate-scaleUp">
                        <button
                          onClick={() => {
                            setSelectedCatalogPdf(true);
                            setIsCatalogMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                        >
                          <Download className="h-4 w-4 text-indigo-400" />
                          <span>Unduh PDF Katalog</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowQrCodeModal(true);
                            setIsCatalogMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-colors border-t border-white/5 cursor-pointer"
                        >
                          <QrCode className="h-4 w-4 text-indigo-400" />
                          <span>Generate QR Code Katalog</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowQrCardModal(true);
                            setIsCatalogMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-colors border-t border-white/5 cursor-pointer"
                        >
                          <Icons.Contact className="h-4 w-4 text-emerald-400" />
                          <span>Export Kartu QR Lapangan</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowPdfPreviewModal(true);
                            setPdfPreviewPage(1);
                            setIsCatalogMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-colors border-t border-white/5 cursor-pointer"
                        >
                          <Icons.Eye className="h-4 w-4 text-indigo-400" />
                          <span>Preview PDF Katalog</span>
                        </button>

                        {/* Settings & Toggle Panel */}
                        <div className="px-4 py-2 border-t border-white/10 bg-slate-950/50 mt-1 space-y-1.5">
                          <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Setelan Dokumen PDF</span>
                          <label className="flex items-center space-x-2 text-[10px] text-slate-300 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={showQrInPdf}
                              onChange={(e) => setShowQrInPdf(e.target.checked)}
                              className="rounded bg-slate-950 border-white/10 text-indigo-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span>Tampilkan QR di PDF</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Print Barcode Labels Button */}
                  <button
                    onClick={() => {
                      if (selectedCompareIds.length > 0) {
                        setPrintItemsList(selectedCompareIds);
                      } else {
                        setPrintItemsList(catalogProducts.map(p => p.id));
                      }
                      setShowBarcodePrintModal(true);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
                    id="print_barcode_labels_btn"
                    title="Cetak Label Barcode Produk"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Print Barcodes</span>
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

                  {(catalogSearch !== "" || catalogCategory !== "Semua" || catalogSort !== "none") && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearch("");
                        setCatalogCategory("Semua");
                        setCatalogSort("none");
                        showToast("Filter dan pencarian katalog telah di-reset ke default.", "success");
                      }}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-95 shadow-lg shadow-rose-950/10 cursor-pointer animate-fade-in"
                      title="Reset Semua Filter"
                    >
                      <Icons.FilterX className="h-3.5 w-3.5" />
                      <span>Clear All Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Products Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group"
                  >
                    <div 
                      onClick={() => setSelectedDetailProduct(prod)} 
                      className="cursor-pointer group/card"
                      title="Klik untuk melihat spesifikasi teknis lengkap"
                    >
                      {/* Product Image */}
                      {prod.image && (
                        <div className="w-full h-36 rounded-xl overflow-hidden mb-4 relative bg-slate-950 border border-white/5">
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Product Card Top */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCompareIds.includes(prod.id)}
                            onClick={(e) => e.stopPropagation()} // Prevent triggering details modal on click
                            onChange={(e) => {
                              e.stopPropagation();
                              if (selectedCompareIds.includes(prod.id)) {
                                setSelectedCompareIds(prev => prev.filter(id => id !== prod.id));
                              } else {
                                if (selectedCompareIds.length >= 4) {
                                  showToast("Maksimal 4 produk dapat dibandingkan sekaligus", "error");
                                  return;
                                }
                                setSelectedCompareIds(prev => [...prev, prod.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-white/20 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500 cursor-pointer shrink-0"
                            title="Pilih untuk perbandingan teknis"
                          />
                          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-semibold">
                            {prod.category}
                          </span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg text-slate-400 border border-white/5">
                          <DynamicIcon name={prod.icon} className="h-5 w-5" />
                        </div>
                      </div>

                      <h4 className="font-bold text-white text-base line-clamp-1 group-hover/card:text-indigo-400 transition-colors">{prod.name}</h4>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{prod.description}</p>
                      
                      <div className="mt-3 py-1 px-2 rounded bg-indigo-500/5 border border-indigo-500/10 inline-block">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Estimasi Rentang Harga</span>
                        <span className="text-xs font-bold text-amber-400">{prod.estimatedPriceRange}</span>
                      </div>

                      {/* Specs snippet */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Spesifikasi Utama:</p>
                          <span className="text-[9px] text-indigo-400 font-bold group-hover/card:underline">Lihat Semua →</span>
                        </div>
                        {prod.specifications.slice(0, 3).map((spec, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                            <span className="line-clamp-1">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions Area */}
                    <div className="mt-6 space-y-2">
                      {selectedCompareIds.length > 1 && (
                        <button
                          onClick={() => {
                            setShowComparisonModal(true);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/10 animate-fadeIn"
                        >
                          <Icons.GitCompare className="h-3.5 w-3.5" />
                          <span>Bandingkan ({selectedCompareIds.length})</span>
                        </button>
                      )}

                      <div className="grid grid-cols-12 gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedCompareIds.includes(prod.id)) {
                              setSelectedCompareIds(prev => prev.filter(id => id !== prod.id));
                            } else {
                              if (selectedCompareIds.length >= 4) {
                                showToast("Maksimal 4 produk dapat dibandingkan sekaligus", "error");
                                return;
                              }
                              setSelectedCompareIds(prev => [...prev, prod.id]);
                            }
                          }}
                          className={`col-span-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center space-x-1 border ${
                            selectedCompareIds.includes(prod.id)
                              ? "bg-indigo-600/25 border-indigo-500 text-indigo-300 hover:bg-indigo-600/40"
                              : "bg-white/5 border-white/10 hover:bg-slate-800 text-slate-300 hover:border-indigo-500/30"
                          }`}
                          title="Tambah ke Perbandingan"
                        >
                          <Icons.GitCompare className="h-3.5 w-3.5" />
                          <span className="truncate">{selectedCompareIds.includes(prod.id) ? "Batal" : "Banding"}</span>
                        </button>

                        <button 
                          onClick={() => addToCart(prod)}
                          className="col-span-6 py-2.5 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 text-white hover:text-white rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="truncate">Keranjang RFQ</span>
                        </button>

                        <button
                          onClick={() => setSelectedQrProduct(prod)}
                          className="col-span-2 py-2.5 bg-white/5 hover:bg-indigo-500/20 border border-white/10 text-indigo-400 hover:text-indigo-300 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer hover:border-indigo-500/30"
                          title="Tampilkan Kode QR Produk"
                        >
                          <Icons.QrCode className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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
                  &copy; {new Date().getFullYear()} {settings.companyName}. Hak Cipta Dilindungi. Solusi Infrastruktur IT & Pengadaan Barang Jasa.
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

            {/* Floating Action Buttons for Landing Page */}
            <div className={`fixed ${selectedCompareIds.length > 0 ? "bottom-28 sm:bottom-32" : "bottom-6 sm:bottom-8"} right-4 sm:right-8 z-40 animate-fadeIn transition-all duration-300 no-print flex items-center space-x-2 sm:space-x-3`}>
              <motion.button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 sm:px-4.5 py-2.5 sm:py-3 rounded-full bg-slate-900/95 hover:bg-slate-800 text-indigo-400 font-bold text-xs tracking-wide border border-white/10 hover:border-indigo-500/30 shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group"
                title="Bagikan URL Portal E-Procurement"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center -space-x-1.5 mr-0.5">
                  <div className="bg-slate-950/40 p-1 rounded-lg border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                    <Icons.Share2 className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="bg-slate-950 p-0.5 rounded border border-indigo-500/30 z-10 shadow-md group-hover:border-indigo-400 transition-colors -mt-1.5">
                    <Icons.QrCode className="h-2.5 w-2.5 text-indigo-300" />
                  </div>
                </div>
                <span className="hidden xs:inline">Bagikan Portal</span>
                <span className="xs:hidden">Bagikan</span>
              </motion.button>

              <motion.button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center space-x-2 px-4.5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs tracking-wide border border-indigo-400/30 cursor-pointer group"
                title="Quick Scan Label Barcode / QR Produk"
                animate={{
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    "0 8px 25px rgba(99, 102, 241, 0.4)",
                    "0 12px 35px rgba(139, 92, 246, 0.6)",
                    "0 8px 25px rgba(99, 102, 241, 0.4)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: "0 15px 40px rgba(139, 92, 246, 0.8)",
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="relative">
                  <QrCode className="h-4.5 w-4.5 text-white group-hover:rotate-12 transition-transform" />
                  <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                </div>
                <span>Quick Scan QR</span>
              </motion.button>
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* TAB: ONLINE STORE & DIRECT PURCHASE  */}
        {/* ==================================== */}
        {currentTab === "shop" && (
          <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
            {/* Header / Hero */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-semibold uppercase tracking-wider mb-3">
                    <Icons.Store className="h-3 w-3 text-indigo-400" />
                    <span>Layanan Beli Langsung</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
                    Toko Online BBS
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Beli berbagai perangkat hardware IT, server, jaringan, CCTV, dan lisensi software resmi bergaransi penuh dengan sistem checkout langsung dari portal kami.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-center min-w-[120px]">
                    <div className="text-xs text-slate-400">Keranjang Belanja</div>
                    <div className="text-lg font-extrabold text-indigo-400 flex items-center justify-center gap-1.5 mt-0.5">
                      <Icons.ShoppingBag className="h-4.5 w-4.5 text-indigo-400" />
                      <span>{shopCart.reduce((sum, i) => sum + i.quantity, 0)} Item</span>
                    </div>
                  </div>
                  
                  {shopCart.length > 0 && (
                    <button
                      onClick={() => {
                        const cartEl = document.getElementById("shop_checkout_panel");
                        if (cartEl) cartEl.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Checkout</span>
                      <Icons.ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Store Layout (Split screen on large screens, single column on small) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Product Selection */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search & Category Filter */}
                <div className="bg-slate-900/20 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Category Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {["Semua", "Komputer & Laptop", "Server & Storage", "Infrastruktur Jaringan", "CCTV & Security", "Software & Lisensi"].map(cat => {
                      const isActive = (catalogCategory === "Semua" && cat === "Semua") || catalogCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setCatalogCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                              : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-xs w-full">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari perangkat..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Product Grid */}
                {(() => {
                  const filtered = PRODUCT_CATALOG.filter(prod => {
                    const matchesCategory = catalogCategory === "Semua" || prod.category === catalogCategory;
                    const matchesSearch = prod.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      prod.description.toLowerCase().includes(catalogSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 bg-slate-900/10 border border-dashed border-white/10 rounded-xl">
                        <Icons.PackageOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                        <h3 className="text-sm font-bold text-slate-400 mb-1">Produk Tidak Ditemukan</h3>
                        <p className="text-xs text-slate-500">Coba ganti filter kategori atau kata kunci pencarian Anda.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filtered.map(prod => {
                        const fixedPrice = getProductPrice(prod.id);
                        return (
                          <div key={prod.id} className="bg-slate-900/30 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 flex flex-col group hover:shadow-lg hover:shadow-indigo-500/2">
                            {/* Product Image Panel */}
                            <div className="relative h-44 bg-slate-950 flex items-center justify-center p-4 border-b border-white/5">
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Icons.Laptop className="h-16 w-16 text-slate-700" />
                              )}
                              <span className="absolute top-3 left-3 bg-slate-900/90 text-[10px] font-bold uppercase text-indigo-400 tracking-wider px-2 py-0.5 rounded border border-indigo-500/20">
                                {prod.category}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                  {prod.name}
                                </h3>
                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                  {prod.description}
                                </p>

                                {/* Specs Bullet points */}
                                <div className="pt-2 border-t border-white/5 space-y-1">
                                  {prod.specifications?.slice(0, 3).map((spec, sidx) => (
                                    <div key={sidx} className="flex items-start text-[11px] text-slate-400">
                                      <Icons.Check className="h-3 w-3 text-emerald-500 mr-1.5 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-1">{spec}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <div>
                                  <div className="text-[10px] text-slate-500">Harga Retail Direct</div>
                                  <div className="text-base font-extrabold text-white">
                                    Rp {fixedPrice.toLocaleString("id-ID")}
                                  </div>
                                </div>

                                <button
                                  onClick={() => addToShopCart(prod)}
                                  className="px-3 py-2 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Icons.Plus className="h-3.5 w-3.5" />
                                  <span>Beli</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              </div>

              {/* Right Column: Checkout & Shopping Cart panel */}
              <div id="shop_checkout_panel" className="lg:col-span-4 space-y-6">
                
                {/* Shopping Cart Header */}
                <div className="bg-slate-900/30 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="flex items-center gap-2">
                      <Icons.ShoppingBag className="h-4 w-4 text-indigo-400" />
                      <span>Daftar Belanja Anda</span>
                    </span>
                    <span className="text-xs bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                      {shopCart.reduce((sum, i) => sum + i.quantity, 0)} Item
                    </span>
                  </h2>

                  {shopCart.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Icons.ShoppingCart className="mx-auto h-8 w-8 text-slate-600 animate-pulse" />
                      <p className="text-xs text-slate-400 font-medium">Keranjang Belanja Kosong</p>
                      <p className="text-[11px] text-slate-500">Klik tombol "Beli" pada katalog untuk menambahkan perangkat IT.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Cart List */}
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-3 divide-y divide-white/5">
                        {shopCart.map((item, index) => {
                          const itemPrice = getProductPrice(item.product.id);
                          return (
                            <div key={item.product.id} className={`flex items-center justify-between gap-3 ${index > 0 ? "pt-3" : ""}`}>
                              <div className="flex-1 space-y-0.5">
                                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{item.product.name}</h4>
                                <div className="text-[11px] text-slate-400">
                                  Rp {itemPrice.toLocaleString("id-ID")}
                                </div>
                              </div>

                              {/* Quantity controls */}
                              <div className="flex items-center gap-2 bg-slate-950/80 border border-white/5 rounded-lg px-1.5 py-1">
                                <button
                                  onClick={() => updateShopCartQuantity(item.product.id, item.quantity - 1)}
                                  className="p-0.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                                >
                                  <Icons.Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold text-white min-w-[14px] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateShopCartQuantity(item.product.id, item.quantity + 1)}
                                  className="p-0.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                                >
                                  <Icons.Plus className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => removeFromShopCart(item.product.id)}
                                className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                title="Hapus dari Keranjang"
                              >
                                <Icons.Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coupon Code section */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        {appliedCouponCode ? (
                          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-xs">
                            <span className="text-emerald-300 flex items-center gap-1">
                              <Icons.Ticket className="h-3.5 w-3.5" />
                              <span>Kupon Terpasang: <strong>{appliedCouponCode}</strong> ({appliedDiscountPercent}%)</span>
                            </span>
                            <button
                              onClick={handleRemoveCoupon}
                              className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <Icons.Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                              <input
                                type="text"
                                placeholder="KODE KUPON (BBSMERDEKA)"
                                value={couponCodeInput}
                                onChange={(e) => setCouponCodeInput(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <button
                              onClick={handleApplyCoupon}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-white/5 transition-all cursor-pointer"
                            >
                              Gunakan
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Calculations */}
                      {(() => {
                        const subtotal = shopCart.reduce((sum, item) => sum + (getProductPrice(item.product.id) * item.quantity), 0);
                        const discount = Math.round(subtotal * (appliedDiscountPercent / 100));
                        const tax = Math.round((subtotal - discount) * 0.11);
                        const shippingCost = getDeliveryCost(checkoutForm.deliveryMethod);
                        const total = subtotal - discount + tax + shippingCost;

                        return (
                          <div className="pt-3 border-t border-white/5 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Subtotal</span>
                              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                            </div>

                            {discount > 0 && (
                              <div className="flex justify-between text-emerald-400 font-medium">
                                <span>Diskon ({appliedDiscountPercent}%)</span>
                                <span>- Rp {discount.toLocaleString("id-ID")}</span>
                              </div>
                            )}

                            <div className="flex justify-between text-slate-400">
                              <span>PPN (11%)</span>
                              <span>Rp {tax.toLocaleString("id-ID")}</span>
                            </div>

                            <div className="flex justify-between text-slate-400">
                              <span>Ongkos Kirim ({getDeliveryLabel(checkoutForm.deliveryMethod)})</span>
                              <span>{shippingCost > 0 ? `Rp ${shippingCost.toLocaleString("id-ID")}` : "GRATIS"}</span>
                            </div>

                            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/5">
                              <span>Total Pembayaran</span>
                              <span className="text-indigo-400">Rp {total.toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  )}
                </div>

                {/* Checkout Form - Only shown if cart has items */}
                {shopCart.length > 0 && (
                  <form onSubmit={handlePlaceOrder} className="bg-slate-900/30 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                      Informasi Pengiriman & Pembayaran
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          NAMA LENGKAP PENERIMA <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={checkoutForm.clientName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, clientName: e.target.value }))}
                          placeholder="Contoh: Andi Wijaya"
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          NAMA PERUSAHAAN / INSTANSI (OPSIONAL)
                        </label>
                        <input
                          type="text"
                          value={checkoutForm.companyName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Contoh: PT Bintang Timur"
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            NO WHATSAPP <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={checkoutForm.whatsapp}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="Contoh: 0811223344"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            ALAMAT EMAIL <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={checkoutForm.email}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="andi.w@email.com"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          ALAMAT PENGIRIMAN LENGKAP <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={checkoutForm.address}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Tulis alamat kirim jalan, ruko, kecamatan, kota, kode pos secara detil."
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          METODE PENGIRIMAN <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={checkoutForm.deliveryMethod}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="bbs_delivery">Kurir Toko BBS - Rp 100.000 (Rekomendasi Aman)</option>
                          <option value="jne">JNE Express - Rp 150.000</option>
                          <option value="tiki">TIKI Regular - Rp 130.000</option>
                          <option value="pickup">Ambil Mandiri di Kantor BBS - Rp 0</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          METODE PEMBAYARAN <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={checkoutForm.paymentMethod}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="bank_transfer">Transfer Bank Mandiri (Verifikasi Bukti Transfer)</option>
                          <option value="virtual_account">Virtual Account Mandiri / BCA (Simulasi Instan)</option>
                          <option value="credit_card">Kartu Kredit Visa / Mastercard (Simulasi Instan Aman)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Icons.RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Sedang Memproses...</span>
                        </>
                      ) : (
                        <>
                          <Icons.Check className="h-4 w-4" />
                          <span>Buat Pesanan & Bayar</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>

            </div>
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
                <span>Teknologi BBS Generative AI</span>
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
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <span>Inspirasi Konsultasi</span>
                    </h4>
                    {!isAddingTopic && (
                      <button
                        onClick={() => setIsAddingTopic(true)}
                        className="text-[10px] font-semibold bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tambah Custom</span>
                      </button>
                    )}
                  </div>

                  {isAddingTopic ? (
                    <form onSubmit={handleAddQuickTopic} className="space-y-3 p-3.5 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Plus className="h-3.5 w-3.5 text-indigo-400" />
                          Tambah Topik Kustom
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingTopic(false)}
                          className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Emoji</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={newTopicEmoji}
                            onChange={(e) => setNewTopicEmoji(e.target.value)}
                            className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                            placeholder="💡"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Judul Topik *</label>
                          <input
                            type="text"
                            required
                            maxLength={30}
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. Absensi Sidik Jari"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Deskripsi Singkat</label>
                        <input
                          type="text"
                          maxLength={60}
                          value={newTopicDescription}
                          onChange={(e) => setNewTopicDescription(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Rekomendasi tipe & instalasi"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Isi Prompt Utama (Dikirim ke AI) *</label>
                        <textarea
                          required
                          rows={3}
                          value={newTopicPrompt}
                          onChange={(e) => setNewTopicPrompt(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                          placeholder="Tuliskan pertanyaan detail Anda di sini..."
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingTopic(false)}
                          className="flex-1 py-1 text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all duration-150 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-1 text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-150 cursor-pointer"
                        >
                          Simpan Topik
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400 leading-relaxed">Pilih topik cepat di bawah ini untuk didiskusikan langsung dengan AI atau buat sendiri:</p>
                      
                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {quickTopics.map((topic) => (
                          <div key={topic.id} className="relative group">
                            <button 
                              onClick={() => sendChatSuggestion(topic.prompt)}
                              className="w-full p-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all duration-200 leading-relaxed pr-8 cursor-pointer block"
                            >
                              <span className="font-semibold">{topic.emoji} {topic.title}</span>
                              <span className="block text-[10px] text-slate-500 mt-1 line-clamp-2">{topic.description}</span>
                            </button>
                            
                            <button
                              onClick={(e) => handleDeleteQuickTopic(topic.id, e)}
                              title="Hapus topik ini"
                              className="absolute top-2.5 right-2.5 p-1 text-slate-500 hover:text-rose-400 bg-black/40 hover:bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {quickTopics.length === 0 && (
                          <div className="text-center py-6 text-slate-500 text-xs">
                            Tidak ada topik cepat. Silakan klik tombol di atas untuk membuat topik kustom Anda!
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

                    {/* Budget Management Panel */}
                    <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                          <Icons.Scale className="h-4 w-4 text-indigo-400" />
                          <span>Manajemen Anggaran Klien</span>
                        </span>
                        
                        {/* Status Badge */}
                        {isBudgetExceeded ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-[9px] font-black text-rose-400 animate-pulse flex items-center gap-1">
                            <Icons.AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
                            <span>MELAMPAUI BATAS</span>
                          </span>
                        ) : (rfqCart.length > 0 || customCartItems.length > 0) ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400 flex items-center gap-1">
                            <Icons.CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                            <span>AMAN / DALAM BUDGET</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-bold">Keranjang Kosong</span>
                        )}
                      </div>

                      {/* Estimasi vs Limit */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-500 font-bold">Total Estimasi Nilai:</span>
                          <p className="text-xs font-black font-mono text-indigo-300">
                            {formatRupiah(estimatedCartTotal)}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-500 font-bold">Target Batas Anggaran:</span>
                          <p className="text-xs font-black font-mono text-amber-400">
                            {formatRupiah(budgetThreshold)}
                          </p>
                        </div>
                      </div>

                      {/* Threshold Configurator */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px]">
                          <label className="text-slate-400 font-semibold">Ubah Batas Anggaran:</label>
                          <span className="text-slate-500 font-mono">Geser untuk mengubah</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min="10000000" // 10M
                            max="500000000" // 500M
                            step="10000000" // 10M steps
                            value={budgetThreshold}
                            onChange={(e) => setBudgetThreshold(parseInt(e.target.value))}
                            className="flex-1 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <input 
                            type="number"
                            value={budgetThreshold}
                            onChange={(e) => setBudgetThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-24 px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md text-[10px] font-mono font-bold text-slate-300 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Quick select presets */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {[25000000, 50000000, 100000000, 250000000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setBudgetThreshold(preset)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                                budgetThreshold === preset
                                  ? "bg-indigo-600 text-white border border-indigo-500"
                                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/5"
                              }`}
                            >
                              {preset >= 1000000000 ? `${preset / 1000000000}M` : preset >= 1000000 ? `${preset / 1000000} Jt` : preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Exceeded Warning Alert Banner */}
                      {isBudgetExceeded && (
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex gap-2.5 items-start text-[11px] text-red-300 animate-pulse shadow-md shadow-red-500/5">
                          <Icons.AlertOctagon className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-red-400 block uppercase tracking-wider text-[10px]">Peringatan Anggaran Terlampaui!</span>
                            <p className="text-slate-300 text-[10px] leading-relaxed">
                              Estimasi nilai keranjang penawaran Anda (<strong className="text-white">{formatRupiah(estimatedCartTotal)}</strong>) telah melewati batas anggaran yang Anda tetapkan (<strong className="text-white">{formatRupiah(budgetThreshold)}</strong>) sebesar <strong className="text-rose-400 font-bold">{formatRupiah(estimatedCartTotal - budgetThreshold)}</strong>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scan Barcode / QR Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 hover:from-indigo-600/30 hover:to-violet-600/30 text-indigo-200 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 border border-indigo-500/20 shadow-sm cursor-pointer group"
                    >
                      <Icons.Scan className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span>Scan Label Barcode / QR Produk</span>
                    </button>

                    {/* 'Ready to Scan' status indicator when active */}
                    {isScannerOpen && (
                      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex items-center justify-between text-xs animate-fadeIn shadow-lg shadow-emerald-500/5">
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-extrabold text-emerald-400 tracking-wide">Ready to Scan</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                          <Icons.Video className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Kamera Aktif & Pemindai Siap</span>
                        </div>
                      </div>
                    )}

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
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-[10px] text-slate-500">{item.product.category}</p>
                                {item.product.serialNumber && (
                                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-500/15">
                                    SN: {item.product.serialNumber}
                                  </span>
                                )}
                              </div>
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
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-[10px] text-slate-400 line-clamp-1">{item.description || "Item Kustom Khusus"}</p>
                                {item.serialNumber && (
                                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-500/15">
                                    SN: {item.serialNumber}
                                  </span>
                                )}
                              </div>
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

                    {/* Export to PDF button if cart is not empty */}
                    {(rfqCart.length > 0 || customCartItems.length > 0) && (
                      <button
                        type="button"
                        onClick={exportRfqCartToPdf}
                        className="w-full mt-3 py-2.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-200 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer group"
                      >
                        <FileText className="h-4 w-4 text-indigo-400 group-hover:text-white transition-colors" />
                        <span>Ekspor & Unduh Keranjang ke PDF</span>
                      </button>
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
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Serial Number (Opsional)</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: SN-7890ABCD" 
                            value={customItemSerial}
                            onChange={(e) => setCustomItemSerial(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-1">
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
                          <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${emailError ? 'text-red-400' : 'text-slate-500'}`} />
                          <input 
                            type="email" 
                            placeholder="Contoh: procurement@instansi.com"
                            value={rfqForm.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRfqForm({ ...rfqForm, email: val });
                              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                              if (val.trim() && !emailRegex.test(val.trim())) {
                                setEmailError("Format email tidak valid (contoh: nama@domain.com)");
                              } else {
                                setEmailError("");
                              }
                            }}
                            className={`pl-10 pr-4 py-2.5 bg-slate-950 border ${emailError ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-indigo-500'} rounded-xl text-xs focus:outline-none focus:ring-2 text-slate-200 w-full font-medium`}
                            required
                          />
                        </div>
                        {emailError && (
                          <p className="mt-1.5 text-[10px] text-red-400 flex items-center gap-1.5 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                            {emailError}
                          </p>
                        )}
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
                          <option value="pemerintah">Umum</option>
                          <option value="pendidikan">Lembaga Pendidikan</option>
                          <option value="umkm">UMKM / Individu</option>
                          <option value="retail">Retail & Toko</option>
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

                  <button
                    onClick={() => setActiveAdminSubTab("orders")}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                      activeAdminSubTab === "orders" 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icons.ShoppingBag className="h-4.5 w-4.5" />
                    <span>Pesanan Toko ({orders.length})</span>
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
                            <div className="flex flex-col gap-1.5">
                              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2" ref={statusFilterRef} id="rfq_status_filter_container">
                              {/* Glowing border animation overlay when active filters are detected */}
                              {(adminRfqStatuses.length > 0 || !!adminRfqSearch || !!adminRfqStartDate || !!adminRfqEndDate || !!adminRfqClientFilter || !!statusKeywordSearch) && (
                                <motion.div
                                  className="absolute inset-0 rounded-xl pointer-events-none z-0"
                                  animate={{
                                    boxShadow: [
                                      "0 0 0px 0px rgba(99, 102, 241, 0)",
                                      "0 0 6px 1.5px rgba(99, 102, 241, 0.45)",
                                      "0 0 0px 0px rgba(99, 102, 241, 0)"
                                    ],
                                    borderColor: [
                                      "rgba(99, 102, 241, 0.2)",
                                      "rgba(99, 102, 241, 0.7)",
                                      "rgba(99, 102, 241, 0.2)"
                                    ]
                                  }}
                                  style={{
                                    borderWidth: "1px",
                                    borderStyle: "solid"
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 2.2,
                                    ease: "easeInOut"
                                  }}
                                />
                              )}
                              {/* Hidden select for standard DOM API and integration compatibility */}
                              <select
                                id="rfq_status_filter"
                                multiple
                                value={adminRfqStatuses}
                                onChange={(e) => {
                                  const options = Array.from(e.target.selectedOptions).map((o) => (o as HTMLOptionElement).value);
                                  setAdminRfqStatuses(options.filter(val => val !== ""));
                                }}
                                className="sr-only"
                              >
                                <option value="">Semua Status ({adminRfqStatusCounts[""]})</option>
                                <option value="pending">Menunggu Proposal (Pending) ({adminRfqStatusCounts["pending"]})</option>
                                <option value="processing">Sedang Diproses (Processing) ({adminRfqStatusCounts["processing"]})</option>
                                <option value="quoted">Sudah Di-Quoted (Quoted) ({adminRfqStatusCounts["quoted"]})</option>
                                <option value="completed">Selesai (Completed) ({adminRfqStatusCounts["completed"]})</option>
                                <option value="cancelled">Dibatalkan (Cancelled) ({adminRfqStatusCounts["cancelled"]})</option>
                              </select>

                              {/* Keyword search input directly inside the filter container */}
                              <div className="relative shrink-0 z-10">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Cari kata kunci status..."
                                  value={statusKeywordSearch}
                                  onChange={(e) => setStatusKeywordSearch(e.target.value)}
                                  className="w-full sm:w-[180px] pl-9 pr-8 py-1.5 bg-slate-950 border border-white/10 hover:border-indigo-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                />
                                {statusKeywordSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setStatusKeywordSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer z-20"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>

                              {/* Inline Quick Custom Status Creator for Admins */}
                              <div className="flex items-center gap-2 bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1 z-10 shrink-0">
                                <input
                                  type="text"
                                  placeholder="+ Status kustom..."
                                  value={newCustomStatusName}
                                  onChange={(e) => setNewCustomStatusName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCreateCustomStatus();
                                    }
                                  }}
                                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-[110px] sm:w-[130px] font-medium"
                                />
                                
                                {/* Quick Color Dot Radio Buttons */}
                                <div className="flex items-center gap-1.5 border-l border-white/5 pl-2">
                                  {[
                                    { name: "purple", color: "bg-purple-400 shadow-[0_0_4px_rgba(168,85,247,0.4)]" },
                                    { name: "violet", color: "bg-violet-400 shadow-[0_0_4px_rgba(139,92,246,0.4)]" },
                                    { name: "pink", color: "bg-pink-400 shadow-[0_0_4px_rgba(236,72,153,0.4)]" },
                                    { name: "cyan", color: "bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.4)]" },
                                    { name: "amber", color: "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]" },
                                    { name: "blue", color: "bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.4)]" },
                                    { name: "emerald", color: "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.4)]" }
                                  ].map((col) => (
                                    <button
                                      key={col.name}
                                      type="button"
                                      onClick={() => setNewCustomStatusColor(col.name)}
                                      className={`h-2.5 w-2.5 rounded-full transition-all duration-200 cursor-pointer ${col.color} ${
                                        newCustomStatusColor === col.name 
                                          ? "scale-135 ring-1 ring-indigo-500/85" 
                                          : "hover:scale-125 opacity-60 hover:opacity-100"
                                      }`}
                                      title={`Pilih warna ${col.name}`}
                                    />
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={handleCreateCustomStatus}
                                  className="p-1 bg-indigo-600/20 hover:bg-indigo-600/45 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105"
                                  title="Tambah status kustom baru"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Relative wrapper for custom trigger and popover list to align perfectly */}
                              <div className="relative flex-1 sm:flex-initial z-10">
                                {/* Custom trigger button styled professionally */}
                                <button
                                  type="button"
                                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                                  className={`flex items-center justify-between border rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all gap-2 w-full sm:min-w-[210px] text-left ${
                                    adminRfqStatuses.length === 0
                                      ? "bg-slate-950 border-white/10 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-900"
                                      : adminRfqStatuses.length === 1
                                      ? adminRfqStatuses[0] === "pending"
                                        ? "bg-amber-950/40 border-amber-500/50 text-amber-400 hover:bg-amber-950/60"
                                        : adminRfqStatuses[0] === "processing"
                                        ? "bg-blue-950/40 border-blue-500/50 text-blue-400 hover:bg-blue-950/60"
                                        : adminRfqStatuses[0] === "quoted"
                                        ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/60"
                                        : adminRfqStatuses[0] === "completed"
                                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/60"
                                        : adminRfqStatuses[0] === "cancelled"
                                        ? "bg-rose-950/40 border-rose-500/50 text-rose-400 hover:bg-rose-950/60"
                                        : (() => {
                                            const found = (settings.customRfqStatuses || []).find(cs => cs.value === adminRfqStatuses[0]);
                                            const col = found ? found.color : "purple";
                                            if (col && col.startsWith("#")) {
                                              return "bg-slate-950 border-white/10 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-900";
                                            }
                                            return col === "purple" ? "bg-purple-950/40 border-purple-500/50 text-purple-400 hover:bg-purple-950/60" :
                                                   col === "violet" ? "bg-violet-950/40 border-violet-500/50 text-violet-400 hover:bg-violet-950/60" :
                                                   col === "pink" ? "bg-pink-950/40 border-pink-500/50 text-pink-400 hover:bg-pink-950/60" :
                                                   col === "cyan" ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/60" :
                                                   col === "amber" ? "bg-amber-950/40 border-amber-500/50 text-amber-400 hover:bg-amber-950/60" :
                                                   col === "blue" ? "bg-blue-950/40 border-blue-500/50 text-blue-400 hover:bg-blue-950/60" :
                                                   col === "emerald" ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/60" :
                                                   "bg-slate-950 border-white/10 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-900";
                                          })()
                                      : "bg-indigo-950/30 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/50"
                                  }`}
                                  style={adminRfqStatuses.length === 1 && (() => {
                                    const found = (settings.customRfqStatuses || []).find(cs => cs.value === adminRfqStatuses[0]);
                                    const col = found ? found.color : null;
                                    if (col && col.startsWith("#")) {
                                      return {
                                        backgroundColor: `${col}15`,
                                        borderColor: `${col}50`,
                                        color: col
                                      };
                                    }
                                    return undefined;
                                  })() || undefined}
                                >
                                  <div className="flex items-center gap-2">
                                    {adminRfqStatuses.length === 0 ? (
                                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                                    ) : adminRfqStatuses.length === 1 ? (
                                      <span 
                                        className={`h-2 w-2 rounded-full ${
                                          adminRfqStatuses[0] === "pending"
                                            ? "bg-amber-400 animate-pulse"
                                            : adminRfqStatuses[0] === "processing"
                                            ? "bg-blue-400 animate-pulse"
                                            : adminRfqStatuses[0] === "quoted"
                                            ? "bg-indigo-400"
                                            : adminRfqStatuses[0] === "completed"
                                            ? "bg-emerald-400"
                                            : adminRfqStatuses[0] === "cancelled"
                                            ? "bg-rose-400"
                                            : (() => {
                                                const found = (settings.customRfqStatuses || []).find(cs => cs.value === adminRfqStatuses[0]);
                                                const col = found ? found.color : "purple";
                                                if (col && col.startsWith("#")) {
                                                  return "animate-pulse";
                                                }
                                                return col === "purple" ? "bg-purple-400 animate-pulse" :
                                                       col === "violet" ? "bg-violet-400 animate-pulse" :
                                                       col === "pink" ? "bg-pink-400 animate-pulse" :
                                                       col === "cyan" ? "bg-cyan-400 animate-pulse" :
                                                       col === "amber" ? "bg-amber-400" :
                                                       col === "blue" ? "bg-blue-400" :
                                                       col === "emerald" ? "bg-emerald-400" : "bg-purple-400 animate-pulse";
                                              })()
                                        }`}
                                        style={(() => {
                                          const found = (settings.customRfqStatuses || []).find(cs => cs.value === adminRfqStatuses[0]);
                                          const col = found ? found.color : null;
                                          if (col && col.startsWith("#")) {
                                            return {
                                              backgroundColor: col,
                                              boxShadow: `0 0 8px ${col}`
                                            };
                                          }
                                          return undefined;
                                        })()}
                                      />
                                    ) : (
                                      <div className="flex -space-x-1 items-center">
                                        {adminRfqStatuses.map((st) => {
                                          const found = (settings.customRfqStatuses || []).find(cs => cs.value === st);
                                          const col = found ? found.color : null;
                                          const isHex = col && col.startsWith("#");
                                          return (
                                            <span 
                                              key={st} 
                                              className={`h-2 w-2 rounded-full border border-slate-950 ${
                                                st === "pending" ? "bg-amber-400 animate-pulse" :
                                                st === "processing" ? "bg-blue-400 animate-pulse" :
                                                st === "quoted" ? "bg-indigo-400" :
                                                st === "completed" ? "bg-emerald-400" :
                                                st === "cancelled" ? "bg-rose-400" :
                                                isHex ? "animate-pulse" : "bg-purple-400 animate-pulse"
                                              }`}
                                              style={isHex ? {
                                                backgroundColor: col,
                                                boxShadow: `0 0 4px ${col}`
                                              } : undefined}
                                            />
                                          );
                                        })}
                                      </div>
                                    )}
                                    <span>
                                      {adminRfqStatuses.length === 0
                                        ? `Semua Status (${adminRfqStatusCounts[""]})`
                                        : adminRfqStatuses.length === 1
                                        ? (() => {
                                            const st = adminRfqStatuses[0];
                                            if (st === "pending") return `Menunggu Proposal (${adminRfqStatusCounts["pending"]})`;
                                            if (st === "processing") return `Sedang Diproses (${adminRfqStatusCounts["processing"]})`;
                                            if (st === "quoted") return `Sudah Di-Quoted (${adminRfqStatusCounts["quoted"]})`;
                                            if (st === "completed") return `Selesai (${adminRfqStatusCounts["completed"]})`;
                                            if (st === "cancelled") return `Dibatalkan (${adminRfqStatusCounts["cancelled"]})`;
                                            
                                            const found = (settings.customRfqStatuses || []).find(cs => cs.value === st);
                                            return `${found ? found.label : st} (${adminRfqStatusCounts[st] || 0})`;
                                          })()
                                        : `${adminRfqStatuses.length} Status Terpilih`}
                                    </span>
                                  </div>
                                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isStatusFilterOpen ? "rotate-180" : ""}`} />
                                </button>

                                {/* Custom Styled Dropdown Options with pills and subtexts */}
                                {isStatusFilterOpen && (
                                  <div 
                                    className="absolute top-full right-0 sm:left-0 mt-1.5 w-[260px] bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 p-1 divide-y divide-white/5 backdrop-blur-md"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Color Legend Header */}
                                    <div className="px-2.5 py-2 bg-slate-900/80 rounded-t-lg border-b border-white/5 text-[10px] text-slate-300">
                                      <div className="flex items-center justify-between mb-1.5 font-bold text-slate-200 uppercase tracking-wider text-[9px]">
                                        <div className="flex items-center gap-1">
                                          <Icons.Info className="h-3 w-3 text-indigo-400" />
                                          <span>Prioritas Warna / Legend (Geser untuk Urutkan)</span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1.5 mt-1 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
                                        {orderedLegendStatuses.map((item) => {
                                          const isCustom = item.isCustom;
                                          const isHexColor = isCustom && (item.color || "").startsWith("#");
                                          
                                          // Determine dot style
                                          let dotStyle = undefined;
                                          let dotClass = "h-1.5 w-1.5 rounded-full shrink-0";
                                          
                                          if (isCustom) {
                                            dotClass += " animate-pulse";
                                            if (isHexColor) {
                                              dotStyle = {
                                                backgroundColor: item.color,
                                                boxShadow: `0 0 4px ${item.color}`
                                              };
                                            } else {
                                              const tailwindColorMap: Record<string, string> = {
                                                purple: "bg-purple-400 shadow-[0_0_4px_rgba(168,85,247,0.5)]",
                                                violet: "bg-violet-400 shadow-[0_0_4px_rgba(139,92,246,0.5)]",
                                                pink: "bg-pink-400 shadow-[0_0_4px_rgba(236,72,153,0.5)]",
                                                cyan: "bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.5)]",
                                                amber: "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]",
                                                blue: "bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.5)]",
                                                emerald: "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]",
                                                slate: "bg-slate-400 shadow-[0_0_4px_rgba(100,116,139,0.5)]"
                                              };
                                              dotClass += ` ${tailwindColorMap[item.color] || "bg-purple-400 shadow-[0_0_4px_rgba(168,85,247,0.5)]"}`;
                                            }
                                          } else {
                                            const defaultDotMap: Record<string, string> = {
                                              pending: "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]",
                                              processing: "bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.5)]",
                                              quoted: "bg-indigo-400 shadow-[0_0_4px_rgba(99,102,241,0.5)]",
                                              completed: "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]",
                                              cancelled: "bg-rose-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                                            };
                                            dotClass += ` ${defaultDotMap[item.value] || ""}`;
                                          }

                                          return (
                                            <div 
                                              key={item.value}
                                              draggable
                                              onDragStart={(e) => {
                                                e.dataTransfer.setData("text/plain", item.value);
                                                e.currentTarget.classList.add("opacity-40", "scale-[0.98]", "border-indigo-500/50");
                                                setDraggingStatus(item.value);
                                              }}
                                              onDragEnd={(e) => {
                                                e.currentTarget.classList.remove("opacity-40", "scale-[0.98]", "border-indigo-500/50");
                                                setDraggingStatus(null);
                                              }}
                                              onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add("bg-indigo-950/20", "border-indigo-500/30");
                                              }}
                                              onDragLeave={(e) => {
                                                e.currentTarget.classList.remove("bg-indigo-950/20", "border-indigo-500/30");
                                              }}
                                              onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove("bg-indigo-950/20", "border-indigo-500/30");
                                                const draggedValue = e.dataTransfer.getData("text/plain");
                                                const targetValue = item.value;
                                                if (draggedValue && draggedValue !== targetValue) {
                                                  const currentOrder = orderedLegendStatuses.map(s => s.value);
                                                  const draggedIdx = currentOrder.indexOf(draggedValue);
                                                  const targetIdx = currentOrder.indexOf(targetValue);
                                                  if (draggedIdx !== -1 && targetIdx !== -1) {
                                                    const newOrder = [...currentOrder];
                                                    newOrder.splice(draggedIdx, 1);
                                                    newOrder.splice(targetIdx, 0, draggedValue);
                                                    setLegendStatusOrder(newOrder);
                                                    localStorage.setItem("bbs_rfq_status_priority", JSON.stringify(newOrder));
                                                  }
                                                }
                                              }}
                                              className={`flex items-center justify-between gap-2 bg-slate-900/50 hover:bg-slate-900 px-2 py-1.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none ${
                                                draggingStatus === item.value 
                                                  ? "border-indigo-500/50 bg-indigo-950/20" 
                                                  : "border-white/5 hover:border-white/10"
                                              }`}
                                            >
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <Icons.GripVertical className="h-3 w-3 text-slate-600 hover:text-slate-400 shrink-0 cursor-grab" />
                                                <span className={dotClass} style={dotStyle} />
                                                <span className="truncate text-slate-300 font-bold text-[10px]">
                                                  {isCustom ? item.label : (
                                                    item.value === "pending" ? "Amber = Pending" :
                                                    item.value === "processing" ? "Biru = Processing" :
                                                    item.value === "quoted" ? "Indigo = Quoted" :
                                                    item.value === "completed" ? "Hijau = Completed" :
                                                    item.value === "cancelled" ? "Merah = Cancelled" : item.label
                                                  )}
                                                </span>
                                              </div>
                                              
                                              {isCustom ? (
                                                <div className="flex items-center gap-1 shrink-0">
                                                  <input 
                                                    type="color"
                                                    value={isHexColor ? item.color : "#a855f7"}
                                                    onChange={(e) => handleUpdateCustomStatusColor(item.value, e.target.value)}
                                                    className="h-3.5 w-3.5 rounded-sm cursor-pointer border-0 bg-transparent p-0 flex-shrink-0"
                                                    title={`Ubah warna status ${item.label}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <span className="text-[8.5px] font-mono text-slate-500 uppercase">
                                                    {isHexColor ? item.color : "PRESET"}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-[8.5px] font-semibold text-slate-600 uppercase shrink-0 px-1 py-0.5 bg-slate-950/40 rounded border border-white/5">
                                                  Standard
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="py-1 space-y-0.5">
                                      {/* Select All Checkbox */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const allAvailable = ["pending", "processing", "quoted", "completed", "cancelled"];
                                          const areAllSelected = allAvailable.every(s => adminRfqStatuses.includes(s));
                                          if (areAllSelected) {
                                            setAdminRfqStatuses([]);
                                          } else {
                                            setAdminRfqStatuses(allAvailable);
                                          }
                                        }}
                                        className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border border-transparent hover:bg-slate-900 text-slate-200 hover:text-white"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                                            adminRfqStatuses.length === 5 
                                              ? "bg-indigo-600 border-indigo-500 text-white" 
                                              : adminRfqStatuses.length > 0
                                              ? "bg-slate-800 border-indigo-500/50 text-indigo-400"
                                              : "border-white/20 bg-slate-900 text-transparent"
                                          }`}>
                                            {adminRfqStatuses.length === 5 ? (
                                              <Check className="h-3 w-3 stroke-[3]" />
                                            ) : adminRfqStatuses.length > 0 ? (
                                              <div className="h-0.5 w-2 bg-indigo-400 rounded-sm" />
                                            ) : null}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="font-bold text-slate-200">Pilih Semua (Select All)</span>
                                            <span className="text-[9px] text-slate-500">Aktifkan atau matikan semua status</span>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded border border-white/5 font-bold">
                                          {adminRfqStatuses.length}/5
                                        </span>
                                      </button>

                                      <div className="h-px bg-white/5 my-1" />

                                      {(() => {
                                        const allOptionItems = [
                                          { value: "pending", label: "Menunggu Proposal", desc: "RFQ baru butuh penawaran", color: "amber", isCustom: false },
                                          { value: "processing", label: "Sedang Diproses", desc: "Sedang dipersiapkan sales", color: "blue", isCustom: false },
                                          { value: "quoted", label: "Sudah Di-Quoted", desc: "Proposal penawaran terkirim", color: "indigo", isCustom: false },
                                          { value: "completed", label: "Selesai", desc: "Transaksi berhasil tuntas", color: "emerald", isCustom: false },
                                          { value: "cancelled", label: "Dibatalkan", desc: "RFQ ditolak atau batal", color: "rose", isCustom: false },
                                          ...(settings.customRfqStatuses || []).map((cs) => ({
                                            value: cs.value,
                                            label: cs.label,
                                            desc: cs.desc,
                                            color: cs.color || "purple",
                                            isCustom: true
                                          }))
                                        ];

                                        const sortedOptionItems = [...allOptionItems].sort((a, b) => {
                                          let idxA = legendStatusOrder.indexOf(a.value);
                                          let idxB = legendStatusOrder.indexOf(b.value);
                                          if (idxA === -1) idxA = 9999;
                                          if (idxB === -1) idxB = 9999;
                                          return idxA - idxB;
                                        });

                                        const finalOptionItems = [
                                          { value: "", label: "Semua Status", desc: "Tampilkan semua RFQ", color: "slate", isCustom: false },
                                          ...sortedOptionItems
                                        ];

                                        return finalOptionItems.filter(item => {
                                          const q = statusKeywordSearch.toLowerCase().trim();
                                          if (!q) return true;
                                          return item.label.toLowerCase().includes(q) || 
                                                 item.desc.toLowerCase().includes(q) || 
                                                 item.value.toLowerCase().includes(q);
                                        });
                                      })().map((item) => {
                                      const isSelected = item.value === "" ? adminRfqStatuses.length === 0 : adminRfqStatuses.includes(item.value);
                                      const count = adminRfqStatusCounts[item.value as keyof typeof adminRfqStatusCounts] || 0;
                                      return (
                                        <button
                                          key={item.value}
                                          type="button"
                                          onMouseEnter={() => setHoveredStatusItem(item.value)}
                                          onMouseLeave={() => setHoveredStatusItem(null)}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.value === "") {
                                              setAdminRfqStatuses([]);
                                            } else {
                                              if (adminRfqStatuses.includes(item.value)) {
                                                setAdminRfqStatuses(adminRfqStatuses.filter(s => s !== item.value));
                                              } else {
                                                setAdminRfqStatuses([...adminRfqStatuses, item.value]);
                                              }
                                            }
                                          }}
                                          className={`relative w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                            isSelected 
                                              ? item.color === "amber"
                                                ? "bg-amber-950/50 text-amber-300 border border-amber-500/20"
                                                : item.color === "blue"
                                                ? "bg-blue-950/50 text-blue-300 border border-blue-500/20"
                                                : item.color === "indigo"
                                                ? "bg-indigo-950/50 text-indigo-300 border border-indigo-500/20"
                                                : item.color === "emerald"
                                                ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/20"
                                                : item.color === "rose"
                                                ? "bg-rose-950/50 text-rose-300 border border-rose-500/20"
                                                : item.color === "purple"
                                                ? "bg-purple-950/50 text-purple-300 border border-purple-500/20"
                                                : item.color === "violet"
                                                ? "bg-violet-950/50 text-violet-300 border border-violet-500/20"
                                                : item.color === "pink"
                                                ? "bg-pink-950/50 text-pink-300 border border-pink-500/20"
                                                : item.color === "cyan"
                                                ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/20"
                                                : item.color.startsWith("#")
                                                ? "border border-white/10"
                                                : "bg-slate-800 text-white border border-white/10"
                                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                                          }`}
                                          style={isSelected && item.color.startsWith("#") ? {
                                            backgroundColor: `${item.color}15`,
                                            borderColor: `${item.color}35`,
                                            color: item.color
                                          } : undefined}
                                        >
                                          <div className="flex items-center gap-2">
                                            {/* Pill / side indicator */}
                                            <span 
                                              className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                                item.color === "amber" ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                                item.color === "blue" ? "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" :
                                                item.color === "indigo" ? "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]" :
                                                item.color === "emerald" ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                item.color === "rose" ? "bg-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                                item.color === "purple" ? "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" :
                                                item.color === "violet" ? "bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" :
                                                item.color === "pink" ? "bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]" :
                                                item.color === "cyan" ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" :
                                                item.color.startsWith("#") ? "" : "bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]"
                                              }`} 
                                              style={item.color.startsWith("#") ? {
                                                backgroundColor: item.color,
                                                boxShadow: `0 0 8px ${item.color}`
                                              } : undefined}
                                            />
                                            <div className="flex flex-col">
                                              <span className="font-semibold text-slate-200">
                                                {item.label} <span className="opacity-75 font-normal">({count})</span>
                                              </span>
                                              <span className="text-[10px] text-slate-500">{item.desc}</span>
                                            </div>
                                          </div>
                                          {/* Mini pill name & selection status */}
                                          <div className="flex items-center gap-1.5">
                                            {item.isCustom && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteCustomStatus(item.value);
                                                }}
                                                className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer mr-0.5"
                                                title="Hapus status kustom ini"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                            <span 
                                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                item.color === "amber" ? "bg-amber-500/10 text-amber-400" :
                                                item.color === "blue" ? "bg-blue-500/10 text-blue-400" :
                                                item.color === "indigo" ? "bg-indigo-500/10 text-indigo-400" :
                                                item.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
                                                item.color === "rose" ? "bg-rose-500/10 text-rose-400" :
                                                item.color === "purple" ? "bg-purple-500/10 text-purple-400" :
                                                item.color === "violet" ? "bg-violet-500/10 text-violet-400" :
                                                item.color === "pink" ? "bg-pink-500/10 text-pink-400" :
                                                item.color === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
                                                item.color.startsWith("#") ? "" : "bg-slate-500/10 text-slate-400"
                                              }`}
                                              style={item.color.startsWith("#") ? {
                                                backgroundColor: `${item.color}15`,
                                                color: item.color
                                              } : undefined}
                                            >
                                              {item.value || "All"}
                                            </span>
                                            {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                                          </div>

                                          {/* Beautiful custom-styled floating tooltip */}
                                          <AnimatePresence>
                                            {hoveredStatusItem === item.value && (
                                              <motion.div
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -6 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-[100] px-3 py-2 bg-slate-950 border border-indigo-500/30 rounded-lg text-[11px] text-slate-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap pointer-events-none flex flex-col gap-0.5 backdrop-blur-xl border-l-4"
                                                style={{
                                                  borderLeftColor: 
                                                    item.color === "amber" ? "#f59e0b" :
                                                    item.color === "blue" ? "#3b82f6" :
                                                    item.color === "indigo" ? "#6366f1" :
                                                    item.color === "emerald" ? "#10b981" :
                                                    item.color === "rose" ? "#ef4444" :
                                                    item.color === "purple" ? "#a855f7" :
                                                    item.color === "violet" ? "#8b5cf6" :
                                                    item.color === "pink" ? "#ec4899" :
                                                    item.color === "cyan" ? "#06b6d4" :
                                                    item.color.startsWith("#") ? item.color : "#64748b"
                                                }}
                                              >
                                                <div className="flex items-center gap-1.5 font-bold text-white">
                                                  <span className="font-mono text-indigo-400 font-black">{count}</span>
                                                  <span>RFQ</span>
                                                </div>
                                                <div className="text-[9.5px] text-slate-500 font-medium">
                                                  {item.value === "" ? "Semua request terdaftar" : `Status: ${item.label}`}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              </div>
                            </div>
                            {/* Visually Distinct Color-Coded Legend */}
                            <div className="flex flex-wrap gap-x-2.5 gap-y-1 items-center text-[10px] text-slate-400 bg-slate-900/30 border border-white/5 rounded-lg px-2 py-1 select-none backdrop-blur-sm shadow-inner mt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.6)] animate-pulse" />
                                <span className="font-semibold text-slate-300">Pending</span>
                                <span className="text-slate-500 text-[8.5px]">(Menunggu)</span>
                              </div>
                              <span className="text-white/10 text-[8px]">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.6)] animate-pulse" />
                                <span className="font-semibold text-slate-300">Processing</span>
                                <span className="text-slate-500 text-[8.5px]">(Diproses)</span>
                              </div>
                              <span className="text-white/10 text-[8px]">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                                <span className="font-semibold text-slate-300">Quoted</span>
                                <span className="text-slate-500 text-[8.5px]">(Penawaran)</span>
                              </div>
                              <span className="text-white/10 text-[8px]">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                                <span className="font-semibold text-slate-300">Completed</span>
                                <span className="text-slate-500 text-[8.5px]">(Selesai)</span>
                              </div>
                              <span className="text-white/10 text-[8px]">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
                                <span className="font-semibold text-slate-300">Cancelled</span>
                                <span className="text-slate-500 text-[8.5px]">(Batal)</span>
                              </div>
                            </div>
                          </div>

                          {/* Summary count displaying how many RFQs are visible in the table */}
                            <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl font-bold shrink-0">
                              <span>Visible:</span>
                              <motion.span
                                id="rfq_status_filter_summary_count"
                                key={filteredRfqsForAdmin.length}
                                animate={isFilterPulsing ? { scale: [1, 1.25, 1], color: ["#a5b4fc", "#10b981", "#a5b4fc"] } : {}}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className={`font-black ${isFilterPulsing ? "animate-pulse text-emerald-400" : ""}`}
                              >
                                {filteredRfqsForAdmin.length}
                              </motion.span>
                              <span className="text-slate-500">/{rfqs.length}</span>
                            </div>

                            {adminRfqStatuses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setAdminRfqStatuses([])}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>

                          {/* Client / Company Dropdown Filter Section */}
                          <div className="flex flex-wrap items-center gap-2 md:border-l md:border-white/10 md:pl-4">
                            <div className="flex items-center space-x-2 text-slate-300 font-semibold shrink-0">
                              <User className="h-4 w-4 text-sky-400" />
                              <span>Klien:</span>
                            </div>
                            <div className="relative">
                              <select
                                id="rfq_client_filter"
                                value={adminRfqClientFilter}
                                onChange={(e) => setAdminRfqClientFilter(e.target.value)}
                                className="bg-slate-950 border border-white/10 hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all max-w-[220px] cursor-pointer"
                              >
                                <option value="">Semua Klien & Instansi</option>
                                <optgroup label="Kategori Klien" className="text-slate-400 bg-slate-950 font-semibold">
                                  <option value="cat:perusahaan" className="text-slate-200">🏢 Perusahaan / Corporate</option>
                                  <option value="cat:pemerintah" className="text-slate-200">🏛️ Instansi Pemerintah / Umum</option>
                                  <option value="cat:pendidikan" className="text-slate-200">🎓 Lembaga Pendidikan</option>
                                  <option value="cat:umkm" className="text-slate-200">🏪 UMKM / Bisnis Lokal</option>
                                  <option value="cat:retail" className="text-slate-200">👤 Pelanggan Retail</option>
                                </optgroup>
                                <optgroup label="Nama Klien & Instansi" className="text-slate-400 bg-slate-950 font-semibold">
                                  {uniqueClientsAndCompanies.map((name) => (
                                    <option key={name} value={name} className="text-slate-200">
                                      {name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                            {adminRfqClientFilter && (
                              <button
                                type="button"
                                onClick={() => setAdminRfqClientFilter("")}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                <span>Hapus</span>
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

                      {/* Status Color Legend */}
                      <div className="px-5 py-2.5 bg-slate-950/20 border-b border-white/5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-400">
                        <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider flex items-center gap-1">
                          <Icons.Info className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Legenda Status:</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                          {[
                            { value: "pending", label: "Menunggu Proposal", color: "amber", desc: "Pending", pulse: true },
                            { value: "processing", label: "Sedang Diproses", color: "blue", desc: "Processing", pulse: true },
                            { value: "quoted", label: "Sudah Di-Quoted", color: "indigo", desc: "Quoted" },
                            { value: "completed", label: "Selesai", color: "emerald", desc: "Completed" },
                            { value: "cancelled", label: "Dibatalkan", color: "rose", desc: "Cancelled" }
                          ].map((item) => {
                            const isFilteringThis = adminRfqStatuses.includes(item.value);
                            const count = adminRfqStatusCounts[item.value as keyof typeof adminRfqStatusCounts] || 0;
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  if (adminRfqStatuses.includes(item.value)) {
                                    setAdminRfqStatuses(adminRfqStatuses.filter(s => s !== item.value));
                                  } else {
                                    setAdminRfqStatuses([...adminRfqStatuses, item.value]);
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                  isFilteringThis
                                    ? item.color === "amber"
                                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                      : item.color === "blue"
                                      ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                                      : item.color === "indigo"
                                      ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                                      : item.color === "emerald"
                                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                      : "bg-rose-500/15 border-rose-500/40 text-rose-300"
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-400 hover:text-slate-200"
                                }`}
                                title={`Saring berdasarkan ${item.label}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  item.color === "amber" ? "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" :
                                  item.color === "blue" ? "bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]" :
                                  item.color === "indigo" ? "bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)]" :
                                  item.color === "emerald" ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" :
                                  "bg-rose-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                } ${item.pulse ? "animate-pulse" : ""}`} />
                                <span className="font-extrabold text-[10px] uppercase tracking-wider">{item.desc}</span>
                                <span className="text-[10px] font-medium text-slate-300">({item.label})</span>
                                <span className="font-mono text-[10px] opacity-75 font-black text-indigo-300">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {rfqs.length > 0 ? (
                        <motion.div
                          key={adminRfqStatuses.join(",")}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className="overflow-x-auto"
                        >
                          {/* Client Detail Status Banner (Active when client filter is set) */}
                          {adminRfqClientFilter && (
                            <div className="mb-4 p-4 bg-slate-900/40 border border-indigo-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const cat = selectedClientCategory || "retail";
                                  const clientCategoryIcons: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; border: string; label: string }> = {
                                    perusahaan: { 
                                      icon: Icons.Building2, 
                                      color: "text-blue-400", 
                                      bg: "bg-blue-500/10", 
                                      border: "border-blue-500/20",
                                      label: "Perusahaan / Corporate" 
                                    },
                                    pemerintah: { 
                                      icon: Icons.Landmark, 
                                      color: "text-purple-400", 
                                      bg: "bg-purple-500/10", 
                                      border: "border-purple-500/20",
                                      label: "Instansi Pemerintah / Umum" 
                                    },
                                    pendidikan: { 
                                      icon: Icons.GraduationCap, 
                                      color: "text-cyan-400", 
                                      bg: "bg-cyan-500/10", 
                                      border: "border-cyan-500/20",
                                      label: "Lembaga Pendidikan" 
                                    },
                                    umkm: { 
                                      icon: Icons.Store, 
                                      color: "text-amber-400", 
                                      bg: "bg-amber-500/10", 
                                      border: "border-amber-500/20",
                                      label: "UMKM / Bisnis Lokal" 
                                    },
                                    retail: { 
                                      icon: Icons.User, 
                                      color: "text-emerald-400", 
                                      bg: "bg-emerald-500/10", 
                                      border: "border-emerald-500/20",
                                      label: "Pelanggan Retail" 
                                    },
                                  };
                                  const config = clientCategoryIcons[cat] || clientCategoryIcons.retail;
                                  const CategoryIcon = config.icon;
                                  return (
                                    <>
                                      <div className={`p-2.5 rounded-xl border ${config.bg} ${config.border} ${config.color}`}>
                                        <CategoryIcon className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                          {adminRfqClientFilter.startsWith("cat:") ? "Filter Kategori Klien" : "Filter Klien / Perusahaan"}
                                        </div>
                                        <div className="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
                                          <span>{adminRfqClientFilter.startsWith("cat:") ? config.label : adminRfqClientFilter}</span>
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${config.bg} ${config.border} ${config.color}`}>
                                            {config.label}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-6">
                                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    <Icons.TrendingUp className="h-5 w-5 animate-pulse" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Nilai Pending RFQ</div>
                                    <div className="text-base font-black text-amber-400 font-mono tracking-tight mt-0.5">
                                      {formatRupiah(selectedClientPendingValue)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center md:border-l md:border-white/10 md:pl-6">
                                  <button
                                    type="button"
                                    onClick={downloadCsvForSelectedClient}
                                    className="px-4 py-2.5 bg-emerald-600/95 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer border border-emerald-500/30 hover:scale-[1.02]"
                                  >
                                    <Icons.Download className="h-4 w-4" />
                                    <span>Download CSV</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
                                <th className="p-4 w-12 text-center">
                                  <input
                                    type="checkbox"
                                    checked={filteredRfqsForAdmin.length > 0 && selectedRfqIds.length === filteredRfqsForAdmin.length}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRfqIds(filteredRfqsForAdmin.map(r => r.id));
                                      } else {
                                        setSelectedRfqIds([]);
                                      }
                                    }}
                                    className="rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500/30 h-3.5 w-3.5 cursor-pointer"
                                  />
                                </th>
                                <th className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    <span>No RFQ</span>
                                    {selectedRfqIds.length > 0 && (
                                      <div className="flex items-center gap-1.5 relative inline-block text-left text-[10px] normal-case">
                                        <select
                                          disabled={isBulkUpdating || isBulkNotifying}
                                          value=""
                                          onChange={(e) => {
                                            if (e.target.value === "notify") {
                                              handleBulkNotifyClients();
                                            } else if (e.target.value) {
                                              handleBulkStatusUpdate(e.target.value);
                                            }
                                          }}
                                          className="bg-indigo-950/90 text-indigo-200 border border-indigo-500/30 text-[10px] font-extrabold rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                        >
                                          <option value="">Aksi Massal...</option>
                                          <option value="pending">Ubah ke Pending</option>
                                          <option value="processing">Ubah ke Processing</option>
                                          <option value="quoted">Ubah ke Quoted</option>
                                          <option value="completed">Ubah ke Completed</option>
                                          <option value="cancelled">Ubah ke Cancelled</option>
                                          <option value="notify">✉ Notify Klien (Kirim Email)</option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => handleBulkNotifyClients()}
                                          disabled={isBulkUpdating || isBulkNotifying}
                                          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded px-2 py-0.5 flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
                                          title="Kirim email status terbaru ke semua klien yang dipilih"
                                        >
                                          {isBulkNotifying ? (
                                            <span className="flex items-center gap-1">
                                              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                              Kirim...
                                            </span>
                                          ) : (
                                            <>
                                              <Icons.Mail className="h-3 w-3" />
                                              <span>Notify Klien</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </th>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Info Klien</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Daftar Barang</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Komentar Internal</th>
                                <th className="p-4 text-center">SLA Response (48j)</th>
                                <th className="p-4 text-center">Aksi / Penawaran AI</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {filteredRfqsForAdmin.length > 0 ? (
                                filteredRfqsForAdmin.map((rfq) => {
                                  // SLA calculation
                                  const isQuoted = rfq.status === "quoted" || rfq.status === "completed";
                                  let submitDate = new Date(rfq.date);
                                  const rfqIdNum = parseInt(rfq.id.replace("rfq_", ""), 10);
                                  const hasExactTime = rfq.id.startsWith("rfq_") && !isNaN(rfqIdNum) && rfqIdNum > 1000000000000;
                                  
                                  if (hasExactTime) {
                                    submitDate = new Date(rfqIdNum);
                                  }

                                  const now = new Date();
                                  const diffMs = now.getTime() - submitDate.getTime();
                                  const hoursElapsed = diffMs / (1000 * 60 * 60);
                                  const remainingHours = 48 - hoursElapsed;
                                  const isOverdue = !isQuoted && remainingHours <= 0;
                                  const isWarning = !isQuoted && remainingHours > 0 && remainingHours < 12;

                                  let rowClass = "hover:bg-white/[0.02] transition-all duration-200";
                                  if (isOverdue) {
                                    rowClass = "bg-red-500/10 hover:bg-red-500/15 border-l-2 border-red-500 text-red-100 transition-all duration-200";
                                  } else if (isWarning) {
                                    rowClass = "bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500 transition-all duration-200";
                                  }

                                  return (
                                    <tr key={rfq.id} className={rowClass}>
                                      <td className="p-4 font-mono font-bold text-indigo-400">
                                        <div className="flex items-center space-x-1.5">
                                          {isOverdue && <Icons.AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 animate-pulse animate-duration-1000" />}
                                          <span>{rfq.rfqNumber}</span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-slate-300">
                                        <div>{rfq.date}</div>
                                        {hasExactTime && (
                                          <div className="text-[9px] text-slate-500 mt-0.5">
                                            {submitDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-4">
                                        <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                                          {(() => {
                                            const stat = rfq.status || "pending";
                                            const foundCustom = (settings.customRfqStatuses || []).find(cs => cs.value === stat);
                                            if (foundCustom) {
                                              const customCol = foundCustom.color || "#a855f7";
                                              const isHex = customCol.startsWith("#");
                                              return (
                                                <span 
                                                  className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse" 
                                                  style={isHex ? {
                                                    backgroundColor: customCol,
                                                    boxShadow: `0 0 5px ${customCol}`
                                                  } : undefined}
                                                />
                                              );
                                            }

                                            const dotColors: Record<string, string> = {
                                              pending: "bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.6)]",
                                              processing: "bg-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.6)]",
                                              quoted: "bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.6)]",
                                              completed: "bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.6)]",
                                              cancelled: "bg-rose-400 shadow-[0_0_5px_rgba(239,68,68,0.6)]",
                                            };
                                            const colorClass = dotColors[stat] || dotColors.pending;
                                            return (
                                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorClass} ${stat === "pending" || stat === "processing" ? "animate-pulse" : ""}`} />
                                            );
                                          })()}
                                          <span>{rfq.clientName}</span>
                                        </div>
                                        {rfq.companyName && <div className="text-[10px] text-slate-400 mt-0.5 pl-3">{rfq.companyName}</div>}
                                        <div className="text-[10px] text-slate-500 font-mono mt-1 pl-3">{rfq.whatsapp} | {rfq.email}</div>
                                      </td>
                                      <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                          rfq.clientCategory === "pemerintah" 
                                            ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
                                            : rfq.clientCategory === "pendidikan"
                                            ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                                            : rfq.clientCategory === "perusahaan"
                                            ? "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                                            : rfq.clientCategory === "retail"
                                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                                            : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                                        }`}>
                                          {rfq.clientCategory === "pemerintah" ? "umum" : rfq.clientCategory}
                                        </span>
                                      </td>
                                      <td className="p-4 max-w-xs">
                                        <div className="space-y-1">
                                          {rfq.items.map((it, idx) => (
                                            <div key={idx} className="text-[11px] text-slate-200 flex flex-col gap-1 bg-white/5 px-2 py-1.5 rounded">
                                              <div className="flex justify-between gap-2">
                                                <span className="font-bold">{it.name}</span>
                                                <span className="text-amber-400 font-bold font-mono">x{it.quantity}</span>
                                              </div>
                                              {it.serialNumber && (
                                                <div className="text-[9px] font-mono text-indigo-300 bg-indigo-950/40 px-1 py-0.5 rounded self-start border border-indigo-500/10">
                                                  SN: {it.serialNumber}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {rfq.customRequirements && (
                                            <div className="text-[10px] text-amber-300 italic line-clamp-1 mt-1">Req: {rfq.customRequirements}</div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        {(() => {
                                          const status = rfq.status || "pending";
                                          const foundCustom = (settings.customRfqStatuses || []).find(cs => cs.value === status);
                                          
                                          if (foundCustom) {
                                            const customCol = foundCustom.color || "#a855f7";
                                            const isHex = customCol.startsWith("#");
                                            
                                            // Determine colors based on preset or hexadecimal
                                            let bg = "bg-purple-500/15";
                                            let border = "border-purple-500/30";
                                            let text = "text-purple-400";
                                            let dot = "bg-purple-400";
                                            
                                            if (isHex) {
                                              // Hexadecimal status tag - apply inline style below, fallback values here
                                              bg = "";
                                              border = "";
                                              text = "";
                                              dot = "";
                                            } else {
                                              // Color string matching presets
                                              const mapping: Record<string, { bg: string; text: string; border: string; dot: string }> = {
                                                purple: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", dot: "bg-purple-400" },
                                                violet: { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", dot: "bg-violet-400" },
                                                pink: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30", dot: "bg-pink-400" },
                                                cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", dot: "bg-cyan-400" },
                                                amber: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
                                                blue: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
                                                emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" }
                                              };
                                              const map = mapping[customCol] || mapping.purple;
                                              bg = map.bg;
                                              border = map.border;
                                              text = map.text;
                                              dot = map.dot;
                                            }

                                            return (
                                              <span 
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${bg} ${border} ${text}`}
                                                style={isHex ? {
                                                  backgroundColor: `${customCol}15`,
                                                  borderColor: `${customCol}30`,
                                                  color: customCol
                                                } : undefined}
                                              >
                                                <span 
                                                  className={`h-1.5 w-1.5 rounded-full animate-pulse ${dot}`} 
                                                  style={isHex ? {
                                                    backgroundColor: customCol,
                                                    boxShadow: `0 0 5px ${customCol}`
                                                  } : undefined}
                                                />
                                                <span>{foundCustom.label}</span>
                                              </span>
                                            );
                                          }

                                          const statusConfigs: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
                                            pending: {
                                              bg: "bg-amber-500/15",
                                              text: "text-amber-400",
                                              border: "border-amber-500/30",
                                              label: "Menunggu Proposal",
                                              dot: "bg-amber-400"
                                            },
                                            processing: {
                                              bg: "bg-blue-500/15",
                                              text: "text-blue-400",
                                              border: "border-blue-500/30",
                                              label: "Sedang Diproses",
                                              dot: "bg-blue-400"
                                            },
                                            quoted: {
                                              bg: "bg-indigo-500/15",
                                              text: "text-indigo-400",
                                              border: "border-indigo-500/30",
                                              label: "Sudah Di-Quoted",
                                              dot: "bg-indigo-400"
                                            },
                                            completed: {
                                              bg: "bg-emerald-500/15",
                                              text: "text-emerald-400",
                                              border: "border-emerald-500/30",
                                              label: "Selesai",
                                              dot: "bg-emerald-400"
                                            },
                                            cancelled: {
                                              bg: "bg-rose-500/15",
                                              text: "text-rose-400",
                                              border: "border-rose-500/30",
                                              label: "Dibatalkan",
                                              dot: "bg-rose-400"
                                            }
                                          };
                                          const cfg = statusConfigs[status] || statusConfigs.pending;
                                          return (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${status === "pending" || status === "processing" ? "animate-pulse" : ""}`} />
                                              <span>{cfg.label}</span>
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td className="p-4">
                                        <div className="flex flex-col gap-1 min-w-[140px] max-w-[220px]">
                                          {rfq.internalComments && rfq.internalComments.length > 0 ? (
                                            (() => {
                                              const totalComments = rfq.internalComments.length;
                                              const readCount = readCommentsMap[rfq.id] || 0;
                                              const unreadCount = Math.max(0, totalComments - readCount);

                                              return (
                                                <>
                                                  <button
                                                    onClick={() => setSelectedCommentRfq(rfq)}
                                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 self-start transition-colors relative"
                                                  >
                                                    <div className="relative">
                                                      <Icons.MessageSquare className="h-3 w-3 shrink-0" />
                                                      {unreadCount > 0 && (
                                                        <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                        </span>
                                                      )}
                                                    </div>
                                                    <span>{totalComments} Komentar</span>
                                                    {unreadCount > 0 && (
                                                      <span className="px-1.5 py-0.5 text-[8px] leading-none font-extrabold bg-rose-500 text-white rounded-full">
                                                        {unreadCount} Baru
                                                      </span>
                                                    )}
                                                  </button>
                                                  <div className="text-[10px] text-slate-300 bg-white/5 p-1.5 rounded border border-white/5 leading-normal">
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                      <span className="font-bold text-indigo-300">@{rfq.internalComments[totalComments - 1].author.split(" ")[0]}</span>
                                                      <span className="text-[8px] text-slate-500">
                                                        ({new Date(rfq.internalComments[totalComments - 1].timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
                                                      </span>
                                                    </div>
                                                    <p className="line-clamp-2 text-slate-400 italic">
                                                      "{rfq.internalComments[totalComments - 1].text}"
                                                    </p>
                                                  </div>
                                                </>
                                              );
                                            })()
                                          ) : (
                                            <button
                                              onClick={() => setSelectedCommentRfq(rfq)}
                                              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold flex items-center gap-1 py-1 transition-colors"
                                            >
                                              <Icons.MessageSquare className="h-3 w-3 shrink-0 text-slate-600" />
                                              <span>Tulis Komentar...</span>
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-4 text-center">
                                        {isQuoted ? (
                                          <div className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            <Icons.CheckCircle className="h-3.5 w-3.5" />
                                            <span className="font-bold text-[10px] uppercase">Terpenuhi</span>
                                          </div>
                                        ) : isOverdue ? (
                                          <div className="inline-flex flex-col items-center p-1.5 rounded bg-red-500/15 border border-red-500/30 text-red-400">
                                            <span className="font-extrabold text-[10px] uppercase tracking-wide">⚠️ SLA Lewat</span>
                                            <span className="text-[9px] font-mono font-bold mt-0.5 text-red-300">
                                              -{Math.abs(Math.round(remainingHours))} jam
                                            </span>
                                          </div>
                                        ) : isWarning ? (
                                          <div className="inline-flex flex-col items-center p-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                                            <span className="font-bold text-[10px] uppercase">⏳ Segera</span>
                                            <span className="text-[9px] font-mono font-bold mt-0.5 text-amber-300">
                                              Sisa {Math.round(remainingHours)}j
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="inline-flex flex-col items-center p-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                            <span className="font-bold text-[10px] uppercase">Aman</span>
                                            <span className="text-[9px] font-mono font-bold mt-0.5 text-indigo-300">
                                              Sisa {Math.round(remainingHours)}j
                                            </span>
                                          </div>
                                        )}
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
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={9} className="p-12 text-center text-slate-500">
                                    <Search className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                    <h5 className="font-bold text-slate-400">Tidak ada RFQ yang cocok</h5>
                                    <p className="text-xs text-slate-600">Cobalah kata kunci pencarian atau nomor RFQ lainnya.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </motion.div>
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
                        <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Motto Perusahaan (Kop Surat)</label>
                        <input 
                          type="text" 
                          value={settings.motto || ""}
                          onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                          placeholder="Contoh: Inovasi, Integritas & Pelayanan Terbaik"
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
                              serialNumber: "",
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

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Serial Number (Opsional)</label>
                              <input
                                type="text"
                                placeholder="Contoh: SN-ASUS-98231"
                                value={catalogForm.serialNumber || ""}
                                onChange={(e) => setCatalogForm({ ...catalogForm, serialNumber: e.target.value })}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs focus:outline-none text-slate-100 placeholder-slate-600 focus:border-indigo-500 font-mono"
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
                                          {item.serialNumber && (
                                            <div className="inline-flex items-center space-x-1 text-[9px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/10 mt-1">
                                              <Icons.QrCode className="h-2.5 w-2.5" />
                                              <span>SN: {item.serialNumber}</span>
                                            </div>
                                          )}
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
                                              serialNumber: item.serialNumber || "",
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
                {/* ADMIN T7: ONLINE STORE ORDERS      */}
                {/* ================================== */}
                {activeAdminSubTab === "orders" && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* KPI Analytics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Card 1: Total Revenue (Paid) */}
                      <div className="p-5 bg-gradient-to-br from-emerald-950/30 to-slate-900/40 border border-emerald-500/20 rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                          <Icons.DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Total Omset Toko (Lunas)</p>
                          <h4 className="text-xl font-extrabold text-white mt-1">
                            Rp {orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0).toLocaleString("id-ID")}
                          </h4>
                        </div>
                      </div>

                      {/* Card 2: Pending Processing */}
                      <div className="p-5 bg-slate-900/40 border border-white/10 rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                          <Icons.Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Order Pending/Proses</p>
                          <h4 className="text-xl font-extrabold text-white mt-1">
                            {orders.filter(o => o.status === 'pending' || o.status === 'processing').length} <span className="text-xs text-slate-500 font-normal">Pesanan</span>
                          </h4>
                        </div>
                      </div>

                      {/* Card 3: Unpaid Invoice Count */}
                      <div className="p-5 bg-slate-900/40 border border-white/10 rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                          <Icons.AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Invoices Belum Bayar</p>
                          <h4 className="text-xl font-extrabold text-white mt-1">
                            {orders.filter(o => o.paymentStatus === 'unpaid').length} <span className="text-xs text-slate-500 font-normal">Belum Bayar</span>
                          </h4>
                        </div>
                      </div>

                      {/* Card 4: Total Successful Orders */}
                      <div className="p-5 bg-slate-900/40 border border-white/10 rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                          <Icons.CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Total Sukses Selesai</p>
                          <h4 className="text-xl font-extrabold text-white mt-1">
                            {orders.filter(o => o.status === 'delivered').length} <span className="text-xs text-slate-500 font-normal">Selesai</span>
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 w-full">
                        <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Cari pesanan berdasarkan nama pembeli, email, atau nomor invoice..."
                          value={adminOrderSearch}
                          onChange={(e) => setAdminOrderSearch(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Status:</span>
                          <select
                            value={adminOrderStatusFilter}
                            onChange={(e) => setAdminOrderStatusFilter(e.target.value)}
                            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer text-slate-300"
                          >
                            <option value="all">Semua Pengiriman</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Diproses</option>
                            <option value="shipped">Dikirim</option>
                            <option value="delivered">Diterima</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                        </div>

                        {/* Payment Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Bayar:</span>
                          <select
                            value={adminOrderPaymentFilter}
                            onChange={(e) => setAdminOrderPaymentFilter(e.target.value)}
                            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer text-slate-300"
                          >
                            <option value="all">Semua Status</option>
                            <option value="paid">Lunas</option>
                            <option value="unpaid">Belum Bayar</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Orders Table List */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
                      {(() => {
                        const filtered = orders.filter(o => {
                          const matchesSearch = o.clientName.toLowerCase().includes(adminOrderSearch.toLowerCase()) ||
                            o.email.toLowerCase().includes(adminOrderSearch.toLowerCase()) ||
                            o.orderNumber.toLowerCase().includes(adminOrderSearch.toLowerCase());
                          const matchesStatus = adminOrderStatusFilter === "all" || o.status === adminOrderStatusFilter;
                          const matchesPayment = adminOrderPaymentFilter === "all" || o.paymentStatus === adminOrderPaymentFilter;
                          return matchesSearch && matchesStatus && matchesPayment;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-16 space-y-3">
                              <Icons.Inbox className="mx-auto h-12 w-12 text-slate-600 animate-pulse" />
                              <h4 className="text-sm font-bold text-slate-400">Tidak Ada Pesanan Ditemukan</h4>
                              <p className="text-xs text-slate-500">Sesuaikan kriteria filter atau hubungi helpdesk jika terjadi kesalahan.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <th className="py-4 px-5">Nomor Order / Tanggal</th>
                                  <th className="py-4 px-5">Data Pelanggan</th>
                                  <th className="py-4 px-5">Rincian Item</th>
                                  <th className="py-4 px-5">Total Pembayaran</th>
                                  <th className="py-4 px-5">Status Bayar & Kirim</th>
                                  <th className="py-4 px-5 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {filtered.map(order => (
                                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                                    {/* Order number */}
                                    <td className="py-4 px-5 space-y-1">
                                      <span className="font-extrabold text-white text-[12px] font-mono tracking-wide">{order.orderNumber}</span>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Icons.Calendar className="h-3.5 w-3.5 text-slate-500" />
                                        <span>{order.date}</span>
                                      </div>
                                    </td>

                                    {/* Client */}
                                    <td className="py-4 px-5 space-y-1">
                                      <p className="font-bold text-white text-[12px]">{order.clientName}</p>
                                      {order.companyName && (
                                        <div className="text-[10px] text-slate-400 font-medium">Perusahaan: {order.companyName}</div>
                                      )}
                                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                        <Icons.Mail className="h-3 w-3 text-slate-500" />
                                        <span>{order.email}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                        <Icons.Phone className="h-3 w-3 text-emerald-500" />
                                        <span>{order.whatsapp}</span>
                                      </div>
                                    </td>

                                    {/* Items summary */}
                                    <td className="py-4 px-5 space-y-1.5 max-w-xs">
                                      {order.items.map((it: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-[11px] bg-slate-950/30 p-1.5 rounded-lg border border-white/5">
                                          <span className="line-clamp-1 font-medium text-slate-300">{it.name}</span>
                                          <span className="font-bold text-indigo-400 ml-2">x{it.quantity}</span>
                                        </div>
                                      ))}
                                      <div className="text-[10px] text-slate-400 italic">
                                        Metode: {getDeliveryLabel(order.deliveryMethod)} / {getPaymentLabel(order.paymentMethod)}
                                      </div>
                                    </td>

                                    {/* Total cost */}
                                    <td className="py-4 px-5">
                                      <div className="font-mono font-extrabold text-white text-sm">
                                        Rp {order.total.toLocaleString("id-ID")}
                                      </div>
                                      <div className="text-[9px] text-slate-500">
                                        Subtotal: Rp {order.subtotal.toLocaleString("id-ID")}
                                      </div>
                                    </td>

                                    {/* Status modifiers */}
                                    <td className="py-4 px-5 space-y-3">
                                      {/* Payment status badge */}
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                          order.paymentStatus === 'paid'
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                        }`}>
                                          {order.paymentStatus === 'paid' ? "Lunas" : "Belum Bayar"}
                                        </span>

                                        <button
                                          onClick={async () => {
                                            const nextStatus = order.paymentStatus === 'paid' ? 'unpaid' : 'paid';
                                            try {
                                              const res = await fetch(`/api/orders?id=${order.id}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ paymentStatus: nextStatus })
                                              });
                                              if (res.ok) {
                                                showToast(`Status pembayaran order ${order.orderNumber} diubah ke ${nextStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}`, "success");
                                                fetchOrders();
                                              } else {
                                                showToast("Gagal mengubah status pembayaran", "error");
                                              }
                                            } catch (err) {
                                              console.error("Error setting payment:", err);
                                              showToast("Kesalahan koneksi", "error");
                                            }
                                          }}
                                          className="text-[10px] text-slate-400 hover:text-indigo-400 underline cursor-pointer"
                                        >
                                          Ubah Status
                                        </button>
                                      </div>

                                      {/* Delivery status modifier dropdown */}
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={order.status}
                                          onChange={async (e) => {
                                            const nextDelivStatus = e.target.value;
                                            try {
                                              const res = await fetch(`/api/orders?id=${order.id}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ status: nextDelivStatus })
                                              });
                                              if (res.ok) {
                                                showToast(`Status pengiriman order ${order.orderNumber} diubah ke ${nextDelivStatus.toUpperCase()}`, "success");
                                                fetchOrders();
                                              } else {
                                                showToast("Gagal mengubah status pengiriman", "error");
                                              }
                                            } catch (err) {
                                              console.error("Error setting status:", err);
                                              showToast("Kesalahan koneksi", "error");
                                            }
                                          }}
                                          className="bg-slate-950 border border-white/15 text-[10px] text-slate-200 px-1.5 py-0.5 rounded cursor-pointer focus:outline-none focus:border-indigo-500"
                                        >
                                          <option value="pending">KIRIM: Pending</option>
                                          <option value="processing">KIRIM: Diproses</option>
                                          <option value="shipped">KIRIM: Dikirim</option>
                                          <option value="delivered">KIRIM: Diterima</option>
                                          <option value="cancelled">KIRIM: Dibatalkan</option>
                                        </select>
                                      </div>
                                    </td>

                                    {/* Action buttons */}
                                    <td className="py-4 px-5 text-right whitespace-nowrap space-x-1.5">
                                      <button
                                        onClick={() => downloadOrderInvoicePdf(order)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                                        title="Unduh Invoice PDF"
                                      >
                                        <Icons.Download className="h-3.5 w-3.5" />
                                        <span>Invoice</span>
                                      </button>

                                      <a
                                        href={`https://wa.me/${order.whatsapp.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                                        title="Hubungi Pelanggan via WhatsApp"
                                      >
                                        <Icons.PhoneCall className="h-3.5 w-3.5" />
                                        <span>WhatsApp</span>
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
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
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none quotation-serif-header">{settings.companyName}</h1>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-700 font-bold mt-1 quotation-serif-header">{settings.tagline}</p>
                    {settings.motto && (
                      <p className="text-[9px] italic text-slate-500 mt-1.5 quotation-serif-header">"{settings.motto}"</p>
                    )}
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
                  {showPrintQrCode && (() => {
                    const quotationNumber = selectedQuotation.quotationNumber || "N/A";
                    // Using a high-quality, reliable, free public QR code generator API (qrserver)
                    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(quotationNumber)}`;
                    return (
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-2xl flex flex-col items-center justify-center shrink-0" id="procurement_qr_verification">
                        <img 
                          src={qrCodeUrl} 
                          alt={`QR Code Quotation ${quotationNumber}`} 
                          className="w-14 h-14 object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-[7px] font-mono font-extrabold text-slate-500 mt-1 uppercase text-center tracking-tight">
                          Q: {quotationNumber}
                        </div>
                        <div className="text-[6px] font-sans font-black text-indigo-600 uppercase tracking-wider text-center">
                          VERIFIKASI DIGITAL
                        </div>
                      </div>
                    );
                  })()}

                  {printDate && (
                    <div className="relative overflow-hidden bg-slate-50 border border-slate-200 border-l-4 border-l-indigo-500/80 p-2.5 px-3 rounded-2xl flex flex-col justify-center shrink-0 text-left min-w-[125px] max-w-[150px] shadow-[0_0_15px_rgba(99,102,241,0.12),0_1px_2px_rgba(0,0,0,0.05)] hover:scale-[1.04] hover:shadow-[0_6px_20px_rgba(99,102,241,0.18),0_2px_4px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out cursor-default animate-shadowPulse" id="print_date_timestamp_container">
                      {/* Interactive scanning line and subtle glowing overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.01] to-indigo-500/[0.04] pointer-events-none" />
                      <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-scanLine pointer-events-none" />
                      
                      <div className="flex items-center justify-between relative z-10 w-full mb-0.5">
                        <span className="text-[7px] uppercase tracking-widest text-indigo-600 font-extrabold block">TANGGAL CETAK</span>
                        <div className="flex items-center space-x-1.5 print:hidden">
                          <button
                            onClick={() => setShowPrintQrCode(!showPrintQrCode)}
                            title={showPrintQrCode ? "Sembunyikan QR Code Verifikasi" : "Tampilkan QR Code Verifikasi"}
                            className="p-1 hover:bg-slate-200/80 active:scale-90 rounded-md transition-all duration-150 text-slate-500 hover:text-indigo-600 cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-300/40"
                          >
                            {showPrintQrCode ? (
                              <Icons.Eye className="h-3 w-3" />
                            ) : (
                              <Icons.EyeOff className="h-3 w-3 text-slate-400" />
                            )}
                          </button>
                          <Printer className="h-2.5 w-2.5 text-indigo-500/80 shrink-0" />
                        </div>
                        <Printer className="h-2.5 w-2.5 text-indigo-500/80 shrink-0 hidden print:block" />
                      </div>
                      <div className="text-[10.5px] font-mono font-bold text-slate-800 leading-snug mt-1 print-date-text relative z-10 flex items-center gap-1.5" id="print_date_timestamp_val">
                        <Icons.Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{printDate}</span>
                      </div>
                      <span className="text-[6px] text-slate-400 font-medium block mt-1 uppercase tracking-wider relative z-10">E-DOCUMENT SYSTEM</span>
                    </div>
                  )}
                </div>

                <div className="text-right space-y-1.5 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl min-h-[94px] flex flex-col justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider leading-none quotation-serif-header">Penawaran Harga</h3>
                  <div className="font-mono text-[10px] text-slate-600 leading-normal text-right">
                    <div>No: <span className="font-bold text-slate-900">{selectedQuotation.quotationNumber}</span></div>
                    <div>Tanggal: <span className="font-bold text-slate-900">{selectedQuotation.date}</span></div>
                    <div>Valid S.D: <span className="font-bold text-red-600">{selectedQuotation.expiryDate}</span></div>
                    <div>Batas Penawaran: <span className="font-bold text-indigo-600">
                      {(() => {
                        if (!selectedQuotation.date) return "-";
                        try {
                          const d = new Date(selectedQuotation.date);
                          if (!isNaN(d.getTime())) {
                            d.setDate(d.getDate() + 14);
                            return d.toISOString().split("T")[0];
                          }
                        } catch (e) {}
                        return "-";
                      })()}
                    </span></div>
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
                        {(() => {
                          const matchingRfq = rfqs.find(r => r.id === selectedQuotation.rfqId);
                          const matchingRfqItem = matchingRfq?.items.find(it => it.name === item.name);
                          if (matchingRfqItem?.serialNumber) {
                            return (
                              <div className="inline-flex items-center space-x-1 text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 no-print">
                                <span>SN: {matchingRfqItem.serialNumber}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
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
            {(() => {
              const isServiceOrLabor = (name: string) => {
                const normalized = name.toLowerCase();
                return (
                  normalized.includes("jasa") ||
                  normalized.includes("instalasi") ||
                  normalized.includes("pemasangan") ||
                  normalized.includes("lisensi") ||
                  normalized.includes("software") ||
                  normalized.includes("maintenance") ||
                  normalized.includes("setup") ||
                  normalized.includes("service") ||
                  normalized.includes("labor") ||
                  normalized.includes("config") ||
                  normalized.includes("konsultasi") ||
                  normalized.includes("biaya") ||
                  normalized.includes("kirim") ||
                  normalized.includes("delivery")
                );
              };

              const hardwareItemsList = selectedQuotation.items.filter(item => !isServiceOrLabor(item.name));
              const serviceItemsList = selectedQuotation.items.filter(item => isServiceOrLabor(item.name));

              const hardwareSubtotalValue = hardwareItemsList.reduce((acc, item) => acc + item.totalPrice, 0);
              const serviceSubtotalValue = serviceItemsList.reduce((acc, item) => acc + item.totalPrice, 0);

              return (
                <div className="flex flex-col items-end pt-3 text-left">
                  <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
                    {/* Subtotal Row - Interactive */}
                    <div 
                      onClick={() => setShowSubtotalBreakdown(!showSubtotalBreakdown)}
                      className="group flex flex-col border-b border-slate-100 pb-1.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg -mx-1.5 transition-all select-none"
                      title="Klik untuk melihat rincian biaya perangkat vs jasa"
                    >
                      <div className="flex justify-between items-center text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <span>Subtotal Barang:</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold flex items-center space-x-0.5 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <span>Rincian</span>
                            {showSubtotalBreakdown ? (
                              <Icons.ChevronUp className="h-2.5 w-2.5" />
                            ) : (
                              <Icons.ChevronDown className="h-2.5 w-2.5" />
                            )}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedQuotation.subtotal)}</span>
                      </div>
                    </div>

                    {/* Expandable Granular Breakdown Panel */}
                    {showSubtotalBreakdown && (
                      <div className="bg-slate-50/90 border border-slate-200/60 p-3 rounded-xl space-y-2.5 animate-fadeIn text-[11px] text-slate-600 no-print">
                        <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
                          <Icons.Layers className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Rincian Nilai Pengadaan</span>
                        </div>
                        
                        {/* Hardware Section */}
                        {hardwareItemsList.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span className="flex items-center space-x-1">
                                <Icons.Monitor className="h-3 w-3 text-indigo-500" />
                                <span>Perangkat & Infrastruktur ({hardwareItemsList.length})</span>
                              </span>
                              <span className="font-mono">{formatRupiah(hardwareSubtotalValue)}</span>
                            </div>
                            <div className="pl-4 space-y-0.5 text-[10px] text-slate-500">
                              {hardwareItemsList.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span className="truncate max-w-[160px]">{item.name} (x{item.quantity})</span>
                                  <span className="font-mono">{formatRupiah(item.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Services/Labor Section */}
                        {serviceItemsList.length > 0 && (
                          <div className="space-y-1 pt-1.5 border-t border-slate-100">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span className="flex items-center space-x-1">
                                <Icons.Wrench className="h-3 w-3 text-indigo-500" />
                                <span>Jasa, Lisensi & Layanan ({serviceItemsList.length})</span>
                              </span>
                              <span className="font-mono">{formatRupiah(serviceSubtotalValue)}</span>
                            </div>
                            <div className="pl-4 space-y-0.5 text-[10px] text-slate-500">
                              {serviceItemsList.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span className="truncate max-w-[160px]">{item.name} (x{item.quantity})</span>
                                  <span className="font-mono">{formatRupiah(item.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {hardwareItemsList.length > 0 && serviceItemsList.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Rasio Hardware : Jasa</span>
                            <span className="font-mono">
                              {Math.round((hardwareSubtotalValue / selectedQuotation.subtotal) * 100)}% : {Math.round((serviceSubtotalValue / selectedQuotation.subtotal) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

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
              );
            })()}

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
              <div className="flex items-center space-x-4">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                  Katalog Resmi - PT Berkah Bintang Solusindo
                </span>
                
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showQrInPdf}
                    onChange={(e) => setShowQrInPdf(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <span>Tampilkan QR Code</span>
                </label>
              </div>
              
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
                      {settings.motto && (
                        <p className="text-[9px] italic text-slate-500 mt-1">"{settings.motto}"</p>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium max-w-md pt-2 leading-relaxed">
                    {settings.address} <br />
                    WhatsApp: {settings.whatsapp} | Email: {settings.email} | Web: {settings.website}
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  {showQrInPdf && (
                    <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex flex-col items-center justify-center text-center w-[100px] shadow-sm shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=0f172a&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://ais-pre-berlxqagrxrt5v55xbqzsl-42487289899.asia-east1.run.app")}`}
                        alt="QR Katalog"
                        className="w-20 h-20"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[7px] font-mono text-slate-400 mt-1 uppercase font-bold tracking-wider">Pindai Akses</span>
                    </div>
                  )}
                  
                  <div className="text-right space-y-1.5 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                    <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-wider">Katalog Perangkat</h3>
                    <div className="font-mono text-[9px] text-slate-600">
                      <div>Kategori: <span className="font-bold text-slate-900">{catalogCategory}</span></div>
                      <div>Tanggal: <span className="font-bold text-slate-900">{new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                      <div>Total Item: <span className="font-bold text-slate-900">{filteredProducts.length} Perangkat</span></div>
                    </div>
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
                                    if (selectedCompareIds.length >= 4) {
                                      showToast("Maksimal 4 produk dapat dibandingkan sekaligus", "error");
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
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-200 uppercase">
                                {prod.category}
                              </span>
                              <button
                                onClick={() => setSelectedQrProduct(prod)}
                                className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded border border-indigo-100 text-[9px] font-bold transition-all cursor-pointer no-print"
                                title="Lihat QR Code Perangkat"
                              >
                                <Icons.QrCode className="h-2.5 w-2.5" />
                                <span>Lihat QR</span>
                              </button>
                            </div>
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

      {/* ==================================== */}
      {/* MODAL VIEW: PRODUCT QR CODE MODAL     */}
      {/* ==================================== */}
      {selectedQrProduct && (() => {
        const barcodeMappings: Record<string, string> = {
          "prod_1": "8895431201",
          "prod_2": "1928471048",
          "prod_3": "3049182740",
          "prod_4": "4095817263",
          "prod_5": "5120394857",
          "prod_6": "6238475910",
          "prod_7": "7349581023",
          "prod_8": "8450192837",
        };
        const qrData = barcodeMappings[selectedQrProduct.id] || selectedQrProduct.id;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&data=${encodeURIComponent(qrData)}`;

        return (
          <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="product-qr-modal">
            <div className="bg-slate-900 border border-white/10 text-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl relative font-sans text-center space-y-5 animate-scaleUp">
              
              {/* Modal Close */}
              <button 
                onClick={() => setSelectedQrProduct(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer border border-white/10"
              >
                <Icons.X className="h-4 w-4" />
              </button>

              <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-full flex items-center justify-center">
                <QrCode className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">QR Code Produk</h3>
                <p className="text-indigo-300 font-bold text-sm leading-snug">{selectedQrProduct.name}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">Pindai menggunakan modul Quick Scan atau kamera lapangan untuk identifikasi fisik produk secara instan.</p>
              </div>

              {/* QR Code Image Container */}
              <div className="bg-white p-4.5 rounded-2xl inline-block shadow-inner mx-auto border border-white/5">
                <img 
                  src={qrCodeUrl}
                  alt={`QR Code ${selectedQrProduct.name}`}
                  className="w-44 h-44 mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 text-left space-y-1 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Produk:</span>
                  <span className="text-slate-300 font-bold">{selectedQrProduct.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="text-slate-300 font-bold uppercase">{selectedQrProduct.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Scan:</span>
                  <span className="text-indigo-300 font-black">{qrData}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedQrProduct(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ==================================== */}
      {/* MODAL VIEW: CATALOG QR CODE          */}
      {/* ==================================== */}
      {showQrCodeModal && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="catalog-qr-modal">
          <div className="bg-slate-900 border border-white/10 text-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative font-sans text-center space-y-6 animate-scaleUp">
            
            {/* Modal Close */}
            <button 
              onClick={() => setShowQrCodeModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer border border-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-full flex items-center justify-center">
              <QrCode className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">QR Code Akses Katalog</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Pindai kode QR di bawah ini untuk mengakses atau membagikan e-procurement Berkah Bintang Solusindo langsung di perangkat seluler.</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-5 rounded-2xl inline-block shadow-inner mx-auto border border-white/5">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://ais-pre-berlxqagrxrt5v55xbqzsl-42487289899.asia-east1.run.app")}`}
                alt="QR Code Katalog"
                className="w-48 h-48 mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3.5 space-y-2 text-left">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Tautan Aplikasi:</span>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-indigo-300 truncate select-all flex-1">{typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://ais-pre-berlxqagrxrt5v55xbqzsl-42487289899.asia-east1.run.app"}</p>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                      showToast("Tautan berhasil disalin!", "success");
                    }
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold text-indigo-300 hover:text-indigo-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  Salin Link
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowQrCodeModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* MODAL VIEW: FIELD TECHNICIAN QR CODE CARD      */}
      {/* ============================================== */}
      {showQrCardModal && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="print-qr-card-modal">
          <div className="bg-slate-900 border border-white/10 text-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative font-sans space-y-6 animate-scaleUp no-print-inside">
            
            {/* Modal Close */}
            <button 
              onClick={() => setShowQrCardModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer border border-white/10 no-print"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title block */}
            <div className="flex items-center space-x-3 border-b border-white/10 pb-4 no-print">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl flex items-center justify-center">
                <Icons.Contact className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Kartu QR Akses Lapangan</h3>
                <p className="text-slate-400 text-xs">Desain & ekspor kartu barcode fisik untuk teknisi lapangan atau dipasang di rack server.</p>
              </div>
            </div>

            {/* Customization controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5 no-print">
              <div className="space-y-2 text-left">
                <span className="block text-xs font-bold text-slate-300">Pilih Warna Kartu:</span>
                <div className="flex flex-wrap gap-2">
                  {(["emerald", "indigo", "slate", "amber"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setQrCardTheme(t)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer border ${
                        qrCardTheme === t 
                          ? "bg-indigo-600 border-indigo-500 text-white" 
                          : "bg-slate-800 border-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-left">
                <span className="block text-xs font-bold text-slate-300">Ukuran Kartu:</span>
                <div className="flex flex-wrap gap-2">
                  {(["standard", "badge", "large"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setQrCardSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer border ${
                        qrCardSize === sz 
                          ? "bg-indigo-600 border-indigo-500 text-white" 
                          : "bg-slate-800 border-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Card Preview Area */}
            <div className="flex justify-center py-4 bg-slate-950/20 rounded-2xl border border-dashed border-white/10 overflow-hidden">
              <div 
                id="qr-field-card-preview"
                className={`bg-white rounded-3xl border-2 p-6 sm:p-8 flex flex-col items-center justify-between text-center relative shadow-2xl transition-all duration-300 ${
                  qrCardTheme === "emerald" ? "border-emerald-500 text-slate-900" :
                  qrCardTheme === "indigo" ? "border-indigo-500 text-slate-900" :
                  qrCardTheme === "slate" ? "border-slate-800 text-slate-900" :
                  "border-amber-500 text-slate-900"
                } ${
                  qrCardSize === "badge" ? "w-72 max-w-xs min-h-[400px] text-xs" :
                  qrCardSize === "large" ? "w-[440px] max-w-md min-h-[560px] text-base" :
                  "w-[380px] max-w-sm min-h-[500px] text-sm"
                }`}
              >
                {/* Stamp overlay */}
                <div className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 font-mono text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 transform -rotate-12 select-none pointer-events-none ${
                  qrCardTheme === "emerald" ? "border-emerald-500/10 text-emerald-500/10" :
                  qrCardTheme === "indigo" ? "border-indigo-500/10 text-indigo-500/10" :
                  qrCardTheme === "slate" ? "border-slate-800/10 text-slate-800/10" :
                  "border-amber-500/10 text-amber-500/10"
                }`}>
                  BBS OFFICIAL PASS
                </div>

                {/* Header (BBS Logo & Title) */}
                <div className="space-y-1 w-full pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-sm shadow shrink-0 ${
                      qrCardTheme === "emerald" ? "bg-emerald-600" :
                      qrCardTheme === "indigo" ? "bg-indigo-600" :
                      qrCardTheme === "slate" ? "bg-slate-800" :
                      "bg-amber-600"
                    }`}>
                      BBS
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black tracking-tight text-slate-950 uppercase line-clamp-1">{settings.companyName}</h4>
                      <p className={`text-[8px] font-bold tracking-widest uppercase line-clamp-1 ${
                        qrCardTheme === "emerald" ? "text-emerald-600" :
                        qrCardTheme === "indigo" ? "text-indigo-600" :
                        qrCardTheme === "slate" ? "text-slate-600" :
                        "text-amber-600"
                      }`}>{settings.tagline}</p>
                    </div>
                  </div>
                  <div className={`text-[9px] font-black tracking-wider uppercase inline-block px-2.5 py-0.5 rounded-full mt-2 ${
                    qrCardTheme === "emerald" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    qrCardTheme === "indigo" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                    qrCardTheme === "slate" ? "bg-slate-100 text-slate-700 border border-slate-300" :
                    "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    FIELD ACCESS CARD
                  </div>
                </div>

                {/* Body (QR Code Image) */}
                <div className="my-6 space-y-3 flex flex-col items-center justify-center">
                  <div className={`p-4 bg-white rounded-2xl inline-block border-2 ${
                    qrCardTheme === "emerald" ? "border-emerald-100 shadow-emerald-100/30 shadow-lg" :
                    qrCardTheme === "indigo" ? "border-indigo-100 shadow-indigo-100/30 shadow-lg" :
                    qrCardTheme === "slate" ? "border-slate-200 shadow-slate-200/30 shadow-lg" :
                    "border-amber-100 shadow-amber-100/30 shadow-lg"
                  }`}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0f172a&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://ais-pre-berlxqagrxrt5v55xbqzsl-42487289899.asia-east1.run.app")}`}
                      alt="QR Code Lapangan"
                      className="w-36 h-36 mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">SCAN TO ENTER PORTAL</span>
                </div>

                {/* Footer instructions */}
                <div className="space-y-2 w-full pt-4 border-t border-slate-100 text-left">
                  <p className="text-[10px] text-slate-500 leading-normal text-center font-medium">
                    Pindai kartu QR ini menggunakan smartphone untuk membuka katalog lengkap e-procurement, spesifikasi, dan membuat penawaran RFQ instan di lapangan.
                  </p>
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-50">
                    <span>ID: BBS-FLD-{new Date().getFullYear()}-{catalogCategory.substring(0,3).toUpperCase()}</span>
                    <span>Status: AKTIF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between gap-3 pt-2 no-print">
              <button
                onClick={() => setShowQrCardModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs font-bold transition-all text-slate-300 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
              
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg active:scale-95"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Kartu Lapangan</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* MODAL VIEW: CATALOG PDF PREVIEW      */}
      {/* ==================================== */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex flex-col h-screen no-print" id="catalog-pdf-preview-modal">
          
          {/* PDF Viewer Header Toolbar */}
          <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shrink-0 shadow-lg">
            
            {/* File Info */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400">
                <Icons.FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-none">BBS_Procurement_Catalog_2026.pdf</h4>
                <span className="text-[10px] text-slate-400">Pratinjau Dokumen Digital - PT Berkah Bintang Solusindo</span>
              </div>
            </div>

            {/* Toolbar Controls */}
            <div className="flex items-center space-x-4">
              
              {/* Page Navigator */}
              <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-xl p-1 text-xs">
                <button
                  disabled={pdfPreviewPage <= 1}
                  onClick={() => setPdfPreviewPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <Icons.ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 font-medium min-w-[70px] text-center">
                  Hal {pdfPreviewPage} dari 4
                </span>
                <button
                  disabled={pdfPreviewPage >= 4}
                  onClick={() => setPdfPreviewPage(prev => Math.min(4, prev + 1))}
                  className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <Icons.ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-xl p-1 text-xs hidden md:flex">
                <button
                  disabled={pdfPreviewZoom <= 70}
                  onClick={() => setPdfPreviewZoom(prev => Math.max(70, prev - 15))}
                  className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-[15px] font-bold px-2"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="px-2 font-mono font-medium text-center min-w-[50px]">
                  {pdfPreviewZoom}%
                </span>
                <button
                  disabled={pdfPreviewZoom >= 130}
                  onClick={() => setPdfPreviewZoom(prev => Math.min(130, prev + 15))}
                  className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-[14px] font-bold px-2"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedCatalogPdf(true);
                  setShowPdfPreviewModal(false);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-[11px] font-extrabold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Icons.Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unduh PDF</span>
              </button>
              <button
                onClick={() => setShowPdfPreviewModal(false)}
                className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer border border-white/10"
                title="Tutup Pratinjau"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Interactive Page Canvas with scroll area */}
          <div className="flex-1 overflow-auto bg-slate-950 p-6 flex justify-center items-start">
            
            {/* Dynamic Sized Page Container simulating print layout */}
            <div 
              className="bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 relative border border-slate-200 transition-all duration-300 origin-top flex flex-col justify-between"
              style={{ 
                width: "100%",
                maxWidth: `${680 * (pdfPreviewZoom / 100)}px`,
                minHeight: `${880 * (pdfPreviewZoom / 100)}px`
              }}
            >
              
              {/* PAGE 1: COVER PAGE */}
              {pdfPreviewPage === 1 && (
                <div className="flex-1 flex flex-col justify-between h-full space-y-12 animate-fadeIn py-6">
                  {/* Decorative Header Border */}
                  <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 rounded-full" />
                  
                  <div className="space-y-6 text-center">
                    <span className="px-3.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] uppercase font-black tracking-widest rounded-full">
                      E-Catalog Resmi Procurement IT
                    </span>
                    
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      PT BERKAH BINTANG SOLUSINDO
                    </h1>
                    
                    <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                      Sistem integrasi penyediaan perangkat keras, server, jaringan, komputer, dan komparasi spesifikasi detail e-procurement enterprise.
                    </p>
                  </div>

                  {/* Certified Security Shield Illustration */}
                  <div className="my-8 flex justify-center">
                    <div className="relative p-6 bg-slate-50 border border-slate-200/80 rounded-2xl max-w-sm w-full text-center space-y-3">
                      <div className="mx-auto w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                        <Icons.Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase">BBS Verified Security Document</h4>
                        <p className="text-[10px] text-slate-400">Terdaftar di server e-procurement dengan nomor enkripsi digital terotentikasi.</p>
                      </div>
                      <div className="text-[10px] text-indigo-600 font-mono bg-indigo-50/50 py-1.5 rounded-lg border border-indigo-100/60">
                        HASH-ID: 7FF89C-BBS-2026
                      </div>
                    </div>
                  </div>

                  {/* Cover metadata details */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-8 text-left text-[11px] text-slate-500">
                    <div>
                      <p className="font-bold text-slate-800">Diterbitkan Oleh:</p>
                      <p className="font-semibold text-indigo-600">PT Berkah Bintang Solusindo</p>
                      <p>Dept. Procurement & Estimasi Jaringan</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Detail Validitas:</p>
                      <p>Rilis: Juni 2026</p>
                      <p>Status: <span className="text-emerald-600 font-bold">Resmi & Tersertifikasi</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 2: INVENTORY OVERVIEW */}
              {pdfPreviewPage === 2 && (
                <div className="flex-1 flex flex-col justify-between h-full space-y-6 animate-fadeIn">
                  
                  {/* Top Brand Tag */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Katalog Perangkat IT & Jaringan</span>
                    <span className="text-[10px] font-mono text-slate-400">BBS-CAT-P2</span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-600 pl-2">
                      Daftar Kategori Utama Perangkat
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Berikut adalah klasifikasi perangkat keras standar industri yang disediakan oleh PT Berkah Bintang Solusindo untuk kebutuhan pengadaan infrastruktur server, jaringan komputer, workstation, dan perangkat terminal klien.
                    </p>

                    {/* Table of categories */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-2.5">Kategori</th>
                            <th className="p-2.5">Deskripsi Singkat</th>
                            <th className="p-2.5 text-right">Rentang Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {Array.from(new Set(catalogProducts.map(p => p.category))).map((cat, idx) => {
                            const sample = catalogProducts.find(p => p.category === cat);
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-bold text-slate-800">{cat}</td>
                                <td className="p-2.5 truncate max-w-[180px]">{sample?.description || "Infrastruktur penunjang handal"}</td>
                                <td className="p-2.5 text-right font-mono text-indigo-600">{sample?.estimatedPriceRange || "Kontak Admin"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-100/60 rounded-xl mt-4">
                      <h5 className="text-[10px] uppercase font-bold text-indigo-800 flex items-center gap-1.5">
                        <Icons.Award className="h-3.5 w-3.5" />
                        Garansi Layanan & Spareparts
                      </h5>
                      <p className="text-[10px] text-indigo-950 mt-1 leading-relaxed">
                        Setiap unit perangkat yang tercantum dalam katalog ini dilengkapi dengan garansi resmi distributor minimal selama 12 bulan, yang didukung sepenuhnya oleh tim Technical Support PT Berkah Bintang Solusindo secara on-site maupun remote.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[9px] text-slate-400">
                    <span>© {new Date().getFullYear()} PT Berkah Bintang Solusindo</span>
                    <span>Halaman 2 dari 4</span>
                  </div>
                </div>
              )}

              {/* PAGE 3: FEATURED SPECIFICATIONS */}
              {pdfPreviewPage === 3 && (
                <div className="flex-1 flex flex-col justify-between h-full space-y-6 animate-fadeIn">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Komparasi Spesifikasi Detail</span>
                    <span className="text-[10px] font-mono text-slate-400">BBS-CAT-P3</span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-600 pl-2">
                      Spesifikasi Unggulan Perangkat IT
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sistem pengadaan kami didukung oleh berbagai vendor terkemuka dunia dengan standar performa, reliabilitas tinggi, dan sertifikasi TKDN. Berikut rincian contoh spesifikasi teknis unit terlaris:
                    </p>

                    {/* Specifications grid cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {catalogProducts.slice(0, 4).map((prod, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2 text-left bg-slate-50/50">
                          <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[9px] font-bold text-indigo-600 uppercase">
                            {prod.category}
                          </span>
                          <h4 className="text-[11px] font-bold text-slate-900 line-clamp-1">{prod.name}</h4>
                          <ul className="text-[9px] text-slate-500 space-y-1 list-disc pl-3">
                            {prod.specifications.slice(0, 3).map((spec, sIdx) => (
                              <li key={sIdx} className="truncate">{spec}</li>
                            ))}
                          </ul>
                          <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400">Ref Price:</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600">{prod.estimatedPriceRange}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[9px] text-slate-400">
                    <span>Katalog e-Procurement Berkah Bintang Solusindo</span>
                    <span>Halaman 3 dari 4</span>
                  </div>
                </div>
              )}

              {/* PAGE 4: PROCUREMENT GUIDELINES & CORPORATE SEAL */}
              {pdfPreviewPage === 4 && (
                <div className="flex-1 flex flex-col justify-between h-full space-y-6 animate-fadeIn">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Panduan & Legalisasi Procurement</span>
                    <span className="text-[10px] font-mono text-slate-400">BBS-CAT-P4</span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-600 pl-2">
                      Alur Pengajuan Penawaran (RFQ)
                    </h3>
                    
                    {/* Alur order steps list */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2.5 text-xs">
                        <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-[11px]">Pengisian Keranjang RFQ</h5>
                          <p className="text-[10px] text-slate-500">Pilih perangkat dari katalog online BBS dan sesuaikan jumlah yang dibutuhkan.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2.5 text-xs">
                        <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-[11px]">Kirim Pengajuan RFQ</h5>
                          <p className="text-[10px] text-slate-500">Lengkapi data profil perusahaan atau institusi Anda lalu kirimkan lewat platform e-procurement.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5 text-xs">
                        <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-[11px]">Penerbitan Penawaran Resmi</h5>
                          <p className="text-[10px] text-slate-500">Tim Sales Estimator BBS akan merilis Surat Penawaran Harga (Quotation) berstempel resmi.</p>
                        </div>
                      </div>
                    </div>

                    {/* Signatures & Seal layout */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 items-end">
                      <div className="text-[9px] text-slate-400 space-y-1">
                        <p className="font-bold text-slate-700">Verifikasi Dokumen:</p>
                        <p>ID Katalog: BBS-CAT-E-PROC</p>
                        <p>Status: <span className="text-emerald-600 font-bold">AKTIF & SAH</span></p>
                        <p>Sistem: PT Berkah Bintang Solusindo</p>
                      </div>

                      <div className="text-center space-y-1 relative w-full max-w-[180px] ml-auto">
                        {/* Mock BBS official stamp */}
                        <div className="absolute -top-1 left-2 border-2 border-indigo-500/20 text-indigo-500/20 font-mono text-[8px] font-extrabold uppercase tracking-widest rounded-lg px-2 py-1 transform -rotate-12 select-none pointer-events-none">
                          BBS VERIFIED
                        </div>
                        
                        <p className="text-slate-500 text-[9px] pb-8">Hormat Kami,<br /><strong>PT Berkah Bintang Solusindo</strong></p>
                        <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 text-[10px]">Departemen Procurement</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[9px] text-slate-400">
                    <span>Dokumen Digital Resmi PT Berkah Bintang Solusindo</span>
                    <span>Halaman 4 dari 4</span>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Bottom page bar controls */}
          <div className="bg-slate-900 border-t border-white/10 px-4 py-3 text-center text-xs text-slate-400 shrink-0">
            Gunakan tombol navigasi di bagian atas untuk membalik halaman katalog. Klik <strong className="text-white">Unduh PDF</strong> untuk menyimpan dokumen lengkap.
          </div>

        </div>
      )}

      {/* Floating Compare indicator bar (only visible when items are selected in catalog view) */}
      {selectedCompareIds.length > 0 && (
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
      {showComparisonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="product_comparison_modal">
          <div className={`bg-slate-900 border border-white/10 text-white rounded-3xl w-full ${selectedCompareIds.length >= 4 ? "max-w-7xl" : "max-w-5xl"} p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans flex flex-col justify-between`}>
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 animate-headerFadeScale">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Icons.GitCompare className="h-5 w-5 text-indigo-400 animate-pulse" />
                    Perbandingan Teknis Perangkat
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Analisis dan komparasi spesifikasi detail serta rentang harga acuan secara berdampingan.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={addAllComparedToCart}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 border border-emerald-500/20 active:scale-95"
                  >
                    <Icons.ShoppingCart className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span>Masukkan Semua ke Keranjang ({selectedCompareIds.length})</span>
                  </button>
                  <button 
                    onClick={() => setShowComparisonModal(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer border border-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
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
                <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                  {/* Show Only Differences Toggle */}
                  <button
                    onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
                      showOnlyDifferences
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-md shadow-amber-500/5"
                        : "bg-slate-950 border-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                    title="Saring tabel untuk hanya memperlihatkan parameter spesifikasi yang memiliki perbedaan di antara produk terpilih"
                  >
                    <Icons.AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Hanya Perbedaan</span>
                  </button>

                  <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1 shrink-0">
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
              </div>

              {/* Grid content */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${selectedCompareIds.length >= 4 ? "lg:grid-cols-4 md:grid-cols-2" : "md:grid-cols-3"} gap-6`}>
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

                {/* Placeholder empty states if < 4 products selected */}
                {Array.from({ length: Math.max(0, 4 - selectedCompareIds.length) }).map((_, idx) => (
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

                const getProductAttributes = (p: ProductItem) => {
                  const id = p.id;
                  if (id === "prod_1") {
                    return {
                      processor: "Intel Core i5 / i7 Generasi Terbaru",
                      memory: "RAM 8GB / 16GB DDR5 High Speed",
                      storage: "Storage 512GB / 1TB SSD NVMe PCIe",
                      display: "Layar 14\" IPS WUXGA Anti-Glare",
                      system: "Windows 11 Pro Original",
                      dimension: "Compact Business (14 inch)",
                      weight: "Ringan (~1.4 kg)",
                      warranty: "Garansi Resmi Lenovo Indonesia 2 Tahun"
                    };
                  }
                  if (id === "prod_2") {
                    return {
                      processor: "Intel Core i3 / i5 Processor",
                      memory: "RAM 8GB DDR4 (Expandable to 128GB)",
                      storage: "Storage 512GB SSD NVMe",
                      display: "Monitor ASUS 21.5\" FHD",
                      system: "Sudah termasuk Keyboard & Mouse USB ASUS",
                      dimension: "Mini Tower Desktop",
                      weight: "Desktop Standard (~5.5 kg)",
                      warranty: "Garansi Resmi ASUS Indonesia 2 Tahun"
                    };
                  }
                  if (id === "prod_3") {
                    return {
                      processor: "Intel Xeon E-2314 2.8GHz",
                      memory: "RAM 16GB UDIMM ECC Server Memory",
                      storage: "Storage 2x 2TB SATA 7.2K Enterprise HDD (RAID 1)",
                      display: "Dual Gigabit Ethernet Ports",
                      system: "Dell iDRAC9 Basic Remote Management",
                      dimension: "1U Rackmount Server",
                      weight: "Server Rack (~11 kg)",
                      warranty: "Garansi ProSupport 24/7 Dell 3 Tahun"
                    };
                  }
                  if (id === "prod_4") {
                    return {
                      processor: "AMD Ryzen R1600 Dual-Core 2.6GHz",
                      memory: "RAM 4GB DDR4 ECC (Upgradable to 32GB)",
                      storage: "4-Bay Drive (Mendukung HDD/SSD 3.5\" & 2.5\")",
                      display: "Built-in 2x M.2 NVMe Slot untuk SSD Cache",
                      system: "Synology DiskStation Manager (DSM) OS",
                      dimension: "Compact Desktop NAS",
                      weight: "Sasis NAS (~2.2 kg)",
                      warranty: "Garansi Resmi Synology 3 Tahun"
                    };
                  }
                  if (id === "prod_5") {
                    return {
                      processor: "Marvell Armada Quad-core 1.4GHz CPU",
                      memory: "1GB RAM DDR4 & 512MB NAND Storage",
                      storage: "7x Gigabit Ethernet Ports & 1x 2.5G Port",
                      display: "1x 10G SFP+ Cage untuk koneksi FO",
                      system: "MikroTik RouterOS v7 License Level 5",
                      dimension: "Compact Metal Enclosure",
                      weight: "Ringan Jaringan (~0.8 kg)",
                      warranty: "Garansi Resmi Mikrotik 1 Tahun"
                    };
                  }
                  if (id === "prod_6") {
                    return {
                      processor: "Wi-Fi 6 (802.11ax) Dual-Band High Speed",
                      memory: "Kecepatan s.d 1.5 Gbps (5GHz & 2.4GHz)",
                      storage: "Cakupan Sinyal s.d 115 m² (1,250 ft²)",
                      display: "Mendukung 300+ Koneksi Client Bersamaan",
                      system: "Powered by PoE (Power over Ethernet)",
                      dimension: "Ceiling-Mount Dome AP",
                      weight: "Ringan AP (~0.3 kg)",
                      warranty: "Garansi Resmi Ubiquiti 1 Tahun"
                    };
                  }
                  if (id === "prod_7") {
                    return {
                      processor: "Resolusi Full HD 1080p (2 Megapixel)",
                      memory: "Lensa Wide Angle 2.8mm (Sudut pandang luas)",
                      storage: "Night Vision Smart IR s.d Jarak 30 Meter",
                      display: "Sertifikasi Tahan Air IP67 & Vandal-proof IK10",
                      system: "Teknologi Kompresi Hemat Bandwidth H.265+",
                      dimension: "Vandal-proof Dome",
                      weight: "Kamera Solid (~0.5 kg)",
                      warranty: "Garansi Resmi Hikvision 2 Tahun"
                    };
                  }
                  if (id === "prod_8") {
                    return {
                      processor: "Aplikasi Premium: Word, Excel, PowerPoint, Outlook",
                      memory: "Email Bisnis Exchange dengan Storage 50GB per user",
                      storage: "Penyimpanan Cloud OneDrive for Business 1TB",
                      display: "Microsoft Teams untuk meeting online up to 300 orang",
                      system: "Bisa diinstal di 5 perangkat (PC/Mac/HP) per user",
                      dimension: "Lisensi Cloud Digital",
                      weight: "Tidak Ada (Cloud)",
                      warranty: "Dukungan Teknis SLA Microsoft Resmi"
                    };
                  }

                  // Fallback for custom products
                  return {
                    processor: p.specifications[0] || "-",
                    memory: p.specifications[1] || "-",
                    storage: p.specifications[2] || "-",
                    display: p.specifications[3] || "-",
                    system: p.specifications[4] || "-",
                    dimension: p.specifications[5] || "Standar",
                    weight: p.specifications[6] || "Menyesuaikan",
                    warranty: p.specifications[7] || "Hubungi Sales"
                  };
                };

                const allRows = [
                  {
                    key: "category",
                    label: "Kategori Perangkat",
                    getValue: (p: ProductItem) => p.category,
                  },
                  {
                    key: "estimatedPriceRange",
                    label: "Estimasi Rentang Harga",
                    getValue: (p: ProductItem) => p.estimatedPriceRange,
                  },
                  {
                    key: "processor",
                    label: "Prosesor / Inti Fitur",
                    getValue: (p: ProductItem) => getProductAttributes(p).processor,
                  },
                  {
                    key: "memory",
                    label: "RAM / Memori Kecepatan",
                    getValue: (p: ProductItem) => getProductAttributes(p).memory,
                  },
                  {
                    key: "storage",
                    label: "Penyimpanan / Kapasitas Utama",
                    getValue: (p: ProductItem) => getProductAttributes(p).storage,
                  },
                  {
                    key: "display",
                    label: "Tampilan / Koneksi Tambahan",
                    getValue: (p: ProductItem) => getProductAttributes(p).display,
                  },
                  {
                    key: "system",
                    label: "Sistem Operasi / Standar Daya",
                    getValue: (p: ProductItem) => getProductAttributes(p).system,
                  },
                  {
                    key: "dimension",
                    label: "Dimensi Fisik",
                    getValue: (p: ProductItem) => getProductAttributes(p).dimension,
                  },
                  {
                    key: "weight",
                    label: "Berat Perangkat",
                    getValue: (p: ProductItem) => getProductAttributes(p).weight,
                  },
                  {
                    key: "warranty",
                    label: "Jaminan & Garansi",
                    getValue: (p: ProductItem) => getProductAttributes(p).warranty,
                  },
                ];

                // Filter rows if "showOnlyDifferences" is enabled
                const comparisonRows = allRows.filter(row => {
                  if (!showOnlyDifferences) return true;
                  // If only 1 product is selected, we show all rows since you can't have differences
                  if (selectedProducts.length <= 1) return true;
                  const values = selectedProducts.map(p => row.getValue(p).trim().toLowerCase());
                  return new Set(values).size > 1;
                });

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
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-white/5 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/10">
                            <th className="p-3.5 w-1/5">Parameter</th>
                            {selectedProducts.map(prod => (
                              <th key={prod.id} className="p-3.5 w-1/5 text-indigo-300 font-bold">
                                {prod.name}
                              </th>
                            ))}
                            {Array.from({ length: Math.max(0, 4 - selectedProducts.length) }).map((_, idx) => (
                              <th key={idx} className="p-3.5 w-1/5 text-slate-600 italic">
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
                                key={row.key} 
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
                                  // For tooltips, try to match the explanation of specifications
                                  const explanation = val !== "-" ? getSpecExplanation(val) : null;

                                  return (
                                    <td 
                                      key={p.id} 
                                      className={`p-3.5 relative group transition-colors duration-200 ${
                                        isDifferent 
                                          ? "text-amber-200 font-medium animate-pulse" 
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
                                {Array.from({ length: Math.max(0, 4 - selectedProducts.length) }).map((_, idx) => (
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

              {/* QR Code Sharing Card for Comparison */}
              {selectedCompareIds.length > 0 && (
                <div className="mt-8 bg-slate-950/60 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 animate-fadeIn">
                  <div className="bg-white p-3 rounded-2xl border-2 border-indigo-500/20 shadow-[0_4px_20px_rgba(99,102,241,0.15)] shrink-0">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=4f46e5&data=${encodeURIComponent(
                        window.location.origin + window.location.pathname + "?compare=" + selectedCompareIds.join(",")
                      )}`} 
                      alt="Comparison QR Code" 
                      className="w-32 h-32 md:w-36 md:h-36"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">
                        Bagikan Laporan Perbandingan
                      </span>
                      <h4 className="text-sm font-bold text-white">Buka di Smartphone atau Kirim ke Rekan Kerja</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                        Pindai kode QR di atas untuk membuka tabel perbandingan teknis lengkap ini langsung di perangkat mobile Anda, atau bagikan tautan ini ke tim procurement Anda.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                      <button
                        onClick={async () => {
                          const shareUrl = window.location.origin + window.location.pathname + "?compare=" + selectedCompareIds.join(",");
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: "Perbandingan Teknis Perangkat - Berkah Bintang Solusindo",
                                text: `Bandingkan spesifikasi teknis perangkat terbaik pilihan kami.`,
                                url: shareUrl
                              });
                            } catch (err) {
                              console.log("Error sharing:", err);
                            }
                          } else {
                            try {
                              await navigator.clipboard.writeText(shareUrl);
                              showToast("Link perbandingan berhasil disalin ke clipboard!", "success");
                            } catch (err) {
                              showToast("Gagal menyalin link perbandingan.", "error");
                            }
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/20 hover:border-indigo-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10 active:scale-95"
                      >
                        <Icons.Share2 className="h-3.5 w-3.5" />
                        <span>Bagikan Tautan</span>
                      </button>

                      <button
                        onClick={async () => {
                          const shareUrl = window.location.origin + window.location.pathname + "?compare=" + selectedCompareIds.join(",");
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            showToast("Link perbandingan berhasil disalin ke clipboard!", "success");
                          } catch (err) {
                            showToast("Gagal menyalin link perbandingan.", "error");
                          }
                        }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <Icons.Copy className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Salin Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 mt-8 flex justify-between items-center text-xs text-slate-400">
              <span>Bandingkan hingga maksimal 4 perangkat berdampingan.</span>
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
          #root > *:not(#quotation_sheet_modal):not(#print-session-catalog):not(#print-qr-card-modal),
          header, footer, nav, aside, 
          .fixed.inset-0:not(#quotation_sheet_modal):not(#print-session-catalog):not(#print-qr-card-modal) {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* Ensure any printable modal matches full page width on print */
          #quotation_sheet_modal, #print-session-catalog, #print-qr-card-modal {
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
          #quotation_sheet_modal > div, #print-session-catalog > div, #print-qr-card-modal > div {
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
          #print-qr-card-modal #qr-field-card-preview {
            margin: 2rem auto !important;
            box-shadow: none !important;
            border: 2px solid #cbd5e1 !important;
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
          .quotation-serif-header {
            font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
            letter-spacing: 0.03em !important;
          }
        }
        @keyframes headerFadeScale {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-headerFadeScale {
          animation: headerFadeScale 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* BARCODE / QR SCANNER MODAL */}
      {isScannerOpen && (
        <BarcodeScanner
          catalogProducts={catalogProducts}
          onScanSuccess={(product) => addToCart(product)}
          onClose={() => setIsScannerOpen(false)}
          onAddCustomItem={(item) => {
            setCustomCartItems((prev) => [...prev, item]);
            showToast(`"${item.name}" berhasil ditambahkan ke keranjang RFQ!`, "success");
          }}
        />
      )}

      {/* CATALOG PRODUCT DETAIL & WAREHOUSE SCANNER MODAL */}
      {selectedDetailProduct && (
        <ProductDetailModal
          product={selectedDetailProduct}
          isOpen={!!selectedDetailProduct}
          onClose={() => setSelectedDetailProduct(null)}
          catalogProducts={catalogProducts}
          onProductChange={(newProduct) => setSelectedDetailProduct(newProduct)}
          onAddToCart={(product) => addToCart(product)}
        />
      )}

      {/* BARCODE PRINTING MODAL */}
      {showBarcodePrintModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="barcode-print-modal">
          <style>{`
            @media print {
              body > * {
                display: none !important;
              }
              #barcode-print-wrapper-for-printing {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                color: black !important;
                z-index: 99999999 !important;
              }
              #barcode-print-wrapper-for-printing svg {
                display: block !important;
                color: black !important;
              }
            }
          `}</style>
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh]">
            
            {/* Left Control Panel */}
            <div className="w-full md:w-80 bg-slate-950 border-r border-white/5 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Cetak Label Barcode</h3>
                    <p className="text-[10px] text-slate-400">Pengaturan label & pencetakan</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-4">
                  {/* Label Size */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Ukuran Label</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900/50 p-1 border border-white/5 rounded-xl text-[10px] font-bold">
                      {(["small", "medium", "large"] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setBarcodeSize(sz)}
                          className={`py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                            barcodeSize === sz
                              ? "bg-emerald-600 text-white shadow-md"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Print Layout */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Layout Cetak</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-900/50 p-1 border border-white/5 rounded-xl text-[10px] font-bold">
                      <button
                        onClick={() => setBarcodeLayout("grid")}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          barcodeLayout === "grid"
                            ? "bg-emerald-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Lembar A4 (Grid)
                      </button>
                      <button
                        onClick={() => setBarcodeLayout("roll")}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          barcodeLayout === "roll"
                            ? "bg-emerald-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Roll (Single)
                      </button>
                    </div>
                  </div>

                  {/* Options Toggles */}
                  <div className="space-y-2 bg-slate-900/40 p-3 border border-white/5 rounded-xl">
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Konten Label</label>
                    <div className="space-y-2 text-xs font-semibold">
                      <label className="flex items-center space-x-2.5 text-slate-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCompany}
                          onChange={(e) => setShowCompany(e.target.checked)}
                          className="rounded bg-slate-950 border-white/10 text-emerald-500 focus:ring-0"
                        />
                        <span>Nama Perusahaan</span>
                      </label>
                      <label className="flex items-center space-x-2.5 text-slate-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCategory}
                          onChange={(e) => setShowCategory(e.target.checked)}
                          className="rounded bg-slate-950 border-white/10 text-emerald-500 focus:ring-0"
                        />
                        <span>Kategori Produk</span>
                      </label>
                      <label className="flex items-center space-x-2.5 text-slate-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPrice}
                          onChange={(e) => setShowPrice(e.target.checked)}
                          className="rounded bg-slate-950 border-white/10 text-emerald-500 focus:ring-0"
                        />
                        <span>Rentang Estimasi Harga</span>
                      </label>
                      <label className="flex items-center space-x-2.5 text-slate-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showId}
                          onChange={(e) => setShowId(e.target.checked)}
                          className="rounded bg-slate-950 border-white/10 text-emerald-500 focus:ring-0"
                        />
                        <span>Barcode Alfanumerik (ID)</span>
                      </label>
                    </div>
                  </div>

                  {/* Product Search & Selection list */}
                  <div className="space-y-2 flex flex-col max-h-[220px]">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Item Untuk Dicetak ({printItemsList.length})</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPrintItemsList(catalogProducts.map(p => p.id))}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                        >
                          Pilih Semua
                        </button>
                        <button
                          onClick={() => setPrintItemsList([])}
                          className="text-[9px] text-rose-400 hover:text-rose-300 font-bold hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter list produk..."
                        value={printSearch}
                        onChange={(e) => setPrintSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg text-[10px] pl-7 pr-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="overflow-y-auto border border-white/5 rounded-xl bg-slate-900/30 divide-y divide-white/5 text-[10px] p-1 space-y-0.5 max-h-[140px]">
                      {catalogProducts
                        .filter(p => p.name.toLowerCase().includes(printSearch.toLowerCase()) || p.category.toLowerCase().includes(printSearch.toLowerCase()))
                        .map(p => {
                          const isChecked = printItemsList.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer hover:bg-white/5 ${
                                isChecked ? "bg-white/5 text-emerald-400" : "text-slate-400"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setPrintItemsList(prev => prev.filter(id => id !== p.id));
                                  } else {
                                    setPrintItemsList(prev => [...prev, p.id]);
                                  }
                                }}
                                className="rounded bg-slate-950 border-white/10 text-emerald-500 focus:ring-0 h-3 w-3"
                              />
                              <span className="truncate font-medium">{p.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/5 pt-4 space-y-2 mt-4">
                <button
                  disabled={printItemsList.length === 0}
                  onClick={() => setShowPrintConfirmation(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/10 active:scale-95 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak {printItemsList.length} Label</span>
                </button>
                <button
                  onClick={() => setShowBarcodePrintModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Right Live Preview Area */}
            <div className="flex-1 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Pratinjau Lembar Label</h4>
                  <span className="text-[10px] text-slate-400">Bisa langsung dicetak ke printer kertas / label roll</span>
                </div>

                {printItemsList.length === 0 ? (
                  <div className="h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/30">
                    <Printer className="h-8 w-8 text-slate-500 mb-2 animate-pulse" />
                    <p className="text-slate-400 font-bold text-xs">Tidak Ada Label Terpilih</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Silakan centang satu atau lebih item produk di panel kiri untuk melihat pratinjau dan mencetak barcode label.</p>
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-2xl p-6 bg-slate-900/40 shadow-inner overflow-x-auto min-h-[400px]">
                    {/* Screen Preview Grid */}
                    <div 
                      className={
                        barcodeLayout === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                          : "flex flex-col items-center space-y-4"
                      }
                    >
                      {printItemsList.map((id) => {
                        const product = catalogProducts.find((p) => p.id === id);
                        if (!product) return null;
                        const barCodeValue = getBarcodeValue(product.id);

                        return (
                          <div
                            key={product.id}
                            className={`bg-white text-slate-900 rounded-xl p-4 shadow-xl border border-slate-200/80 flex flex-col justify-between select-none shrink-0 transition-transform hover:scale-[1.02] ${
                              barcodeSize === "small"
                                ? "w-52 h-28"
                                : barcodeSize === "medium"
                                ? "w-64 h-36"
                                : "w-80 h-44"
                            }`}
                          >
                            {/* Company Name */}
                            {showCompany && (
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1 shrink-0">
                                <span className="text-[8px] font-black tracking-wider uppercase text-indigo-900">PT BBS INDONESIA</span>
                                <span className="text-[7px] font-medium text-slate-400 font-mono">APPROVED IT</span>
                              </div>
                            )}

                            {/* Info */}
                            <div className="my-1.5 flex flex-col justify-center">
                              {showCategory && (
                                <span className="text-[7px] font-bold text-indigo-600 uppercase tracking-widest">{product.category}</span>
                              )}
                              <h5 className="text-[10px] font-extrabold text-slate-900 truncate leading-snug">{product.name}</h5>
                              {showPrice && (
                                <span className="text-[8px] font-mono text-emerald-600 font-semibold">{product.estimatedPriceRange}</span>
                              )}
                            </div>

                            {/* Barcode representation */}
                            <div className="flex flex-col items-center bg-slate-50/50 p-1 border border-slate-100 rounded-lg">
                              <div className="w-full text-slate-900">
                                <BarcodeSVG value={barCodeValue} />
                              </div>
                              {showId && (
                                <span className="text-[8px] font-mono font-bold tracking-widest text-slate-600 mt-1 uppercase">
                                  {barCodeValue}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start space-x-2.5">
                <Icons.Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-300">Tips Pencetakan:</span> Jika Anda mencetak ke printer label (seperti Brother, DYMO, Zebra), gunakan layout <span className="text-emerald-400 font-semibold">"Label Roll"</span>. Atur orientasi cetak menjadi <span className="text-emerald-400 font-semibold">Landscape/Portrait</span> sesuai label Anda, dan pastikan setelan margin di browser diatur ke <span className="text-emerald-400 font-semibold">None (Tanpa Margin)</span>.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* BARCODE PRINTING CONFIRMATION MODAL */}
      {showPrintConfirmation && (
        <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="barcode-print-confirmation-modal">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
              <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Icons.CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Konfirmasi Sebelum Mencetak</h3>
                <p className="text-[10px] text-slate-400">Pastikan detail cetak barcode Anda sudah sesuai</p>
              </div>
            </div>

            {/* Print Parameters Checklist info */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/30 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-slate-400 uppercase">
              <div>
                <span className="block text-[8px] text-slate-500 mb-0.5 font-bold">Jumlah Item</span>
                <span className="text-white text-xs">{printItemsList.length} Label</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 mb-0.5 font-bold">Ukuran Label</span>
                <span className="text-white text-xs capitalize">{barcodeSize}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 mb-0.5 font-bold">Layout Cetak</span>
                <span className="text-white text-xs capitalize">{barcodeLayout === "grid" ? "A4 Grid" : "Roll"}</span>
              </div>
            </div>

            {/* List of Products */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Daftar Perangkat Yang Dipilih</span>
              <div className="max-h-48 overflow-y-auto border border-white/5 bg-slate-950/40 rounded-xl divide-y divide-white/5 p-2">
                {printItemsList.map((id) => {
                  const product = catalogProducts.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="flex justify-between items-center p-2 text-xs text-slate-300">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="font-extrabold text-white truncate text-[11px]">{product.name}</span>
                        <span className="text-[9px] text-indigo-400 font-bold">{product.category}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5 text-emerald-400 shrink-0 font-bold">
                        {getBarcodeValue(product.id)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes/Tips */}
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start space-x-2">
              <Icons.Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-normal">
                Klik <span className="font-semibold text-slate-300">Konfirmasi Cetak</span> untuk membuka dialog print bawaan browser. Atur opsi tujuan ke printer label/kertas yang sesuai.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowPrintConfirmation(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-white/5 cursor-pointer active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowPrintConfirmation(false);
                  setTimeout(() => {
                    window.print();
                  }, 150);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all flex items-center justify-center space-x-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Konfirmasi Cetak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY BARCODE LABELS WRAPPER */}
      {showBarcodePrintModal && (
        <div id="barcode-print-wrapper-for-printing" className="hidden print:block bg-white text-black min-h-screen">
          <div 
            className={
              barcodeLayout === "grid"
                ? "grid grid-cols-2 gap-6 p-6"
                : "flex flex-col items-center space-y-6 p-6"
            }
          >
            {printItemsList.map((id) => {
              const product = catalogProducts.find((p) => p.id === id);
              if (!product) return null;
              const barCodeValue = getBarcodeValue(product.id);

              return (
                <div
                  key={product.id}
                  className={`bg-white text-black border border-black rounded-lg p-5 flex flex-col justify-between page-break-inside-avoid ${
                    barcodeSize === "small"
                      ? "w-[3.2in] h-[1.6in]"
                      : barcodeSize === "medium"
                      ? "w-[4.0in] h-[2.0in]"
                      : "w-[4.8in] h-[2.4in]"
                  }`}
                  style={{
                    pageBreakInside: "avoid",
                    breakInside: "avoid"
                  }}
                >
                  {/* Company Name */}
                  {showCompany && (
                    <div className="flex items-center justify-between border-b border-black pb-1">
                      <span className="text-[10px] font-black tracking-widest uppercase">PT BBS INDONESIA</span>
                      <span className="text-[9px] font-mono font-bold">IT COMPLIANT</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="my-2 flex flex-col justify-center">
                    {showCategory && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">{product.category}</span>
                    )}
                    <h5 className="text-[13px] font-black text-black leading-tight truncate">{product.name}</h5>
                    {showPrice && (
                      <span className="text-[10px] font-mono font-bold">{product.estimatedPriceRange}</span>
                    )}
                  </div>

                  {/* Barcode representation */}
                  <div className="flex flex-col items-center bg-white p-1 border border-black rounded mt-1">
                    <div className="w-full text-black">
                      <BarcodeSVG value={barCodeValue} />
                    </div>
                    {showId && (
                      <span className="text-[9px] font-mono font-bold tracking-widest mt-1 uppercase text-black">
                        {barCodeValue}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* 8. INTERNAL COMMENTS MODAL */}
      {selectedCommentRfq && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn no-print" id="rfq-comments-modal">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icons.MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-white text-sm">Komentar Internal RFQ</h3>
                  <p className="text-[10px] text-indigo-300 font-mono mt-0.5">{selectedCommentRfq.rfqNumber} &bull; {selectedCommentRfq.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommentRfq(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>

            {/* Comments Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[250px] max-h-[400px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative">
              {isCameraOpen ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-20">
                  <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[9px] text-white flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <span>KAMERA STAF</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <Icons.Camera className="h-4 w-4" />
                      <span>Ambil Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icons.X className="h-4 w-4" />
                      <span>Batal</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {selectedCommentRfq.internalComments && selectedCommentRfq.internalComments.length > 0 ? (
                selectedCommentRfq.internalComments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`p-3 rounded-xl space-y-1 transition-all border ${
                      comment.role === "superadmin" 
                        ? "bg-indigo-500/[4%] border-indigo-500/25 shadow-sm shadow-indigo-500/[2%]" 
                        : comment.role === "admin"
                        ? "bg-emerald-500/[4%] border-emerald-500/25 shadow-sm shadow-emerald-500/[2%]"
                        : "bg-amber-500/[4%] border-amber-500/25 shadow-sm shadow-amber-500/[2%]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-indigo-300">@{comment.author}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          comment.role === "superadmin" 
                            ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300" 
                            : comment.role === "admin"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                        }`}>
                          {comment.role === "superadmin" ? "S. Admin" : comment.role}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono">
                        {new Date(comment.timestamp).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {comment.text && (
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {comment.text}
                      </p>
                    )}
                    {comment.imageUrl && (
                      <div 
                        className="mt-2 relative rounded-lg overflow-hidden border border-white/10 max-w-[200px] group cursor-pointer"
                        onClick={() => setPreviewImageUrl(comment.imageUrl || null)}
                      >
                        <img 
                          src={comment.imageUrl} 
                          alt="Lampiran foto komentar" 
                          className="max-h-36 object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-200" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                          <Icons.Maximize2 className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-500">
                  <Icons.MessageSquare className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold">Belum ada komentar internal</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Mulai diskusikan status pengadaan RFQ ini dengan tim.</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-4 bg-slate-950/60 border-t border-white/10">
              {/* Captured Image Preview Area */}
              {capturedImage && (
                <div className="mb-3 flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-xl">
                  <div className="relative h-12 w-16 rounded-lg overflow-hidden border border-white/10 bg-black">
                    <img src={capturedImage} alt="Attachment thumbnail" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600/95 hover:bg-rose-500 rounded-full text-white transition-colors cursor-pointer"
                    >
                      <Icons.X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-[10px]">
                    <p className="text-slate-300 font-bold">Foto Terlampir</p>
                    <p className="text-slate-500 font-mono">Siap dikirim bersama komentar</p>
                  </div>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePostComment();
                }}
                className="flex gap-2 items-center"
              >
                {/* Hidden File Input Fallback */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFileCapture}
                  className="hidden"
                />

                {/* Camera Button */}
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isPostingComment || isCameraOpen}
                  title="Ambil Foto dari Kamera"
                  className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-400 hover:text-indigo-400 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border border-white/5"
                >
                  <Icons.Camera className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  placeholder="Ketik komentar internal staf..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={isPostingComment}
                  required={!capturedImage}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || (!commentInput.trim() && !capturedImage)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950/40 disabled:text-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  {isPostingComment ? (
                    <Icons.RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Icons.Send className="h-3.5 w-3.5" />
                      <span>Kirim</span>
                    </>
                  )}
                </button>
              </form>
              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-500">
                <Icons.Info className="h-3 w-3 text-slate-600 shrink-0" />
                <span>Komentar ini bersifat internal dan hanya dapat dilihat oleh staff admin & sales.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. COMMENT IMAGE LIGHTBOX PREVIEW */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn no-print"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImageUrl} 
              alt="Fullscreen Attached Photo" 
              className="max-w-full max-h-[80vh] object-contain mx-auto" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 font-medium">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}

      {/* 10. ORDER SUCCESS MODAL OVERLAY */}
      {isOrderSuccessOpen && latestPlacedOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/30">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl">
                  <Icons.CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm tracking-wide">PESANAN BERHASIL DIAJUKAN</h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">{latestPlacedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderSuccessOpen(false)}
                className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Celeb info */}
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                  <Icons.Check className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white">Terima Kasih, {latestPlacedOrder.clientName}!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Pesanan Anda telah kami terima dan saat ini sedang kami siapkan. Rincian invoice dan instruksi pembayaran telah dikirim ke email <strong>{latestPlacedOrder.email}</strong>.
                </p>
              </div>

              {/* Bank Account Details */}
              {latestPlacedOrder.paymentMethod === "bank_transfer" && (
                <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    <Icons.CreditCard className="h-4 w-4" />
                    <span>Rekening Pembayaran PT Berkah Bintang Solusindo</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <div className="text-slate-500">Bank Penerima</div>
                      <div className="font-bold text-white text-sm">{settings?.bankAccount?.bankName || "Bank Mandiri"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Nomor Rekening Resmi</div>
                      <div className="font-extrabold text-white text-sm tracking-wider font-mono flex items-center gap-2">
                        <span>{settings?.bankAccount?.accountNumber || "123-45-67890-1"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(settings?.bankAccount?.accountNumber || "123-45-67890-1");
                            showToast("No rekening disalin!", "success");
                          }}
                          className="text-[10px] text-slate-400 hover:text-indigo-400 underline cursor-pointer"
                        >
                          Salin
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Nama Pemilik Rekening</div>
                      <div className="font-bold text-white text-sm uppercase">{settings?.bankAccount?.accountHolder || "PT Berkah Bintang Solusindo"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Total Nominal Transfer</div>
                      <div className="font-extrabold text-emerald-400 text-sm">
                        Rp {latestPlacedOrder.total.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 leading-relaxed">
                    *Harap transfer sesuai dengan nominal di atas. Setelah melakukan pembayaran, silakan hubungi kami via WhatsApp di <strong>{settings?.whatsapp || "+6281234567890"}</strong> dengan melampirkan bukti transfer dan nomor invoice Anda.
                  </div>
                </div>
              )}

              {/* Order summary table */}
              <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-950/60 p-3 font-bold text-slate-200 border-b border-white/5 flex items-center justify-between">
                  <span>Rincian Item Pembelian</span>
                  <span className="font-mono text-[10px]">{latestPlacedOrder.date}</span>
                </div>
                <div className="divide-y divide-white/5 bg-slate-950/20">
                  {latestPlacedOrder.items.map((it: any, idx: number) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{it.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {it.quantity} Unit x Rp {it.price.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="font-bold text-white">
                        Rp {it.totalPrice.toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950/40 p-4 space-y-1.5 text-slate-400 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {latestPlacedOrder.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {latestPlacedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Diskon Kupon</span>
                      <span>- Rp {latestPlacedOrder.discount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>PPN (11%)</span>
                    <span>Rp {latestPlacedOrder.tax.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim ({getDeliveryLabel(latestPlacedOrder.deliveryMethod)})</span>
                    <span>{latestPlacedOrder.shippingCost > 0 ? `Rp ${latestPlacedOrder.shippingCost.toLocaleString("id-ID")}` : "GRATIS"}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/5">
                    <span>Total Pembayaran</span>
                    <span className="text-indigo-400">Rp {latestPlacedOrder.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950/30 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-end">
              <button
                type="button"
                onClick={() => downloadOrderInvoicePdf(latestPlacedOrder)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icons.Download className="h-4 w-4" />
                <span>Unduh Invoice PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOrderSuccessOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center cursor-pointer"
              >
                <span>Selesai & Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
