import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifyUserSession } from '@/lib/auth-session'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiter: 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

// POST /api/checkin/confirm-checkin - Check in a verified user
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await limiter.check(null, 10, ip)
    } catch {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Auth Check
    const session = await verifyUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login to check in.' }, { status: 401 });
    }

    const { userId } = session; // Use trusted ID from session

    // Check if user is already checked in (using plain text ID in active_checkins)
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

    // Check in the user
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
      checkedInAt
    })

  } catch (error) {
    console.error('Error in confirm-checkin API:', error)
    return NextResponse.json(
      { error: 'Failed to check in user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}