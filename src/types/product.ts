export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  merchant_store: {
    id: string;
    store_name: string;
  };
}
