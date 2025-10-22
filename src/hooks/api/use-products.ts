"use client";

import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types";

// NOTE: This is a placeholder hook. The actual implementation will depend on the API.
// I've created a placeholder product structure in `src/types/index.ts`.

export const useProducts = () => {
  const fetchProducts = async (): Promise<Product[]> => {
    // This is a placeholder. Replace with your actual API call.
    // For now, I will return some mock data.
    const mockData: Product[] = [
        { id: "PROD-001", name: "Wireless Headphones", price: 5000, merchant_stores: { name: "Gadget World" }, imageUrl: "/images/products/headphones.jpg", description: "High-quality wireless headphones.", stock: 10, category: "Electronics" },
        { id: "PROD-002", name: "Leather Jacket", price: 12500, merchant_stores: { name: "Style Boutique" }, imageUrl: "/images/products/jacket.jpg", description: "Stylish leather jacket.", stock: 5, category: "Fashion" },
        { id: "PROD-003", name: "Coffee Maker", price: 3500, merchant_stores: { name: "Home Appliances" }, imageUrl: "/images/products/coffee-maker.jpg", description: "Automatic coffee maker.", stock: 15, category: "Home Goods" },
        { id: "PROD-004", name: "Smart Watch", price: 8000, merchant_stores: { name: "Gadget World" }, imageUrl: "/images/products/smart-watch.jpg", description: "Feature-rich smart watch.", stock: 8, category: "Electronics" },
    ]
    return mockData;
  };

  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
};
