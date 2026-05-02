import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const { data: sessions, error } = await supabase
      .from('session_history')
      .select('duration_ms')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({
        userId,
        totalSessions: 0,
        totalMilliseconds: 0,
        totalHours: '0h 0m',
      })
    }

    const validSessions = sessions?.filter(session =>
      session.duration_ms !== null && session.duration_ms !== undefined
    ) || []

    const totalMilliseconds = validSessions.reduce((sum, session) => {
      return sum + (session.duration_ms || 0)
    }, 0)

    const totalHours = totalMilliseconds / (1000 * 60 * 60)
    const hours = Math.floor(totalHours)
    const minutes = Math.floor((totalHours - hours) * 60)

    return NextResponse.json({
      userId,
      totalSessions: validSessions.length,
      totalMilliseconds,
      totalHours: `${hours}h ${minutes}m`,
    })

  } catch (error) {
    return NextResponse.json({
      userId,
      totalSessions: 0,
      totalMilliseconds: 0,
      totalHours: '0h 0m',
    })
  }
}
