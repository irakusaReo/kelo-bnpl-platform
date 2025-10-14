"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "@/components/merchant/ProductForm";
import { toast } from "@/hooks/use-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/services/merchant";
import { Product, ProductPayload } from "@/types/merchant";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { getStores } from "@/services/merchant";
import { useMemo } from "react";

function ProductManager({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products", storeId],
    queryFn: () => getProducts(storeId),
    enabled: !!storeId,
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductPayload) => createProduct(storeId, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Product created." });
      queryClient.invalidateQueries({ queryKey: ["products", storeId] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create product. " + error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { productId: string; payload: ProductPayload }) => updateProduct(data.productId, data.payload),
    onSuccess: () => {
      toast({ title: "Success", description: "Product updated." });
      queryClient.invalidateQueries({ queryKey: ["products", storeId] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update product. " + error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      toast({ title: "Success", description: "Product deleted." });
      queryClient.invalidateQueries({ queryKey: ["products", storeId] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete product. " + error.message, variant: "destructive" });
    },
  });

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    deleteMutation.mutate(productId);
  };

  const handleFormSubmit = (data: ProductPayload) => {
    if (editingProduct) {
      updateMutation.mutate({ productId: editingProduct.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return <p className="text-destructive">Failed to load products.</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddProduct}>Add Product</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleFormSubmit}
            product={editingProduct}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-2"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
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

export default function ProductsPage() {
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
    return <Skeleton className="h-64 w-full" />;
  }

  if (!merchantStore) {
    return <p>No store found for your account. Please create a store first.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>
      <ProductManager storeId={merchantStore.id} />
    </div>
  );
}
