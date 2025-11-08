import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/config";

// CRITICAL: Next.js 15 requires Promise
type RouteContext = {
  params: Promise<{ slug: string[] }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(getAuthOptions())
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { slug: slugArray } = await context.params // MUST await params in Next.js 15
  const slug = slugArray.join('/')
  const url = `${process.env.GO_BACKEND_URL}/v1/zk/${slug}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(await request.json()),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to proxy request to Go backend:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
