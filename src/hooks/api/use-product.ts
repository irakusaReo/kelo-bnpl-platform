"use client";

import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types";

// NOTE: This is a placeholder hook. The actual implementation will depend on the API.
// I've created a placeholder product structure in `src/types/index.ts`.

const mockProducts: Product[] = [
    { id: "PROD-001", name: "Wireless Headphones", price: 5000, merchant_stores: { name: "Gadget World" }, imageUrl: "/images/products/headphones.jpg", description: "High-quality wireless headphones.", stock: 10, category: "Electronics", images: [{url: "/images/products/headphones.jpg"}]},
    { id: "PROD-002", name: "Leather Jacket", price: 12500, merchant_stores: { name: "Style Boutique" }, imageUrl: "/images/products/jacket.jpg", description: "Stylish leather jacket.", stock: 5, category: "Fashion", images: [{url: "/images/products/jacket.jpg"}]},
    { id: "PROD-003", name: "Coffee Maker", price: 3500, merchant_stores: { name: "Home Appliances" }, imageUrl: "/images/products/coffee-maker.jpg", description: "Automatic coffee maker.", stock: 15, category: "Home Goods", images: [{url: "/images/products/coffee-maker.jpg"}]},
    { id: "PROD-004", name: "Smart Watch", price: 8000, merchant_stores: { name: "Gadget World" }, imageUrl: "/images/products/smart-watch.jpg", description: "Feature-rich smart watch.", stock: 8, category: "Electronics", images: [{url: "/images/products/smart-watch.jpg"}]},
];

export const useProduct = (productId: string) => {
  const fetchProduct = async (): Promise<Product | null> => {
    // This is a placeholder. Replace with your actual API call.
    // For now, I will find the product in the mock data.
    const product = mockProducts.find((p) => p.id === productId);
    return product || null;
  };

  return useQuery({
    queryKey: ["product", productId],
    queryFn: fetchProduct,
  });
};
