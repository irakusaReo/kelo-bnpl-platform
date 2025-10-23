
'use client'

import PageHeader from "@/components/layout/page-header";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/utils/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Shopping Cart"
        description="Review and manage the items in your cart."
      />

      {items.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-2">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/marketplace">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-12 items-start">
          <div className="md:col-span-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden">
                           <Image
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="object-cover"
                            fill
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </TableCell>
                     <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:col-span-1 space-y-6">
             <div className="border rounded-lg p-6">
               <h3 className="text-lg font-semibold">Order Summary</h3>
               <div className="mt-4 space-y-2">
                 <div className="flex justify-between">
                   <span>Subtotal</span>
                   <span>{formatCurrency(totalPrice)}</span>
                 </div>
                 <div className="flex justify-between text-muted-foreground">
                   <span>Shipping</span>
                   <span>Calculated at checkout</span>
                 </div>
               </div>
               <div className="mt-6 pt-4 border-t">
                 <div className="flex justify-between font-bold text-lg">
                   <span>Total</span>
                   <span>{formatCurrency(totalPrice)}</span>
                 </div>
               </div>
             </div>
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
