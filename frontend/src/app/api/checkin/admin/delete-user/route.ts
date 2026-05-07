import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifyAdminSession } from '@/lib/auth-admin'

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdminSession(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (userId.includes('*')) {
      return NextResponse.json(
        { error: 'Invalid user ID format - cannot delete with masked ID' },
        { status: 400 }
      )
    }

    const deletedTables = []

    const { error: activeCheckinsError } = await supabaseAdmin
      .from('active_checkins')
      .delete()
      .eq('user_id', userId)
    if (!activeCheckinsError) deletedTables.push('active_checkins')

    const { error: sessionHistoryError } = await supabaseAdmin
      .from('session_history')
      .delete()
      .eq('user_id', userId)
    if (!sessionHistoryError) deletedTables.push('session_history')

    const { error: checkinSessionsError } = await supabaseAdmin
      .from('checkin_sessions')
      .delete()
      .eq('user_id', userId)
    if (!checkinSessionsError) deletedTables.push('checkin_sessions')

    const { error: suggestionsError } = await supabaseAdmin
      .from('opportunity_suggestions')
      .delete()
      .eq('nhs_user_id', userId)
    if (!suggestionsError) deletedTables.push('opportunity_suggestions')

    const { error: schoolVisitsError } = await supabaseAdmin
      .from('school_visit_signups')
      .delete()
      .eq('nhs_user_id', userId)
    if (!schoolVisitsError) deletedTables.push('school_visit_signups')

    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to delete user from main table' },
        { status: 500 }
      )
    }
    deletedTables.push('users')

    return NextResponse.json({
      message: `User ${userId} has been completely deleted`,
      deletedFrom: deletedTables,
    })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
