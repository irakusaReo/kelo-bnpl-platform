import { NextRequest, NextResponse } from "next/server";

// CRITICAL: Next.js 15 requires Promise
type RouteContext = {
  params: Promise<{ store_id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { store_id } = await context.params // MUST await params in Next.js 15
    const backendUrl = `http://localhost:8080/v1/stores/${store_id}/products`

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        // Forward any other necessary headers, like Authorization
        Authorization: request.headers.get("Authorization") || "",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
