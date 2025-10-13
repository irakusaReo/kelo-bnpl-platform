import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This route acts as a proxy to the Go backend.
// In a real production environment, this URL would be an environment variable.
const BACKEND_URL = 'http://localhost:8080/stores';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let url = BACKEND_URL;
  if (category) {
    url += `?category=${category}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Forward the error response from the backend
      const errorData = await response.text();
      return new NextResponse(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
