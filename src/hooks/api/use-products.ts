
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';

const getProducts = async (): Promise<Product[]> => {
  // In a real app, this would be an API call.
  // For now, we'll fetch from the local dummy data file.
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useProducts = () => {
  return useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });
};
