import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  try {
    const authOptions = getAuthOptions()
    const session = await getServerSession(authOptions);
    const token = session?.accessToken;

    const backendUrl = `http://localhost:8080/api/v1/stores`;

    const authHeader = `Bearer ${token}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
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