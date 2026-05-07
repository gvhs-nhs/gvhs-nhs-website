import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// POST /api/checkin/checkout - Check out user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get the active check-in
    const { data: activeCheckin, error: fetchError } = await supabaseAdmin
      .from('active_checkins')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !activeCheckin) {
      return NextResponse.json(
        { error: 'User not found or not checked in' },
        { status: 404 }
      )
    }

    const checkedOutAt = new Date()
    const checkedInAt = new Date(activeCheckin.checked_in_at)
    const sessionDuration = checkedOutAt.getTime() - checkedInAt.getTime()

    // Add to session history
    const { error: historyError } = await supabaseAdmin
      .from('session_history')
      .insert({
        user_id: userId,
        checked_in_at: activeCheckin.checked_in_at,
        checked_out_at: checkedOutAt.toISOString(),
        duration_ms: sessionDuration
      })

    if (historyError) {
      console.error('Error adding to session history:', historyError)
      return NextResponse.json(
        { error: 'Failed to record session' },
        { status: 500 }
      )
    }

    // Remove from active check-ins
    const { error: removeError } = await supabaseAdmin
      .from('active_checkins')
      .delete()
      .eq('user_id', userId)

    if (removeError) {
      console.error('Error removing active checkin:', removeError)
      return NextResponse.json(
        { error: 'Failed to check out user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully checked out',
      userId,
      duration: sessionDuration
    })

  } catch (error) {
    console.error('Error in checkout API:', error)
    return NextResponse.json(
      { error: 'Failed to check out user' },
      { status: 500 }
    )
  }
}