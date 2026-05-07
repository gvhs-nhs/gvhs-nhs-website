import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

interface CleanupResults {
  before: Record<string, number>;
  after: Record<string, number>;
  deleted: Record<string, number>;
  errors: string[];
}

// POST /api/admin/cleanup-orphaned-data - Clean up orphaned records where user no longer exists
export async function POST(_request: NextRequest) {
  try {

    const cleanupResults: CleanupResults = {
      before: {},
      after: {},
      deleted: {},
      errors: []
    }

    // First, get count of records before cleanup
    const beforeCounts = await Promise.all([
      supabase.from('users').select('user_id', { count: 'exact' }),
      supabase.from('session_history').select('id', { count: 'exact' }),
      supabase.from('checkin_sessions').select('id', { count: 'exact' }),
      supabase.from('opportunity_suggestions').select('id', { count: 'exact' }),
      supabase.from('school_visit_signups').select('id', { count: 'exact' }),
      supabase.from('active_checkins').select('user_id', { count: 'exact' })
    ])

    cleanupResults.before = {
      users: beforeCounts[0].count || 0,
      session_history: beforeCounts[1].count || 0,
      checkin_sessions: beforeCounts[2].count || 0,
      opportunity_suggestions: beforeCounts[3].count || 0,
      school_visit_signups: beforeCounts[4].count || 0,
      active_checkins: beforeCounts[5].count || 0
    }


    // Get all valid user IDs
    const { data: validUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('user_id')

    if (usersError) {
      throw new Error(`Failed to get users: ${usersError.message}`)
    }

    const validUserIds = validUsers?.map(u => u.user_id) || []

    // Clean up session_history
    const { data: orphanedSessions, error: sessionHistoryError } = await supabaseAdmin
      .from('session_history')
      .select('user_id')
      .not('user_id', 'in', `(${validUserIds.map(id => `"${id}"`).join(',')})`)

    if (sessionHistoryError) {
      cleanupResults.errors.push(`session_history query error: ${sessionHistoryError.message}`)
    } else {
      const orphanedSessionIds = orphanedSessions?.map(s => s.user_id) || []
      if (orphanedSessionIds.length > 0) {
        const { error: deleteSessionError } = await supabaseAdmin
          .from('session_history')
          .delete()
          .in('user_id', orphanedSessionIds)

        if (deleteSessionError) {
          cleanupResults.errors.push(`session_history delete error: ${deleteSessionError.message}`)
        } else {
          cleanupResults.deleted.session_history = orphanedSessionIds.length
        }
      }
    }

    // Clean up checkin_sessions
    const { data: orphanedCheckins, error: checkinSessionsError } = await supabaseAdmin
      .from('checkin_sessions')
      .select('user_id')
      .not('user_id', 'in', `(${validUserIds.map(id => `"${id}"`).join(',')})`)

    if (checkinSessionsError) {
      cleanupResults.errors.push(`checkin_sessions query error: ${checkinSessionsError.message}`)
    } else {
      const orphanedCheckinIds = orphanedCheckins?.map(s => s.user_id) || []
      if (orphanedCheckinIds.length > 0) {
        const { error: deleteCheckinError } = await supabaseAdmin
          .from('checkin_sessions')
          .delete()
          .in('user_id', orphanedCheckinIds)

        if (deleteCheckinError) {
          cleanupResults.errors.push(`checkin_sessions delete error: ${deleteCheckinError.message}`)
        } else {
          cleanupResults.deleted.checkin_sessions = orphanedCheckinIds.length
        }
      }
    }

    // Clean up opportunity_suggestions
    const { data: orphanedSuggestions, error: suggestionsError } = await supabaseAdmin
      .from('opportunity_suggestions')
      .select('nhs_user_id')
      .not('nhs_user_id', 'in', `(${validUserIds.map(id => `"${id}"`).join(',')})`)

    if (suggestionsError) {
      cleanupResults.errors.push(`opportunity_suggestions query error: ${suggestionsError.message}`)
    } else {
      const orphanedSuggestionIds = orphanedSuggestions?.map(s => s.nhs_user_id) || []
      if (orphanedSuggestionIds.length > 0) {
        const { error: deleteSuggestionsError } = await supabaseAdmin
          .from('opportunity_suggestions')
          .delete()
          .in('nhs_user_id', orphanedSuggestionIds)

        if (deleteSuggestionsError) {
          cleanupResults.errors.push(`opportunity_suggestions delete error: ${deleteSuggestionsError.message}`)
        } else {
          cleanupResults.deleted.opportunity_suggestions = orphanedSuggestionIds.length
        }
      }
    }

    // Clean up school_visit_signups
    const { data: orphanedVisits, error: visitsError } = await supabaseAdmin
      .from('school_visit_signups')
      .select('nhs_user_id')
      .not('nhs_user_id', 'in', `(${validUserIds.map(id => `"${id}"`).join(',')})`)

    if (visitsError) {
      cleanupResults.errors.push(`school_visit_signups query error: ${visitsError.message}`)
    } else {
      const orphanedVisitIds = orphanedVisits?.map(s => s.nhs_user_id) || []
      if (orphanedVisitIds.length > 0) {
        const { error: deleteVisitsError } = await supabaseAdmin
          .from('school_visit_signups')
          .delete()
          .in('nhs_user_id', orphanedVisitIds)

        if (deleteVisitsError) {
          cleanupResults.errors.push(`school_visit_signups delete error: ${deleteVisitsError.message}`)
        } else {
          cleanupResults.deleted.school_visit_signups = orphanedVisitIds.length
        }
      }
    }

    // Clean up active_checkins
    const { data: orphanedActive, error: activeError } = await supabaseAdmin
      .from('active_checkins')
      .select('user_id')
      .not('user_id', 'in', `(${validUserIds.map(id => `"${id}"`).join(',')})`)

    if (activeError) {
      cleanupResults.errors.push(`active_checkins query error: ${activeError.message}`)
    } else {
      const orphanedActiveIds = orphanedActive?.map(s => s.user_id) || []
      if (orphanedActiveIds.length > 0) {
        const { error: deleteActiveError } = await supabaseAdmin
          .from('active_checkins')
          .delete()
          .in('user_id', orphanedActiveIds)

        if (deleteActiveError) {
          cleanupResults.errors.push(`active_checkins delete error: ${deleteActiveError.message}`)
        } else {
          cleanupResults.deleted.active_checkins = orphanedActiveIds.length
        }
      }
    }

    // Get count of records after cleanup
    const afterCounts = await Promise.all([
      supabase.from('users').select('user_id', { count: 'exact' }),
      supabase.from('session_history').select('id', { count: 'exact' }),
      supabase.from('checkin_sessions').select('id', { count: 'exact' }),
      supabase.from('opportunity_suggestions').select('id', { count: 'exact' }),
      supabase.from('school_visit_signups').select('id', { count: 'exact' }),
      supabase.from('active_checkins').select('user_id', { count: 'exact' })
    ])

    cleanupResults.after = {
      users: afterCounts[0].count || 0,
      session_history: afterCounts[1].count || 0,
      checkin_sessions: afterCounts[2].count || 0,
      opportunity_suggestions: afterCounts[3].count || 0,
      school_visit_signups: afterCounts[4].count || 0,
      active_checkins: afterCounts[5].count || 0
    }


    return NextResponse.json({
      message: 'Cleanup completed successfully',
      results: cleanupResults
    })

  } catch (error) {
    console.error('Error in cleanup API:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup orphaned data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}