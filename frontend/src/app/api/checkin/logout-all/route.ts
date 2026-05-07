import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// POST /api/checkin/logout-all - Force logout all users
export async function POST(_request: NextRequest) {
  try {
    // Get all active check-ins to create session records
    const { data: activeCheckins, error: fetchError } = await supabaseAdmin
      .from('active_checkins')
      .select('*')

    if (fetchError) {
      console.error('Error fetching active checkins:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch active users' },
        { status: 500 }
      )
    }

    const checkedOutAt = new Date().toISOString()
    const sessionRecords = []

    // Create session history records for all active users
    for (const checkin of activeCheckins || []) {
      const checkedInAt = new Date(checkin.checked_in_at)
      const sessionDuration = new Date(checkedOutAt).getTime() - checkedInAt.getTime()

      sessionRecords.push({
        user_id: checkin.user_id,
        checked_in_at: checkin.checked_in_at,
        checked_out_at: checkedOutAt,
        duration_ms: sessionDuration,
        forced_by_admin: true
      })
    }

    // Add all sessions to history if there are any
    if (sessionRecords.length > 0) {
      const { error: historyError } = await supabaseAdmin
        .from('session_history')
        .insert(sessionRecords)

      if (historyError) {
        console.error('Error adding session history:', historyError)
        return NextResponse.json(
          { error: 'Failed to record sessions' },
          { status: 500 }
        )
      }
    }

    // Remove all active check-ins
    const { error: deleteError } = await supabaseAdmin
      .from('active_checkins')
      .delete()
      .neq('user_id', '') // Delete all rows (neq with empty string matches all)

    if (deleteError) {
      console.error('Error deleting active checkins:', deleteError)
      return NextResponse.json(
        { error: 'Failed to logout users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'All users logged out successfully',
      totalUsersLoggedOut: sessionRecords.length
    })

  } catch (error) {
    console.error('Error in logout-all API:', error)
    return NextResponse.json(
      { error: 'Failed to logout all users' },
      { status: 500 }
    )
  }
}