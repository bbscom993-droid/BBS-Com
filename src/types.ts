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
  description: string;
  estimatedPriceRange: string;
  specifications: string[];
  icon: string;
  image?: string;
  serialNumber?: string;
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

