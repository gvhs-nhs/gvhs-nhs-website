import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { verifyUserSession } from '@/lib/auth-session'
import { decryptData } from '@/lib/encryption'
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

    const { userId } = session;

    // Check if user is already checked in
    const { data: existingCheckin, error: selectError } = await supabaseAdmin
      .from('active_checkins')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (selectError) {
      return NextResponse.json(
        { error: 'DB select failed', detail: selectError.message },
        { status: 500 }
      )
    }

    if (existingCheckin) {
      return NextResponse.json(
        { message: 'User is already checked in' },
        { status: 400 }
      )
    }

    // Look up user's name from the users table
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
    const { error: checkinError } = await supabaseAdmin
      .from('active_checkins')
      .insert({
        user_id: userId,
        username,
        checked_in_at: checkedInAt
      })

    if (checkinError) {
      return NextResponse.json(
        { error: 'Insert failed', detail: checkinError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully checked in',
      userId,
      checkedInAt
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Unhandled exception', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}