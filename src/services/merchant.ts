import api, { fetcher, poster } from "./api";
import { MerchantStore, Product, ProductPayload, StorePayload } from "@/types/merchant";

// == Store API ==

export const getStores = (): Promise<MerchantStore[]> => {
  return fetcher(`/api/merchant/stores`);
};

export const getStore = (storeId: string): Promise<MerchantStore> => {
  return fetcher(`/api/merchant/stores/${storeId}`);
};

export const updateStore = (
  storeId: string,
  data: StorePayload
): Promise<MerchantStore> => {
  return api.put(`/api/merchant/stores/${storeId}`, data);
};

// == Product API ==

export const getProducts = (storeId: string): Promise<Product[]> => {
  return fetcher(`/api/merchant/stores/${storeId}/products`);
};

export const createProduct = (
  storeId: string,
  data: ProductPayload
): Promise<Product> => {
  return poster("/api/products", { ...data, store_id: storeId });
};

export const updateProduct = (
  productId: string,
  data: ProductPayload
): Promise<Product> => {
  return api.put(`/api/products/${productId}`, data);
};

export const deleteProduct = (productId: string): Promise<void> => {
  return api.delete(`/api/products/${productId}`);
};