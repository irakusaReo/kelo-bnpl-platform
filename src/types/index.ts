// Core application types, aligned with the Prisma schema and Go models.

export type IntegrationType = 'INTEGRATED' | 'PARTNER';

export interface MerchantStore {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
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
