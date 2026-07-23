import React, { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { MaintenanceAsset, ServiceHistoryItem, ProductItem } from "../types";
import DashboardMaintenance from "./DashboardMaintenance";

interface MaintenanceModuleProps {
  catalogProducts: ProductItem[];
  clientsList?: string[];
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  formatRupiah: (val: number) => string;
}

const INITIAL_MAINTENANCE_ASSETS: MaintenanceAsset[] = [
  {
    id: "mnt_1",
    clientName: "PT. Bank Nusantara Utama",
    clientCompany: "PT. Bank Nusantara Utama",
    clientEmail: "it-procurement@banknusantara.co.id",
    clientPhone: "081298765432",
    assetName: "Server Mainframe Dell PowerEdge R750 (Cluster DB)",
    assetCategory: "Server & Storage",
    sku: "BBS-DEL-R250",
    serialNumber: "SN-DELL-750-881",
    contractNumber: "MNT/BBS/2026/001",
    contractStartDate: "2026-01-01",
    contractEndDate: "2026-12-31",
    serviceIntervalMonths: 3,
    lastServiceDate: "2026-04-15",
    nextServiceDueDate: "2026-07-15",
    status: "overdue",
    technicianInCharge: "Dian (BBS-WH2)",
    locationRack: "Data Center LT.2 - Rack A04",
    contractValue: 45000000,
    notes: "Perlu pengecekan kesehatan RAID Controller dan penggantian pasta termal.",
    serviceHistory: [
      {
        id: "sh_1",
        serviceDate: "2026-04-15",
        technician: "Dian (BBS-WH2)",
        description: "Pembersihan debu server, pembaruan firmware BIOS v2.4, pengecekan log RAID.",
        statusAfter: "Normal",
        costEstimate: 0,
      },
      {
        id: "sh_2",
        serviceDate: "2026-01-15",
        technician: "Dian (BBS-WH2)",
        description: "Komisioning awal kontrak maintenance dan pemetaan kabel power redundancy.",
        statusAfter: "Normal",
        costEstimate: 0,
      },
    ],
  },
  {
    id: "mnt_2",
    clientName: "Dinas Kominfo Provinsi",
    clientCompany: "Diskominfo Prov",
    clientEmail: "infrastructure@diskominfo.go.id",
    clientPhone: "081311223344",
    assetName: "Router Core MikroTik CCR2004-16G-2S+",
    assetCategory: "Networking",
    sku: "BBS-MTK-5009",
    serialNumber: "SN-MTK-2004-992",
    contractNumber: "MNT/BBS/2026/002",
    contractStartDate: "2026-02-01",
    contractEndDate: "2027-01-31",
    serviceIntervalMonths: 1,
    lastServiceDate: "2026-06-25",
    nextServiceDueDate: "2026-07-28",
    status: "due_soon",
    technicianInCharge: "Yanto (BBS-WH3)",
    locationRack: "Ruang Server Utama - Rack B01",
    contractValue: 18000000,
    notes: "Inspeksi rutin lalu lintas BGP dan cadangan konfigurasi bulanan.",
    serviceHistory: [
      {
        id: "sh_3",
        serviceDate: "2026-06-25",
        technician: "Yanto (BBS-WH3)",
        description: "Backup rutin RouterOS & inspeksi suhu CPU dan pembersihan kipas.",
        statusAfter: "Normal",
        costEstimate: 0,
      },
    ],
  },
  {
    id: "mnt_3",
    clientName: "PT. Telematika Mandiri",
    clientCompany: "PT. Telematika Mandiri",
    clientEmail: "support@telematika.co.id",
    clientPhone: "085711223344",
    assetName: "Synology DiskStation DS923+ NAS Storage (4x 8TB)",
    assetCategory: "Server & Storage",
    sku: "BBS-SYN-DS923",
    serialNumber: "SN-SYN-923-004",
    contractNumber: "MNT/BBS/2026/003",
    contractStartDate: "2026-03-01",
    contractEndDate: "2027-02-28",
    serviceIntervalMonths: 6,
    lastServiceDate: "2026-03-01",
    nextServiceDueDate: "2026-09-01",
    status: "active",
    technicianInCharge: "Handoko (BBS-WH1)",
    locationRack: "Ruang IT LT.4",
    contractValue: 24000000,
    notes: "Monitoring S.M.A.R.T harddisk dan scrubbing Hyper Backup.",
    serviceHistory: [
      {
        id: "sh_4",
        serviceDate: "2026-03-01",
        technician: "Handoko (BBS-WH1)",
        description: "Pengujian awal & konfigurasi RAID 5 S.M.A.R.T alert.",
        statusAfter: "Normal",
        costEstimate: 0,
      },
    ],
  },
  {
    id: "mnt_4",
    clientName: "RSUD Berkah Sehat",
    clientCompany: "RSUD Berkah Sehat",
    clientEmail: "medis-it@rsudberkah.go.id",
    clientPhone: "081122334455",
    assetName: "CCTV IP Hikvision DS-2CD2143G2-I (System 32 Cam)",
    assetCategory: "CCTV & Security",
    sku: "BBS-HIK-DS2CD",
    serialNumber: "SN-HIK-32CAM-01",
    contractNumber: "MNT/BBS/2025/088",
    contractStartDate: "2025-08-01",
    contractEndDate: "2026-08-01",
    serviceIntervalMonths: 3,
    lastServiceDate: "2026-05-10",
    nextServiceDueDate: "2026-08-10",
    status: "due_soon",
    technicianInCharge: "Handoko (BBS-WH1)",
    locationRack: "Gedung IGD & Rawat Inap",
    contractValue: 32000000,
    notes: "Pembersihan lensa kamera luar ruangan dan pengecekan NVR 64-Ch.",
    serviceHistory: [
      {
        id: "sh_5",
        serviceDate: "2026-05-10",
        technician: "Handoko (BBS-WH1)",
        description: "Pembersihan lensa 12 kamera outdoor & kalibrasi NVR.",
        statusAfter: "Normal",
        costEstimate: 0,
      },
    ],
  },
  {
    id: "mnt_5",
    clientName: "PT. Agro Prima Industri",
    clientCompany: "PT. Agro Prima Industri",
    clientEmail: "procurement@agroprima.co.id",
    clientPhone: "081809090909",
    assetName: "APC Smart-UPS RT 3000VA Online Tower/Rack Mount",
    assetCategory: "Power & UPS",
    sku: "BBS-APC-UPS3K",
    serialNumber: "SN-APC-3000-771",
    contractNumber: "MNT/BBS/2026/005",
    contractStartDate: "2026-04-01",
    contractEndDate: "2027-03-31",
    serviceIntervalMonths: 6,
    lastServiceDate: "2026-04-01",
    nextServiceDueDate: "2026-10-01",
    status: "active",
    technicianInCharge: "Dian (BBS-WH2)",
    locationRack: "Ruang Server LT.1",
    contractValue: 15000000,
    notes: "Pengujian beban baterai (battery discharge test) & impedance check.",
    serviceHistory: [
      {
        id: "sh_6",
        serviceDate: "2026-04-01",
        technician: "Dian (BBS-WH2)",
        description: "Pemasangan unit baru dan pengujian transfer time 0ms.",
        statusAfter: "Normal",
        costEstimate: 0,
      },
    ],
  },
];

export default function MaintenanceModule({
  catalogProducts,
  clientsList = [],
  showToast,
  formatRupiah,
}: MaintenanceModuleProps) {
  // Persistence state
  const [maintenanceAssets, setMaintenanceAssets] = useState<MaintenanceAsset[]>(() => {
    try {
      const stored = localStorage.getItem("bbs_maintenance_assets");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MAINTENANCE_ASSETS;
  });

  // Save changes to localStorage
  const saveAssets = (assets: MaintenanceAsset[]) => {
    setMaintenanceAssets(assets);
    try {
      localStorage.setItem("bbs_maintenance_assets", JSON.stringify(assets));
    } catch (e) {
      console.error("Failed to save maintenance assets:", e);
    }
  };

  // UI state for search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MaintenanceAsset | null>(null);

  const [isLogServiceModalOpen, setIsLogServiceModalOpen] = useState(false);
  const [loggingAsset, setLoggingAsset] = useState<MaintenanceAsset | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<MaintenanceAsset | null>(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderAsset, setReminderAsset] = useState<MaintenanceAsset | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Add/Edit Form State
  const [formClientName, setFormClientName] = useState("");
  const [formClientCompany, setFormClientCompany] = useState("");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("");
  const [formAssetName, setFormAssetName] = useState("");
  const [formAssetCategory, setFormAssetCategory] = useState("Server & Storage");
  const [formSku, setFormSku] = useState("");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formContractNumber, setFormContractNumber] = useState("");
  const [formContractStartDate, setFormContractStartDate] = useState("2026-01-01");
  const [formContractEndDate, setFormContractEndDate] = useState("2026-12-31");
  const [formServiceInterval, setFormServiceInterval] = useState(3);
  const [formNextDueDate, setFormNextDueDate] = useState("2026-08-01");
  const [formTechnician, setFormTechnician] = useState("Dian (BBS-WH2)");
  const [formLocationRack, setFormLocationRack] = useState("");
  const [formContractValue, setFormContractValue] = useState<number>(10000000);
  const [formNotes, setFormNotes] = useState("");

  // Log Service Form State
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logTechnician, setLogTechnician] = useState("Dian (BBS-WH2)");
  const [logDescription, setLogDescription] = useState("");
  const [logStatusAfter, setLogStatusAfter] = useState<"Normal" | "Perlu Replacement" | "Troubleshoot Selesai" | "Pembersihan & Kalibrasi">("Normal");
  const [logReplacedParts, setLogReplacedParts] = useState("");
  const [logCostEstimate, setLogCostEstimate] = useState<number>(0);

  // Helper date calculations
  const calculateDaysDiff = (targetDateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Compute status dynamically if needed
  const getComputedStatus = (asset: MaintenanceAsset): {
    status: "overdue" | "due_soon" | "active" | "expired";
    daysDiff: number;
    badgeLabel: string;
    badgeClass: string;
  } => {
    const days = calculateDaysDiff(asset.nextServiceDueDate);
    const contractDays = calculateDaysDiff(asset.contractEndDate);

    if (contractDays < 0) {
      return {
        status: "expired",
        daysDiff: days,
        badgeLabel: "Kontrak Expired",
        badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
      };
    }

    if (days < 0) {
      return {
        status: "overdue",
        daysDiff: days,
        badgeLabel: `🔴 TERLAMBAT (${Math.abs(days)} Hari)`,
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-black animate-pulse",
      };
    } else if (days <= 30) {
      return {
        status: "due_soon",
        daysDiff: days,
        badgeLabel: `🟡 JATUH TEMPO (H-${days})`,
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-extrabold",
      };
    } else {
      return {
        status: "active",
        daysDiff: days,
        badgeLabel: `🟢 TERJADWAL (H-${days})`,
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold",
      };
    }
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return maintenanceAssets.filter((asset) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        asset.clientName.toLowerCase().includes(q) ||
        (asset.clientCompany && asset.clientCompany.toLowerCase().includes(q)) ||
        asset.assetName.toLowerCase().includes(q) ||
        asset.contractNumber.toLowerCase().includes(q) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(q)) ||
        (asset.sku && asset.sku.toLowerCase().includes(q)) ||
        (asset.technicianInCharge && asset.technicianInCharge.toLowerCase().includes(q)) ||
        (asset.locationRack && asset.locationRack.toLowerCase().includes(q));

      const computed = getComputedStatus(asset);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "overdue" && computed.status === "overdue") ||
        (statusFilter === "due_soon" && computed.status === "due_soon") ||
        (statusFilter === "active" && computed.status === "active") ||
        (statusFilter === "expired" && computed.status === "expired");

      const matchCategory = categoryFilter === "all" || asset.assetCategory === categoryFilter;
      const matchTechnician = technicianFilter === "all" || asset.technicianInCharge === technicianFilter;
      const matchUrgent = !urgentOnly || computed.status === "overdue" || computed.status === "due_soon";

      return matchSearch && matchStatus && matchCategory && matchTechnician && matchUrgent;
    });
  }, [maintenanceAssets, searchTerm, statusFilter, categoryFilter, technicianFilter, urgentOnly]);

  // Statistics
  const stats = useMemo(() => {
    let totalValue = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let activeCount = 0;
    let expiredCount = 0;

    maintenanceAssets.forEach((item) => {
      totalValue += item.contractValue || 0;
      const comp = getComputedStatus(item);
      if (comp.status === "overdue") overdueCount++;
      else if (comp.status === "due_soon") dueSoonCount++;
      else if (comp.status === "active") activeCount++;
      else if (comp.status === "expired") expiredCount++;
    });

    return {
      totalAssets: maintenanceAssets.length,
      totalValue,
      overdueCount,
      dueSoonCount,
      activeCount,
      expiredCount,
      urgentTotal: overdueCount + dueSoonCount,
    };
  }, [maintenanceAssets]);

  // Categories list
  const categoriesList = useMemo(() => {
    return Array.from(new Set(maintenanceAssets.map((a) => a.assetCategory)));
  }, [maintenanceAssets]);

  // Technicians list
  const techniciansList = useMemo(() => {
    return Array.from(new Set(maintenanceAssets.map((a) => a.technicianInCharge).filter((t): t is string => !!t)));
  }, [maintenanceAssets]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setFormClientName("");
    setFormClientCompany("");
    setFormClientEmail("");
    setFormClientPhone("");
    setFormAssetName("");
    setFormAssetCategory("Server & Storage");
    setFormSku("");
    setFormSerialNumber("");
    const randomContract = `MNT/BBS/2026/${Math.floor(100 + Math.random() * 900)}`;
    setFormContractNumber(randomContract);
    const todayStr = new Date().toISOString().split("T")[0];
    setFormContractStartDate(todayStr);
    
    // contract end date 1 year from today
    const nextYr = new Date();
    nextYr.setFullYear(nextYr.getFullYear() + 1);
    setFormContractEndDate(nextYr.toISOString().split("T")[0]);

    setFormServiceInterval(3);
    
    // next due date 3 months from today
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 3);
    setFormNextDueDate(nextDue.toISOString().split("T")[0]);

    setFormTechnician("Dian (BBS-WH2)");
    setFormLocationRack("Ruang Server / Rack A1");
    setFormContractValue(15000000);
    setFormNotes("");
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (asset: MaintenanceAsset) => {
    setEditingAsset(asset);
    setFormClientName(asset.clientName);
    setFormClientCompany(asset.clientCompany || "");
    setFormClientEmail(asset.clientEmail || "");
    setFormClientPhone(asset.clientPhone || "");
    setFormAssetName(asset.assetName);
    setFormAssetCategory(asset.assetCategory);
    setFormSku(asset.sku || "");
    setFormSerialNumber(asset.serialNumber || "");
    setFormContractNumber(asset.contractNumber);
    setFormContractStartDate(asset.contractStartDate);
    setFormContractEndDate(asset.contractEndDate);
    setFormServiceInterval(asset.serviceIntervalMonths);
    setFormNextDueDate(asset.nextServiceDueDate);
    setFormTechnician(asset.technicianInCharge || "Dian (BBS-WH2)");
    setFormLocationRack(asset.locationRack || "");
    setFormContractValue(asset.contractValue || 0);
    setFormNotes(asset.notes || "");
    setIsAddEditModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveAddEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim() || !formAssetName.trim() || !formContractNumber.trim()) {
      showToast("Harap lengkapi nama pelanggan, nama aset, dan nomor kontrak!", "error");
      return;
    }

    if (editingAsset) {
      // Update
      const updated = maintenanceAssets.map((a) => {
        if (a.id === editingAsset.id) {
          return {
            ...a,
            clientName: formClientName.trim(),
            clientCompany: formClientCompany.trim() || formClientName.trim(),
            clientEmail: formClientEmail.trim() || undefined,
            clientPhone: formClientPhone.trim() || undefined,
            assetName: formAssetName.trim(),
            assetCategory: formAssetCategory,
            sku: formSku.trim() || undefined,
            serialNumber: formSerialNumber.trim() || undefined,
            contractNumber: formContractNumber.trim(),
            contractStartDate: formContractStartDate,
            contractEndDate: formContractEndDate,
            serviceIntervalMonths: Number(formServiceInterval),
            nextServiceDueDate: formNextDueDate,
            technicianInCharge: formTechnician,
            locationRack: formLocationRack.trim() || undefined,
            contractValue: Number(formContractValue),
            notes: formNotes.trim() || undefined,
          };
        }
        return a;
      });
      saveAssets(updated);
      showToast(`Berhasil memperbarui data pemeliharaan "${formAssetName}"`, "success");
    } else {
      // Create new
      const newAsset: MaintenanceAsset = {
        id: `mnt_${Date.now()}`,
        clientName: formClientName.trim(),
        clientCompany: formClientCompany.trim() || formClientName.trim(),
        clientEmail: formClientEmail.trim() || undefined,
        clientPhone: formClientPhone.trim() || undefined,
        assetName: formAssetName.trim(),
        assetCategory: formAssetCategory,
        sku: formSku.trim() || undefined,
        serialNumber: formSerialNumber.trim() || undefined,
        contractNumber: formContractNumber.trim(),
        contractStartDate: formContractStartDate,
        contractEndDate: formContractEndDate,
        serviceIntervalMonths: Number(formServiceInterval),
        lastServiceDate: undefined,
        nextServiceDueDate: formNextDueDate,
        status: "active",
        technicianInCharge: formTechnician,
        locationRack: formLocationRack.trim() || undefined,
        contractValue: Number(formContractValue),
        notes: formNotes.trim() || undefined,
        serviceHistory: [],
      };
      saveAssets([newAsset, ...maintenanceAssets]);
      showToast(`Berhasil menambahkan aset kontrak baru "${formAssetName}"`, "success");
    }
    setIsAddEditModalOpen(false);
  };

  // Delete Asset
  const handleDeleteAsset = (asset: MaintenanceAsset) => {
    if (confirm(`Apakah Anda yakin ingin menghapus aset pemeliharaan "${asset.assetName}" (Kontrak: ${asset.contractNumber})?`)) {
      const updated = maintenanceAssets.filter((a) => a.id !== asset.id);
      saveAssets(updated);
      showToast(`Aset pemeliharaan "${asset.assetName}" berhasil dihapus`, "success");
    }
  };

  // Open Log Service Modal
  const handleOpenLogServiceModal = (asset: MaintenanceAsset) => {
    setLoggingAsset(asset);
    setLogDate(new Date().toISOString().split("T")[0]);
    setLogTechnician(asset.technicianInCharge || "Dian (BBS-WH2)");
    setLogDescription("Pemeriksaan berkala rutin, pembersihan fisik, dan pengujian fungsi modul.");
    setLogStatusAfter("Normal");
    setLogReplacedParts("");
    setLogCostEstimate(0);
    setIsLogServiceModalOpen(true);
  };

  // Submit Log Service (Auto calculate next due date!)
  const handleSubmitLogService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingAsset || !logDescription.trim()) {
      showToast("Harap isi deskripsi pelaksanaan servis!", "error");
      return;
    }

    // Create history item
    const newHistoryItem: ServiceHistoryItem = {
      id: `sh_${Date.now()}`,
      serviceDate: logDate,
      technician: logTechnician,
      description: logDescription.trim(),
      statusAfter: logStatusAfter,
      replacedParts: logReplacedParts.trim() || undefined,
      costEstimate: logCostEstimate > 0 ? logCostEstimate : undefined,
    };

    // Auto calculate NEXT service due date based on logDate + serviceIntervalMonths
    const logDateObj = new Date(logDate);
    logDateObj.setMonth(logDateObj.getMonth() + (loggingAsset.serviceIntervalMonths || 3));
    const autoNextDueDateStr = logDateObj.toISOString().split("T")[0];

    const updatedAssets = maintenanceAssets.map((asset) => {
      if (asset.id === loggingAsset.id) {
        return {
          ...asset,
          lastServiceDate: logDate,
          nextServiceDueDate: autoNextDueDateStr,
          status: "active" as const,
          serviceHistory: [newHistoryItem, ...(asset.serviceHistory || [])],
        };
      }
      return asset;
    });

    saveAssets(updatedAssets);
    setIsLogServiceModalOpen(false);
    showToast(
      `Servis berhasil dicatat! Jatuh tempo berikutnya otomatis diperbarui ke ${autoNextDueDateStr}`,
      "success"
    );
  };

  // Generate WhatsApp Reminder Text
  const getWhatsAppReminderMessage = (asset: MaintenanceAsset): string => {
    const comp = getComputedStatus(asset);
    const dueDateFormatted = new Date(asset.nextServiceDueDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `Halo Tim *${asset.clientCompany || asset.clientName}*,\n\nKami dari Berkah Bintang Solusindo ingin mengonfirmasi jadwal pemeliharaan berkala (Maintenance Contract) untuk perangkat Anda:\n\n📌 *Nomor Kontrak:* ${asset.contractNumber}\n🖥️ *Nama Aset:* ${asset.assetName}\n🏷️ *SKU / SN:* ${asset.sku || asset.serialNumber || "N/A"}\n📍 *Lokasi:* ${asset.locationRack || "Ruang Server"}\n📅 *Jatuh Tempo Servis:* ${dueDateFormatted} (${comp.badgeLabel})\n👨‍🔧 *Teknisi BBS:* ${asset.technicianInCharge || "Tim Teknisi BBS"}\n\nMohon beri tahu kami waktu yang sesuai untuk kunjungan tim teknisi kami. Terima kasih!\n\n_Salam hangat,_\n*PT Berkah Bintang Solusindo*`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Header Stats & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets Under Contract */}
        <div className="p-5 bg-slate-900/50 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Icons.ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Aset Kontrak</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {stats.totalAssets} <span className="text-xs text-slate-400 font-normal">Unit Perangkat</span>
            </h4>
            <p className="text-[10px] text-indigo-300 font-mono mt-0.5">
              Nilai: {formatRupiah(stats.totalValue)}
            </p>
          </div>
        </div>

        {/* Card 2: Overdue / Critical Attention */}
        <div className={`p-5 border backdrop-blur-xl rounded-2xl flex items-center space-x-4 shadow-xl transition-all ${
          stats.overdueCount > 0 
            ? "bg-rose-950/40 border-rose-500/40 ring-1 ring-rose-500/30" 
            : "bg-slate-900/50 border-white/10"
        }`}>
          <div className={`p-3 rounded-xl border ${
            stats.overdueCount > 0 
              ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse" 
              : "bg-slate-800 border-white/10 text-slate-400"
          }`}>
            <Icons.AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-rose-300 font-bold flex items-center gap-1">
              <span>Servis Terlambat (Overdue)</span>
            </p>
            <h4 className="text-2xl font-black text-white mt-1">
              {stats.overdueCount} <span className="text-xs text-slate-400 font-normal">Perangkat</span>
            </h4>
            <p className="text-[10px] text-rose-400 font-semibold mt-0.5">
              {stats.overdueCount > 0 ? "⚡ Perlu Servis Segera!" : "Tidak Ada Terlambat"}
            </p>
          </div>
        </div>

        {/* Card 3: Due Soon (≤ 30 Days) */}
        <div className="p-5 bg-slate-900/50 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Icons.Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Jatuh Tempo Dekat (≤ 30 Hari)</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {stats.dueSoonCount} <span className="text-xs text-slate-400 font-normal">Aset</span>
            </h4>
            <p className="text-[10px] text-amber-300 mt-0.5">Siapkan Teknisi & Suku Cadang</p>
          </div>
        </div>

        {/* Card 4: Scheduled Active */}
        <div className="p-5 bg-slate-900/50 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Icons.CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Terjadwal Aman (&gt; 30 Hari)</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {stats.activeCount} <span className="text-xs text-slate-400 font-normal">Normal</span>
            </h4>
            <p className="text-[10px] text-emerald-400 mt-0.5">Status Pemeliharaan Terjaga</p>
          </div>
        </div>
      </div>

      {/* Overdue Urgent Alert Banner */}
      {stats.overdueCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0 animate-bounce">
              <Icons.Bell className="h-6 w-6" />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>Peringatan Jatuh Tempo: {stats.overdueCount} Perangkat Melewati Tanggal Servis Periodic</span>
                <span className="px-2 py-0.5 bg-rose-500 text-slate-950 font-black text-[10px] rounded-full uppercase">Perhatian</span>
              </h5>
              <p className="text-xs text-rose-200 mt-0.5">
                Segera catat servis selesai atau kirim pesan pengingat ke kontak pelanggan untuk menjadwalkan kunjungan teknisi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("overdue");
                setUrgentOnly(true);
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
            >
              <Icons.AlertTriangle className="h-4 w-4" />
              <span>Filter Aset Terlambat ({stats.overdueCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Pengingat Jatuh Tempo (30 Hari Ke Depan) */}
      <DashboardMaintenance
        assets={maintenanceAssets}
        onLogService={(asset) => handleOpenLogServiceModal(asset)}
        onSendReminder={(asset) => {
          setReminderAsset(asset);
          setIsReminderModalOpen(true);
        }}
        onEditAsset={(asset) => handleOpenEditModal(asset)}
        onSelectAsset={(asset) => handleOpenEditModal(asset)}
        showToast={showToast}
        formatRupiah={formatRupiah}
      />

      {/* Main Table Container & Action Toolbar */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Control Toolbar */}
        <div className="p-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/40">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Icons.Wrench className="h-5 w-5 text-indigo-400" />
              <span>Manajemen Kontrak Pemeliharaan (Maintenance)</span>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-mono font-bold border border-indigo-500/30">
                {filteredAssets.length} Aset
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Kelola jadwal servis berkala, pengingat jatuh tempo, teknisi penanggung jawab, dan riwayat pemeliharaan perangkat pelanggan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Icons.Plus className="h-4 w-4" />
              <span>Tambah Aset Kontrak Baru</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
              title="Cetak Laporan Jadwal Pemeliharaan"
            >
              <Icons.Printer className="h-4 w-4 text-indigo-400" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelanggan, nama aset, no kontrak, SN, SKU, lokasi, teknisi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
            >
              <option value="all">Semua Status Servis</option>
              <option value="overdue">🔴 Terlambat Servis ({stats.overdueCount})</option>
              <option value="due_soon">🟡 Jatuh Tempo Dekat ({stats.dueSoonCount})</option>
              <option value="active">🟢 Terjadwal Normal ({stats.activeCount})</option>
              <option value="expired">⚪ Kontrak Expired ({stats.expiredCount})</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Kategori Aset</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Technician Filter */}
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Teknisi</option>
              {techniciansList.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>

            {/* Urgent Toggle Button */}
            <button
              type="button"
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 border ${
                urgentOnly
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <Icons.AlertTriangle className="h-3.5 w-3.5" />
              <span>Prioritas ({stats.urgentTotal})</span>
            </button>
          </div>
        </div>

        {/* Assets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Pelanggan & Kontrak</th>
                <th className="py-3.5 px-4">Perangkat & Lokasi</th>
                <th className="py-3.5 px-4 text-center">Interval</th>
                <th className="py-3.5 px-4">Jatuh Tempo Servis</th>
                <th className="py-3.5 px-4">Teknisi PIC</th>
                <th className="py-3.5 px-4 text-center">Riwayat</th>
                <th className="py-3.5 px-4 text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    <Icons.Wrench className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <span>Tidak ada data aset pemeliharaan yang sesuai dengan filter/pencarian Anda.</span>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, idx) => {
                  const comp = getComputedStatus(asset);
                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-white/5 text-xs text-slate-300 transition-colors ${
                        comp.status === "overdue"
                          ? "bg-rose-500/[0.04] border-l-2 border-l-rose-500"
                          : comp.status === "due_soon"
                          ? "bg-amber-500/[0.03] border-l-2 border-l-amber-500"
                          : ""
                      }`}
                    >
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-500">{idx + 1}</td>

                      {/* Client & Contract */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-white text-xs">{asset.clientCompany || asset.clientName}</h5>
                          <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
                            <Icons.FileText className="h-3 w-3 text-indigo-400" />
                            <span>{asset.contractNumber}</span>
                          </div>
                          {asset.clientPhone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              📱 {asset.clientPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Asset & Location */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-100 text-xs flex items-center gap-1.5">
                            <Icons.Package className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span>{asset.assetName}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[9px]">
                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-bold border border-white/5">
                              {asset.assetCategory}
                            </span>
                            {asset.sku && (
                              <span className="px-1.5 py-0.5 bg-indigo-950/60 text-indigo-300 font-mono rounded border border-indigo-500/20">
                                SKU: {asset.sku}
                              </span>
                            )}
                            {asset.serialNumber && (
                              <span className="px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 font-mono rounded border border-emerald-500/20">
                                SN: {asset.serialNumber}
                              </span>
                            )}
                          </div>
                          {asset.locationRack && (
                            <div className="text-[10px] text-slate-400 italic">
                              📍 {asset.locationRack}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Interval */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-1 bg-slate-950 text-indigo-300 text-[10px] font-bold rounded-lg border border-white/10 font-mono">
                          {asset.serviceIntervalMonths === 1
                            ? "Bulanan"
                            : asset.serviceIntervalMonths === 3
                            ? "Triwulan"
                            : asset.serviceIntervalMonths === 6
                            ? "Semesteran"
                            : "Tahunan"}
                        </span>
                      </td>

                      {/* Next Service Due Date & Status Badge */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border ${comp.badgeClass}`}>
                            <Icons.Clock className="h-3 w-3" />
                            <span>{comp.badgeLabel}</span>
                          </span>

                          <div className="text-[10px] text-slate-400 font-mono">
                            Jatuh Tempo: <strong className="text-white">{asset.nextServiceDueDate}</strong>
                          </div>

                          {asset.lastServiceDate && (
                            <div className="text-[9px] text-slate-500">
                              Servis Terakhir: {asset.lastServiceDate}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            <Icons.User className="h-3 w-3" />
                          </div>
                          <span className="text-xs text-slate-300 font-semibold">{asset.technicianInCharge || "Tim BBS"}</span>
                        </div>
                      </td>

                      {/* History Log Count */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryAsset(asset);
                            setIsHistoryModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-extrabold rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Icons.History className="h-3 w-3" />
                          <span>{asset.serviceHistory?.length || 0} Log</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {/* Log Service Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenLogServiceModal(asset)}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-lg transition-colors border border-emerald-500/30 cursor-pointer flex items-center gap-1"
                            title="Catat Servis Selesai"
                          >
                            <Icons.Wrench className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-extrabold hidden xl:inline">Catat Servis</span>
                          </button>

                          {/* Reminder WA Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReminderAsset(asset);
                              setIsReminderModalOpen(true);
                            }}
                            className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded-lg transition-colors border border-amber-500/30 cursor-pointer"
                            title="Kirim Pengingat Servis ke WhatsApp / Email"
                          >
                            <Icons.Bell className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-white/10 cursor-pointer"
                            title="Ubah Data Aset"
                          >
                            <Icons.Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                            title="Hapus Aset"
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

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT MAINTENANCE ASSET                     */}
      {/* ======================================================== */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                <Icons.Wrench className="h-5 w-5 text-indigo-400" />
                <span>{editingAsset ? "Ubah Aset Pemeliharaan" : "Tambah Aset Kontrak Pemeliharaan Baru"}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Pelanggan */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-3">
                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Building className="h-4 w-4" />
                  <span>Informasi Pelanggan / Klien</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Perusahaan / Instansi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT. Bank Nusantara Utama"
                      value={formClientCompany}
                      onChange={(e) => {
                        setFormClientCompany(e.target.value);
                        if (!formClientName) setFormClientName(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Kontak PIC *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pak Budi (IT Manager)"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Email Klien</label>
                    <input
                      type="email"
                      placeholder="it@banknusantara.co.id"
                      value={formClientEmail}
                      onChange={(e) => setFormClientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">No. WhatsApp / Telepon</label>
                    <input
                      type="text"
                      placeholder="081298765432"
                      value={formClientPhone}
                      onChange={(e) => setFormClientPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Informasi Perangkat */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-3">
                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Package className="h-4 w-4" />
                  <span>Detail Perangkat & Lokasi Aset</span>
                </h5>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Perangkat / Aset *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Server Mainframe Dell PowerEdge R750"
                      value={formAssetName}
                      onChange={(e) => setFormAssetName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Kategori Perangkat</label>
                      <select
                        value={formAssetCategory}
                        onChange={(e) => setFormAssetCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Server & Storage">Server & Storage</option>
                        <option value="Networking">Networking</option>
                        <option value="CCTV & Security">CCTV & Security</option>
                        <option value="Workstation & PC">Workstation & PC</option>
                        <option value="Power & UPS">Power & UPS</option>
                        <option value="Software & Licensing">Software & Licensing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Kode SKU</label>
                      <input
                        type="text"
                        placeholder="BBS-DEL-R250"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Serial Number (SN)</label>
                      <input
                        type="text"
                        placeholder="SN-DELL-750-881"
                        value={formSerialNumber}
                        onChange={(e) => setFormSerialNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Lokasi Perangkat / Rack</label>
                    <input
                      type="text"
                      placeholder="Contoh: Ruang Data Center LT.2 - Rack A04"
                      value={formLocationRack}
                      onChange={(e) => setFormLocationRack(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Kontrak & Jadwal Pemeliharaan */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-3">
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Calendar className="h-4 w-4" />
                  <span>Kontrak & Jadwal Pemeliharaan Periodic</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nomor Kontrak *</label>
                    <input
                      type="text"
                      required
                      placeholder="MNT/BBS/2026/001"
                      value={formContractNumber}
                      onChange={(e) => setFormContractNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nilai Kontrak (Rp)</label>
                    <input
                      type="number"
                      placeholder="15000000"
                      value={formContractValue}
                      onChange={(e) => setFormContractValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tanggal Mulai Kontrak</label>
                    <input
                      type="date"
                      value={formContractStartDate}
                      onChange={(e) => setFormContractStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tanggal Akhir Kontrak</label>
                    <input
                      type="date"
                      value={formContractEndDate}
                      onChange={(e) => setFormContractEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Interval Pemeliharaan</label>
                    <select
                      value={formServiceInterval}
                      onChange={(e) => setFormServiceInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                    >
                      <option value={1}>1 Bulan (Bulanan)</option>
                      <option value={3}>3 Bulan (Triwulan)</option>
                      <option value={6}>6 Bulan (Semesteran)</option>
                      <option value={12}>12 Bulan (Tahunan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Jatuh Tempo Servis Berikutnya</label>
                    <input
                      type="date"
                      value={formNextDueDate}
                      onChange={(e) => setFormNextDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Teknisi Penanggung Jawab (PIC)</label>
                    <input
                      type="text"
                      placeholder="Dian (BBS-WH2)"
                      value={formTechnician}
                      onChange={(e) => setFormTechnician(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Catatan Tambahan Kontrak</label>
                    <textarea
                      rows={2}
                      placeholder="Catatan khusus prosedur maintenance..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {editingAsset ? "Simpan Perubahan" : "Tambah Aset Kontrak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CATAT SERVIS SELESAI (LOG SERVICE)               */}
      {/* ======================================================== */}
      {isLogServiceModalOpen && loggingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-950 border-b border-emerald-500/30 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Icons.Wrench className="h-5 w-5 text-emerald-400" />
                  <span>Catat Pelaksanaan Servis Periodic</span>
                </h4>
                <p className="text-xs text-emerald-300 mt-0.5 font-mono">{loggingAsset.assetName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>

            {/* Log Form */}
            <form onSubmit={handleSubmitLogService} className="p-6 space-y-4">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-white/5 text-xs space-y-1">
                <div className="text-slate-400">
                  Klien: <strong className="text-white">{loggingAsset.clientCompany || loggingAsset.clientName}</strong>
                </div>
                <div className="text-slate-400">
                  Nomor Kontrak: <strong className="text-indigo-300 font-mono">{loggingAsset.contractNumber}</strong>
                </div>
                <div className="text-slate-400">
                  Interval Servis: <strong className="text-amber-300">{loggingAsset.serviceIntervalMonths} Bulan</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tanggal Servis Dilakukan *</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Teknisi Pelaksana *</label>
                  <input
                    type="text"
                    required
                    value={logTechnician}
                    onChange={(e) => setLogTechnician(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Kondisi Perangkat Setelah Servis</label>
                <select
                  value={logStatusAfter}
                  onChange={(e) => setLogStatusAfter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                >
                  <option value="Normal">🟢 Normal (Siap Beroperasi Sehat)</option>
                  <option value="Perlu Replacement">🟡 Perlu Replacement Suku Cadang</option>
                  <option value="Troubleshoot Selesai">🔵 Troubleshoot Selesai Perbaikan</option>
                  <option value="Pembersihan & Kalibrasi">✨ Pembersihan & Kalibrasi Rutin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Deskripsi Hasil Inspeksi & Pekerjaan *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Pembersihan debu heatsink, update firmware BIOS v2.4, pengujian beban power supply OK..."
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Suku Cadang Diganti (Jika Ada)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1x RAM DDR4 16GB, Thermal Paste"
                    value={logReplacedParts}
                    onChange={(e) => setLogReplacedParts(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Estimasi Biaya Tambahan (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={logCostEstimate}
                    onChange={(e) => setLogCostEstimate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 leading-normal">
                💡 <strong>Auto-Schedule Magic:</strong> Mengonfirmasi log servis ini akan secara otomatis memperbarui status aset ke 🟢 Normal dan menghitung tanggal jatuh tempo berikutnya secara presisi (+{loggingAsset.serviceIntervalMonths} Bulan).
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsLogServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Check className="h-4 w-4" />
                  <span>Simpan Log & Auto-Update Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SERVICE HISTORY TIMELINE                         */}
      {/* ======================================================== */}
      {isHistoryModalOpen && historyAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Icons.History className="h-5 w-5 text-indigo-400" />
                  <span>Riwayat Pemeliharaan & Inspeksi</span>
                </h4>
                <p className="text-xs text-indigo-300 mt-0.5">{historyAsset.assetName} ({historyAsset.clientCompany || historyAsset.clientName})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>

            {/* Timeline Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(!historyAsset.serviceHistory || historyAsset.serviceHistory.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada log riwayat servis yang tercatat untuk perangkat ini.
                </div>
              ) : (
                <div className="relative border-l-2 border-indigo-500/30 ml-3 space-y-6">
                  {historyAsset.serviceHistory.map((sh, sIdx) => (
                    <div key={sh.id || sIdx} className="relative pl-6">
                      {/* Circle Dot */}
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900" />

                      <div className="p-4 bg-slate-950/80 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Icons.Calendar className="h-3.5 w-3.5 text-indigo-400" />
                            <span>{sh.serviceDate}</span>
                          </span>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            sh.statusAfter === "Normal"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}>
                            {sh.statusAfter}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{sh.description}</p>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-white/5">
                          <span>👨‍🔧 Teknisi: <strong className="text-slate-200">{sh.technician}</strong></span>
                          {sh.replacedParts && <span>🔧 Parts: <strong className="text-amber-300">{sh.replacedParts}</strong></span>}
                          {sh.costEstimate ? <span>💰 Biaya: <strong className="text-emerald-300">{formatRupiah(sh.costEstimate)}</strong></span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SEND REMINDER (WHATSAPP / EMAIL)                 */}
      {/* ======================================================== */}
      {isReminderModalOpen && reminderAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-amber-950 via-slate-950 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
              <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                <Icons.Bell className="h-5 w-5 text-amber-400" />
                <span>Kirim Pengingat Jadwal Servis</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-300 space-y-1">
                <p>Klien: <strong className="text-white">{reminderAsset.clientCompany || reminderAsset.clientName}</strong></p>
                <p>Nomor Telepon: <strong className="text-emerald-300 font-mono">{reminderAsset.clientPhone || "Belum diisi"}</strong></p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Pratinjau Draf Pesan Pengingat (WhatsApp)</label>
                <textarea
                  rows={9}
                  readOnly
                  value={getWhatsAppReminderMessage(reminderAsset)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-emerald-200 leading-relaxed focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getWhatsAppReminderMessage(reminderAsset));
                    showToast("Teks pengingat berhasil disalin ke clipboard!", "success");
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Copy className="h-4 w-4" />
                  <span>Salin Teks</span>
                </button>

                {reminderAsset.clientPhone && (
                  <a
                    href={`https://wa.me/${reminderAsset.clientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(getWhatsAppReminderMessage(reminderAsset))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg"
                  >
                    <Icons.ExternalLink className="h-4 w-4" />
                    <span>Buka WhatsApp Web</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: PRINT / REPORT VIEW MODAL                        */}
      {/* ======================================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl p-6 my-8 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">LAPORAN JADWAL PEMELIHARAAN ASET KONTRAK</h2>
                <p className="text-xs text-slate-500">PT Berkah Bintang Solusindo &bull; Sistem Monitoring Maintenance</p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Printer className="h-4 w-4" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800 text-[11px]">
                    <th className="border border-slate-300 p-2 text-center">No</th>
                    <th className="border border-slate-300 p-2">Pelanggan & Kontrak</th>
                    <th className="border border-slate-300 p-2">Nama Perangkat</th>
                    <th className="border border-slate-300 p-2 text-center">Interval</th>
                    <th className="border border-slate-300 p-2 text-center">Jatuh Tempo</th>
                    <th className="border border-slate-300 p-2 text-center">Status</th>
                    <th className="border border-slate-300 p-2">Teknisi PIC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, i) => {
                    const comp = getComputedStatus(asset);
                    return (
                      <tr key={asset.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-2 text-center font-bold">{i + 1}</td>
                        <td className="border border-slate-300 p-2">
                          <div className="font-bold">{asset.clientCompany || asset.clientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{asset.contractNumber}</div>
                        </td>
                        <td className="border border-slate-300 p-2">
                          <div className="font-bold">{asset.assetName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">SN: {asset.serialNumber || "-"}</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">{asset.serviceIntervalMonths} Bln</td>
                        <td className="border border-slate-300 p-2 text-center font-bold font-mono">{asset.nextServiceDueDate}</td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span className="font-bold text-[10px]">{comp.badgeLabel}</span>
                        </td>
                        <td className="border border-slate-300 p-2">{asset.technicianInCharge}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
              <div>Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div>PT Berkah Bintang Solusindo</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
