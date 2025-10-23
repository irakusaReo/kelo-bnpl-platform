
import { NextResponse } from 'next/server';
import products from '@/lib/dummy-data/products.json';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const product = products.find((p) => p.id === productId);

  if (product) {
    return NextResponse.json(product);
  } else {
    return new NextResponse(JSON.stringify({ message: "Product not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
