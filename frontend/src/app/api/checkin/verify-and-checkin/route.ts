import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// POST /api/checkin/verify-and-checkin - Verify existing user ID and check them in
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists in users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User ID not found. Please check your ID or register as a new user.' },
        { status: 404 }
      )
    }

    // Check if user is already checked in
    const { data: existingCheckin } = await supabaseAdmin
      .from('active_checkins')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingCheckin) {
      return NextResponse.json(
        { message: 'User is already checked in' },
        { status: 400 }
      )
    }

    // Check in the existing user
    const checkedInAt = new Date().toISOString()
    const { error: checkinError } = await supabaseAdmin
      .from('active_checkins')
      .insert({
        user_id: userId,
        checked_in_at: checkedInAt
      })

    if (checkinError) {
      console.error('Error checking in user:', checkinError)
      return NextResponse.json(
        { error: 'Failed to check in user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully checked in',
      userId,
      firstName: user.first_name,
      lastName: user.last_name,
      checkedInAt
    })

  } catch (error) {
    console.error('Error in verify-and-checkin API:', error)
    return NextResponse.json(
      { error: 'Failed to verify and check in user' },
      { status: 500 }
    )
  }
}