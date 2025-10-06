export interface MerchantStore {
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