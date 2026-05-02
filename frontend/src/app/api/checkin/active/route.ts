import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
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

    if (error) {
      return NextResponse.json([])
    }

    return NextResponse.json(activeUsers || [])
  } catch (error) {
    return NextResponse.json([])
  }
}
