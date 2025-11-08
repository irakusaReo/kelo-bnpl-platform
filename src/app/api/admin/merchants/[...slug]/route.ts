import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthOptions } from '@/lib/auth/config'

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

// CRITICAL: Next.js 15 requires Promise
type RouteContext = {
  params: Promise<{ slug: string[] }>
}

async function handleMerchantAction(
  req: NextRequest,
  context: RouteContext
) {
  const { slug } = await context.params // MUST await params in Next.js 15
  const authOptions = getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const [merchantId, action] = slug
  if (!merchantId || !action) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  }

  const url = `${GO_BACKEND_URL}/v1/admin/merchants/${merchantId}/${action}`

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || `Failed to ${action} merchant` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error performing merchant action ${action}:`, error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return handleMerchantAction(req, context)
}

export async function POST(req: NextRequest, context: RouteContext) {
  return handleMerchantAction(req, context)
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return handleMerchantAction(req, context)
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return handleMerchantAction(req, context)
}
