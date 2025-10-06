import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { product_id: string } }
) {
  try {
    const backendUrl = `http://localhost:8080/v1/products/${params.product_id}`;
    const body = await request.json();

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(body),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { product_id: string } }
) {
  try {
    const backendUrl = `http://localhost:8080/v1/products/${params.product_id}`;

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    });

    if (response.status === 204 || response.status === 200) { // 200 for message
        return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}