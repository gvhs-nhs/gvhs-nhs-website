import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifyUserSession } from '@/lib/auth-session'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiter: 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

// POST /api/checkin/verify-user - Verify existing user ID
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
      return NextResponse.json({ error: 'Unauthorized. Please login first.' }, { status: 401 });
    }

    const { userId } = session;

    // Check if user is already checked in
    const { data: existingCheckin } = await supabaseAdmin
      .from('active_checkins')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingCheckin) {
      return NextResponse.json(
        {
          message: 'User is already checked in',
          alreadyCheckedIn: true,
          checkedInAt: existingCheckin.checked_in_at
        },
        { status: 400 }
      )
    }

    // User exists and is not checked in
    return NextResponse.json({
      message: 'User verified successfully',
      userId,
      verified: true
    })

  } catch (error) {
    console.error('Error in verify-user API:', error)
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    )
  }
}