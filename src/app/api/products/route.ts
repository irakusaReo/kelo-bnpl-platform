
import { NextResponse } from 'next/server';
import products from '@/lib/dummy-data/products.json';

export async function GET() {
  // In a real application, you'd fetch this from a database.
  // Here, we're just returning the static JSON file.
  return NextResponse.json(products);
}
