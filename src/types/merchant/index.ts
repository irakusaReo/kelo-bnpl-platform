export interface MerchantStats {
  totalRevenue: number
  activeCustomers: number
  pendingLoans: number
  conversionRate: number
  monthlyGrowth: number
  averageOrderValue: number
  totalTransactions: number
  payoutBalance: number
}

export interface MerchantTransaction {
  id: string
  type: 'sale' | 'refund' | 'payout' | 'fee'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'processing'
  description: string
  customer?: {
    id: string
    name: string
    email: string
  }
  orderId?: string
  createdAt: string
  processedAt?: string
  fee?: number
  netAmount?: number
}

export interface PayoutInfo {
  id: string
  bankAccount: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  mobileMoney?: {
    provider: string
    phoneNumber: string
  }
  cryptoWallet?: {
    address: string
    network: string
  }
  isDefault: boolean
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
}

export interface QRCodePayment {
  id: string
  amount: number
  currency: string
  description: string
  merchantId: string
  status: 'active' | 'expired' | 'paid' | 'cancelled'
  expiresAt: string
  createdAt: string
  paidAt?: string
  customerEmail?: string
  reference: string
}

export interface PayWithKeloConfig {
  merchantId: string
  apiKey: string
  environment: 'sandbox' | 'production'
  currency: string
  callbackUrl?: string
  webhookUrl?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    logo?: string
  }
}

export interface IntegrationSnippet {
  id: string
  type: 'button' | 'widget' | 'api'
  platform: 'web' | 'mobile' | 'pos'
  code: string
  documentation: string
  isActive: boolean
  createdAt: string
  lastUsed?: string
}

export interface SalesData {
  date: string
  revenue: number
  transactions: number
  customers: number
  averageOrderValue: number
}

export interface CustomerAnalytics {
  period: string
  newCustomers: number
  activeCustomers: number
  totalLoans: number
  repaymentRate: number
  averageLoanAmount: number
}export interface MerchantStore {
  id: string;
  name: string;
  logo_url?: string;
  merchant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export type ProductPayload = Omit<Product, "id" | "store_id" | "created_at" | "updated_at">;
export type StorePayload = Omit<MerchantStore, "id" | "merchant_id" | "created_at" | "updated_at">;