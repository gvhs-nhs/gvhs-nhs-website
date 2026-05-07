import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { decryptData } from '@/lib/encryption'

// POST /api/checkin - Check in user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
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

    // Look up user's name
    let username = userId;
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('user_id, first_name, last_name')

    if (allUsers) {
      for (const u of allUsers) {
        try {
          if (decryptData(u.user_id) === userId) {
            username = `${u.first_name} ${u.last_name}`.trim();
            break;
          }
        } catch { continue; }
      }
    }

    // Check in the user
    const checkedInAt = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from('active_checkins')
      .insert({
        user_id: userId,
        username,
        checked_in_at: checkedInAt
      })

    if (error) {
      console.error('Error checking in user:', error)
      return NextResponse.json(
        { error: 'Failed to check in user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully checked in',
      userId,
      checkedInAt
    })

  } catch (error) {
    console.error('Error in checkin API:', error)
    return NextResponse.json(
      { error: 'Failed to check in user' },
      { status: 500 }
    )
  }
}