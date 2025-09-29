// API-related types

import { BaseEntity, PaginationParams, PaginatedResponse } from "./common";

export interface User extends BaseEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profile?: UserProfile;
  preferences?: UserPreferences;
  lastLoginAt?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export type UserRole = "customer" | "merchant" | "admin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface UserProfile {
  avatar?: string;
  dateOfBirth?: string;
  nationality?: string;
  idNumber?: string;
  idDocument?: FileUpload;
  address?: Address;
  occupation?: string;
  monthlyIncome?: number;
  employerName?: string;
  workEmail?: string;
  workPhone?: string;
}

export interface Merchant extends BaseEntity {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  registrationNumber: string;
  taxId?: string;
  description?: string;
  website?: string;
  contactInfo: ContactInfo;
  businessAddress: Address;
  bankAccounts: BankAccount[];
  integrations: MerchantIntegration[];
  settings: MerchantSettings;
  status: MerchantStatus;
  verificationStatus: VerificationStatus;
}

export type BusinessType = "retail" | "ecommerce" | "service" | "restaurant" | "other";
export type MerchantStatus = "active" | "inactive" | "suspended" | "pending";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  isDefault: boolean;
  status: "active" | "inactive";
}

export interface MerchantIntegration {
  id: string;
  platform: IntegrationPlatform;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  settings: Record<string, any>;
  lastSyncAt?: string;
}

export type IntegrationPlatform = "shopify" | "woocommerce" | "magento" | "custom" | "api";

export interface MerchantSettings {
  currency: string;
  maxLoanAmount: number;
  minLoanAmount: number;
  interestRate: number;
  maxDuration: number;
  minDuration: number;
  autoApproval: boolean;
  requireVerification: boolean;
  webhookSecret?: string;
}

export interface LoanApplication extends BaseEntity {
  id: string;
  customerId: string;
  merchantId: string;
  amount: number;
  duration: number;
  interestRate: number;
  purpose: string;
  status: LoanStatus;
  creditScore: number;
  riskScore: number;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  disbursedAt?: string;
  completedAt?: string;
  termsAccepted: boolean;
  documents: LoanDocument[];
  payments: LoanPayment[];
}

export type LoanStatus = "pending" | "approved" | "rejected" | "disbursed" | "active" | "completed" | "defaulted";

export interface LoanDocument {
  id: string;
  type: DocumentType;
  file: FileUpload;
  status: DocumentStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export type DocumentType = "id_proof" | "income_proof" | "address_proof" | "business_proof" | "other";
export type DocumentStatus = "pending" | "verified" | "rejected";

export interface LoanPayment extends BaseEntity {
  id: string;
  loanId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  lateFee?: number;
}

export type PaymentStatus = "pending" | "paid" | "overdue" | "failed";
export type PaymentMethod = "mpesa" | "bank_transfer" | "crypto" | "wallet";

export interface PaymentRequest {
  id: string;
  customerId: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  expiresAt: string;
  status: PaymentRequestStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  paidAt?: string;
}

export type PaymentRequestStatus = "pending" | "paid" | "expired" | "cancelled";

export interface CreditScore {
  id: string;
  userId: string;
  score: number;
  grade: CreditGrade;
  factors: CreditFactor[];
  lastUpdated: string;
  nextReviewDate: string;
}

export type CreditGrade = "A" | "B" | "C" | "D" | "E" | "F";
export type CreditFactor = "payment_history" | "credit_utilization" | "credit_age" | "credit_mix" | "new_credit";

export interface Notification extends BaseEntity {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
}

export type NotificationType = "loan_approved" | "loan_rejected" | "payment_due" | "payment_overdue" | "system" | "marketing";

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface CreateLoanRequest {
  amount: number;
  duration: number;
  purpose: string;
  merchantId: string;
}

export interface MakePaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profile?: Partial<UserProfile>;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

export interface DashboardMetrics {
  totalLoans: number;
  activeLoans: number;
  totalRevenue: number;
  averageLoanAmount: number;
  defaultRate: number;
  customerCount: number;
  merchantCount: number;
}