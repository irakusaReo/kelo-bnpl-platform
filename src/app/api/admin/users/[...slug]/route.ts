import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthOptions } from '@/lib/auth/config'

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

// CRITICAL: Next.js 15 requires Promise
type RouteContext = {
  params: Promise<{ slug: string[] }>
}

async function handleUserAction(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params // MUST await params in Next.js 15
  const authOptions = getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const [userId, action] = slug
  if (!userId || !action) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  }

  const url = `${GO_BACKEND_URL}/v1/admin/users/${userId}/${action}`
  let body = null
  if (action === 'role') {
    body = await req.json()
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: body ? JSON.stringify(body) : null,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || `Failed to ${action} user` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error performing user action ${action}:`, error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return handleUserAction(req, context)
}

export async function POST(req: NextRequest, context: RouteContext) {
  return handleUserAction(req, context)
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return handleUserAction(req, context)
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return handleUserAction(req, context)
}
