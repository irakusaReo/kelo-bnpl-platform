"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Product } from "@/types/merchant";

export { type Product }; // Re-export the type

export function ProductList({
  products,
  onEdit,
  onDelete,
  isDeleting,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  isDeleting?: boolean;
}) {
  return (
    <Table>
      {products.length === 0 && <TableCaption>You have no products yet.</TableCaption>}
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
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>KES {product.price.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="ml-2"
                onClick={() => onDelete(product.id)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}