
import { NextResponse } from 'next/server';
import products from '@/lib/dummy-data/products.json';

// CRITICAL: Next.js 15 requires Promise
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id: productId } = await context.params // MUST await params in Next.js 15
  const product = products.find(p => p.id === productId)

  if (product) {
    return NextResponse.json(product);
  } else {
    return new NextResponse(JSON.stringify({ message: "Product not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
