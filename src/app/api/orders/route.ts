import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth/config';

// This route acts as a proxy to the Go backend for creating orders.
const BACKEND_URL = 'http://localhost:8080/orders';

export async function POST(request: NextRequest) {
  const authOptions = getAuthOptions()
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();

    // The Go backend expects the user ID to be set, but we get it from the session for security.
    const orderPayload = {
      ...body,
      userId: session.user.id,
    };

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
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
