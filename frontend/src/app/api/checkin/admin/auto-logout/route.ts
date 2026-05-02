import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Automatic logout times in EST (24-hour format)
const AUTO_LOGOUT_TIMES = [
  '07:50', // 7:50 AM
  '08:40', // 8:40 AM
  '09:35', // 9:35 AM
  '10:30', // 10:30 AM
  '11:15', // 11:15 AM
  '11:45', // 11:45 AM
  '12:15', // 12:15 PM
  '12:48', // 12:48 PM
  '13:40', // 1:40 PM
  '14:30', // 2:30 PM
  '17:00'  // 5:00 PM
]

// POST /api/checkin/admin/auto-logout - Automatically log out all users at scheduled times
export async function POST(_request: NextRequest) {
  try {

    // Get current time in EST
    const now = new Date()
    const estTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now)


    // Check if current time matches any auto-logout time
    const shouldLogout = AUTO_LOGOUT_TIMES.includes(estTime)

    if (!shouldLogout) {
      return NextResponse.json({
        message: `No automatic logout scheduled for ${estTime} EST`,
        currentTime: estTime,
        scheduledTimes: AUTO_LOGOUT_TIMES
      })
    }


    // Get all currently checked-in users
    const { data: activeUsers, error: fetchError } = await supabase
      .from('active_checkins')
      .select('user_id, checked_in_at')

    if (fetchError) {
      console.error('Error fetching active users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch active users' },
        { status: 500 }
      )
    }

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        message: `No users to logout at ${estTime} EST`,
        currentTime: estTime,
        loggedOutUsers: []
      })
    }


    const checkedOutUsers = []
    const checkoutTime = new Date().toISOString()

    // Process each active user
    for (const activeUser of activeUsers) {
      try {
        const duration = new Date(checkoutTime).getTime() - new Date(activeUser.checked_in_at).getTime()

        // Create session history record
        const { error: sessionError } = await supabase
          .from('session_history')
          .insert({
            user_id: activeUser.user_id,
            checked_in_at: activeUser.checked_in_at,
            checked_out_at: checkoutTime,
            duration_ms: duration,
            forced_by_admin: true // Mark as automatic system logout
          })

        if (sessionError) {
          console.error(`Error creating session history for user ${activeUser.user_id}:`, sessionError)
          continue
        }

        // Remove from active checkins
        const { error: removeError } = await supabase
          .from('active_checkins')
          .delete()
          .eq('user_id', activeUser.user_id)

        if (removeError) {
          console.error(`Error removing from active checkins for user ${activeUser.user_id}:`, removeError)
          continue
        }

        checkedOutUsers.push({
          user_id: activeUser.user_id,
          checked_in_at: activeUser.checked_in_at,
          checked_out_at: checkoutTime,
          duration: Math.floor(duration / 1000 / 60) // Duration in minutes
        })


      } catch (userError) {
        console.error(`Error processing auto-logout for user ${activeUser.user_id}:`, userError)
      }
    }


    return NextResponse.json({
      message: `Auto-logout completed at ${estTime} EST`,
      currentTime: estTime,
      totalUsers: activeUsers.length,
      successfulLogouts: checkedOutUsers.length,
      loggedOutUsers: checkedOutUsers
    })

  } catch (error) {
    console.error('Error in auto-logout API:', error)
    return NextResponse.json(
      { error: 'Failed to process auto-logout', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET /api/checkin/admin/auto-logout - Get auto-logout schedule information
export async function GET(_request: NextRequest) {
  try {
    // Get current time in EST
    const now = new Date()
    const estTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now)

    // Get next logout time
    const currentMinutes = parseInt(estTime.split(':')[0]) * 60 + parseInt(estTime.split(':')[1])
    let nextLogoutTime = null

    for (const time of AUTO_LOGOUT_TIMES) {
      const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
      if (timeMinutes > currentMinutes) {
        nextLogoutTime = time
        break
      }
    }

    // If no time today, next is first time tomorrow
    if (!nextLogoutTime) {
      nextLogoutTime = AUTO_LOGOUT_TIMES[0] + ' (tomorrow)'
    }

    return NextResponse.json({
      currentTime: estTime,
      scheduledTimes: AUTO_LOGOUT_TIMES,
      nextLogoutTime: nextLogoutTime,
      isLogoutTime: AUTO_LOGOUT_TIMES.includes(estTime)
    })

  } catch (error) {
    console.error('Error in auto-logout info API:', error)
    return NextResponse.json(
      { error: 'Failed to get auto-logout info' },
      { status: 500 }
    )
  }
}