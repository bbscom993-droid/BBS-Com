export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  vendor?: string;
  description: string;
  estimatedPriceRange: string;
  specifications: string[];
  icon: string;
  image?: string;
  serialNumber?: string;
  sku?: string;
  barcode?: string;
}

export interface RFQItem {
  name: string;
  quantity: number;
  description?: string;
  serialNumber?: string;
}

export type RFQStatus = 'pending' | 'processing' | 'quoted' | 'cancelled' | 'completed';

export interface RFQComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export interface RFQHistoryEntry {
  status: RFQStatus;
  timestamp: string;
  note: string;
  operator?: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  date: string;
  status: RFQStatus;
  companyName?: string;
  clientName: string;
  whatsapp: string;
  email: string;
  address: string;
  clientCategory: 'perusahaan' | 'pemerintah' | 'pendidikan' | 'umkm' | 'retail';
  items: RFQItem[];
  customRequirements?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  generatedQuotationId?: string;
  internalComments?: RFQComment[];
  history?: RFQHistoryEntry[];
}

export interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specification?: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export interface Quotation {
  id: string;
  rfqId: string;
  quotationNumber: string;
  date: string;
  expiryDate: string;
  introductoryText: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  termsAndConditions: string[];
  status: QuotationStatus;
  adminSignature: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  description: string;
  address: string;
  whatsapp: string;
  email: string;
  website: string;
  workingHours: string;
  logoText: string;
  motto?: string;
  headerLogoType?: 'text' | 'image';
  logoImageUrl?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  customRfqStatuses?: Array<{ value: string; label: string; desc: string; color: string }>;
  defaultRfqStatusColors?: Record<string, string>;
}

export interface ConsultMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface QuickTopic {
  id: string;
  emoji: string;
  title: string;
  prompt: string;
  description: string;
  isCustom?: boolean;
}

export interface AdminRfqFilterPreset {
  id: string;
  name: string;
  statuses: string[];
  priority?: string;
  category?: string;
  subCategory?: string;
  search?: string;
  keyword?: string;
  showOnlyMyClients?: boolean;
  startDate?: string;
  endDate?: string;
  isSystem?: boolean;
}

export interface ServiceHistoryItem {
  id: string;
  serviceDate: string;
  technician: string;
  description: string;
  statusAfter: "Normal" | "Perlu Replacement" | "Troubleshoot Selesai" | "Pembersihan & Kalibrasi";
  costEstimate?: number;
  replacedParts?: string;
}

export interface MaintenanceAsset {
  id: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  assetName: string;
  assetCategory: string; // e.g. "Server & Storage", "Networking", "CCTV & Security", "Workstation & PC", "Power & UPS"
  serialNumber?: string;
  sku?: string;
  contractNumber: string; // e.g. "MNT-2026-001"
  contractStartDate: string; // YYYY-MM-DD
  contractEndDate: string; // YYYY-MM-DD
  serviceIntervalMonths: number; // 1, 3, 6, 12
  lastServiceDate?: string; // YYYY-MM-DD
  nextServiceDueDate: string; // YYYY-MM-DD
  status: "active" | "due_soon" | "overdue" | "completed" | "expired";
  technicianInCharge?: string;
  notes?: string;
  locationRack?: string; // e.g. "Gudang Utama - Rak A1" or "Kantor Pusat LT.3 Server Room"
  contractValue?: number;
  serviceHistory: ServiceHistoryItem[];
}

