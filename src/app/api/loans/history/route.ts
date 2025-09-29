import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get loan history logic will be implemented here
    return NextResponse.json({ 
      success: true, 
      message: 'Get loan history',
      data: [] 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get loan history' },
      { status: 400 }
    )
  }
}