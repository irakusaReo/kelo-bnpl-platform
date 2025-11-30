import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthOptions } from '@/lib/auth/config'

const GO_BACKEND_URL = 'http://localhost:8080/api/v1/merchant/payouts'

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions())

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(GO_BACKEND_URL, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch payout history' }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions())

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payoutRequest = {
      ...body,
      merchant_id: session.user.id,
    }

    const response = await fetch(GO_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payoutRequest),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to request payout' }, { status: response.status })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
