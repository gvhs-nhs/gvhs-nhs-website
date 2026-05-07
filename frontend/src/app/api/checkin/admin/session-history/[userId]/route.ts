import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// GET /api/checkin/admin/session-history/[userId] - Get session history for a specific user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const { data: sessions, error } = await supabaseAdmin
      .from('session_history')
      .select('id, user_id, checked_in_at, checked_out_at, duration_ms, forced_by_admin, created_at')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })

    if (error) {
      console.error('Error getting session history:', error)
      return NextResponse.json(
        { error: 'Failed to get session history' },
        { status: 500 }
      )
    }

    return NextResponse.json(sessions || [])

  } catch (error) {
    console.error('Error in session history API:', error)
    return NextResponse.json(
      { error: 'Failed to get session history' },
      { status: 500 }
    )
  }
}