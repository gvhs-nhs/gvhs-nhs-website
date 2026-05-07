import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/checkin/status/[userId] - Get user status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const { data: activeCheckin } = await supabaseAdmin
      .from('active_checkins')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      isCheckedIn: !!activeCheckin,
      checkedInAt: activeCheckin?.checked_in_at || null
    })

  } catch (error) {
    console.error('Error in status API:', error)
    return NextResponse.json(
      { error: 'Failed to get user status' },
      { status: 500 }
    )
  }
}