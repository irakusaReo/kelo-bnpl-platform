import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthOptions } from '@/lib/auth/config'

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

export async function GET(req: NextRequest) {
  const authOptions = getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(`${GO_BACKEND_URL}/v1/admin/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch analytics' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
