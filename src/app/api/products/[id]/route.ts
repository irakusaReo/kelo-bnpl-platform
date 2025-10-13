import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This route acts as a proxy to the Go backend for a single product.
const BACKEND_URL = 'http://localhost:8080/products';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return new NextResponse('Product ID is required', { status: 400 });
  }

  const url = `${BACKEND_URL}/${id}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new NextResponse(errorData, { status: response.status, statusText: response.statusText });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`API route error for product ${id}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
