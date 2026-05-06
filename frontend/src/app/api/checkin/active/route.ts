import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    // Try join query first (requires FK between active_checkins and users)
    const { data: activeUsers, error } = await supabase
      .from('active_checkins')
      .select(`
        user_id,
        checked_in_at,
        users (
          first_name,
          last_name,
          highlighted_subjects
        )
      `)
      .order('checked_in_at', { ascending: false })

    if (!error) {
      return NextResponse.json(activeUsers || [])
    }

    // Fallback: if join fails (missing FK), return checkins without user details
    const { data: checkins } = await supabase
      .from('active_checkins')
      .select('user_id, checked_in_at')
      .order('checked_in_at', { ascending: false })

    return NextResponse.json(checkins || [])
  } catch {
    return NextResponse.json([])
  }
}
