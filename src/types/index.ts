export * from './product';

export interface MerchantStore {
    id: string;
    store_name: string;
    // Add other relevant merchant store fields
  }

  export interface OrderItem {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
  }

  export interface Order {
    id: string;
    user_id: string;
    merchant_store_id: string;
    total_amount: number;
    status: string;
    order_items: OrderItem[];
    created_at: string;
  }
