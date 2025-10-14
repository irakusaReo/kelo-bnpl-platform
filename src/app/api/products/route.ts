import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth/config';

// This route acts as a proxy to the Go backend for products.
const BACKEND_URL = 'http://localhost:8080/products';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let url = BACKEND_URL;
  if (category) {
    url += `?category=${category}`;
  }

  try {
    const session = await getServerSession(getAuthOptions());
    // Fetch from the Go backend
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.accessToken}`,
      },
      // Using no-cache to ensure fresh data during development
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new NextResponse(errorData, { status: response.status, statusText: response.statusText });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
	try {
	  const session = await getServerSession(getAuthOptions());
	  const body = await request.json();
	  const response = await fetch(BACKEND_URL, {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		  Authorization: `Bearer ${session?.accessToken}`,
		},
		body: JSON.stringify(body),
	  });

	  if (!response.ok) {
		const errorData = await response.text();
		return new NextResponse(errorData, { status: response.status, statusText: response.statusText });
	  }

	  const data = await response.json();
	  return NextResponse.json(data);

	} catch (error) {
	  console.error('API route error:', error);
	  return new NextResponse('Internal Server Error', { status: 500 });
	}
  }
