import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthOptions } from '@/lib/auth/config'

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions())

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  const goBackendUrl = new URL(`http://localhost:8080/api/v1/merchant/analytics`)

  if (startDate) {
    goBackendUrl.searchParams.append('start_date', startDate)
  }
  if (endDate) {
    goBackendUrl.searchParams.append('end_date', endDate)
  }

  const url = goBackendUrl.toString()

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.error || 'Failed to fetch analytics' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
