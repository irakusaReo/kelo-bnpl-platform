'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MerchantStore } from '@/types';
import MerchantCard from '@/components/merchant/merchant-card';

const fetchStores = async (category?: string): Promise<MerchantStore[]> => {
  let url = '/api/stores';
  if (category) {
    url += `?category=${category}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};


const StoresPage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>();

  const { data: merchants, isLoading, error } = useQuery<MerchantStore[]>({
    queryKey: ['merchants', selectedCategory],
    queryFn: () => fetchStores(selectedCategory),
  });

  const categories = ['Electronics', 'Travel', 'Education', 'Services', 'Physical Goods'];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">Discover Stores</h1>
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || undefined)}
            className="p-2 border rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p>Loading stores...</p>}
      {error && <p className="text-red-500">Error fetching stores: {error.message}</p>}

      {!isLoading && !error && merchants && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {merchants.map(merchant => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoresPage;
