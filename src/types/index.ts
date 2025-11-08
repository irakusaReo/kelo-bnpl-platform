
// Core application types, aligned with the Prisma schema and Go models.

export type IntegrationType = 'INTEGRATED' | 'PARTNER';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface MerchantStore {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  status: string;
  integrationType: IntegrationType;
  externalUrl?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  storeId: string;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: string; // e.g., PENDING, COMPLETED, FAILED
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number; // Price at the time of purchase
  createdAt: string;
}

export interface Repayment {
  id: string;
  amount: number;
  date: Date;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  term: number;
  status: 'pending' | 'active' | 'paid' | 'defaulted';
  applicationDate: Date;
  approvalDate: Date | null;
  dueDate: Date;
  repayments: Repayment[];
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  method: 'M-Pesa' | 'Bank Transfer' | 'Crypto';
  status: 'completed' | 'pending' | 'failed';
}
