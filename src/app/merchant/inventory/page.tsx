"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getProducts, getStores, updateProductStock } from "@/services/merchant";
import { Product } from "@/types/merchant";
import { Skeleton } from "@/components/ui/skeleton";

function InventoryManager({ storeId }: { storeId: string }) {
  const [stockUpdates, setStockUpdates] = useState<{ [productId: string]: number }>({});

  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products", storeId],
    queryFn: () => getProducts(storeId),
    enabled: !!storeId,
  });

  const queryClient = useQueryClient();
  const updateStockMutation = useMutation({
    mutationFn: (data: { productId: string; stock: number }) =>
      updateProductStock(data.productId, data.stock),
    onSuccess: () => {
      toast({ title: "Success", description: "Stock updated." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update stock. " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleStockChange = (productId: string, value: string) => {
    const stock = parseInt(value, 10);
    setStockUpdates({ ...stockUpdates, [productId]: isNaN(stock) ? 0 : stock });
  };

  const handleUpdateStock = (productId: string) => {
    const stock = stockUpdates[productId];
    if (stock !== undefined) {
      updateStockMutation.mutate({ productId, stock });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-destructive">Failed to load products.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Stock</CardTitle>
          <CardDescription>Update the stock levels for your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>New Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={product.stock}
                      onChange={(e) => handleStockChange(product.id, e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStock(product.id)}
                      disabled={updateStockMutation.isPending}
                    >
                      {updateStockMutation.isPending ? "Updating..." : "Update"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: stores, isLoading: isLoadingStores } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
    enabled: !!user,
  });

  const merchantStore = useMemo(() => {
    if (!stores || !user) return undefined;
    return stores.find(store => store.merchant_id === user.id);
  }, [stores, user]);

  if (isLoadingUser || isLoadingStores) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!merchantStore) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p>No store found for your account. Please create a store first.</p>
      </div>
    );
  }

  return <InventoryManager storeId={merchantStore.id} />;
}
