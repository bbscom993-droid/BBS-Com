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
}

export interface RFQItem {
  name: string;
  quantity: number;
  description?: string;
}

export type RFQStatus = 'pending' | 'processing' | 'quoted' | 'cancelled' | 'completed';

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
  clientCategory: 'perusahaan' | 'pemerintah' | 'pendidikan' | 'umkm';
  items: RFQItem[];
  customRequirements?: string;
  notes?: string;
  generatedQuotationId?: string;
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
  headerLogoType?: 'text' | 'image';
  logoImageUrl?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export interface ConsultMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
