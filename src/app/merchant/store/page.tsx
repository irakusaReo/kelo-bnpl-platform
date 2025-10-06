"use client";

import { useState, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StoreProfileForm } from "@/components/merchant/StoreProfileForm";
import { ProductList, Product } from "@/components/merchant/ProductList";
import { ProductForm } from "@/components/merchant/ProductForm";
import { toast } from "@/hooks/use-toast";
import { getStores, getProducts, createProduct, updateProduct, deleteProduct } from "@/services/merchant";
import { ProductPayload } from "@/types/merchant";
import { Skeleton } from "@/components/ui/skeleton";

function MerchantStoreManager({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const { data: products = [], isLoading: isLoadingProducts, isError: isErrorProducts } = useQuery<Product[]>({
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

  const productFormInitialData = editingProduct ? {
    name: editingProduct.name,
    description: editingProduct.description,
    price: editingProduct.price,
    image_url: editingProduct.image_url,
  } : undefined;

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={productFormInitialData}
            onSubmit={handleFormSubmit}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Store Profile</CardTitle>
          <CardDescription>Update your public store name and logo.</CardDescription>
        </CardHeader>
        <CardContent>
          <StoreProfileForm storeId={storeId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage the products available in your store.</CardDescription>
          </div>
          <Button onClick={handleAddProduct} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isErrorProducts ? (
            <p className="text-destructive">Failed to load products.</p>
          ) : (
            <ProductList
              products={products}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              isDeleting={deleteMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function MerchantStorePage() {
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
            <h1 className="text-3xl font-bold">My Store</h1>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  if (!merchantStore) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Store</h1>
            <p>No store found for your account. Please create a store first.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Store</h1>
      <MerchantStoreManager storeId={merchantStore.id} />
    </div>
  );
}