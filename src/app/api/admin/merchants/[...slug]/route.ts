import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthOptions } from '@/lib/auth/config'

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

async function handleMerchantAction(
  req: NextRequest,
  params: { slug: string[] }
) {
  const authOptions = getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const [merchantId, action] = params.slug
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

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleMerchantAction(req, params)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleMerchantAction(req, params)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleMerchantAction(req, params)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleMerchantAction(req, params)
}
