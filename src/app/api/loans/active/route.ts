import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get active loans logic will be implemented here
    return NextResponse.json({ 
      success: true, 
      message: 'Get active loans',
      data: [] 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get active loans' },
      { status: 400 }
    )
  }
}