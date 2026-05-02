import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('active_checkins')
      .select('user_id')

    if (error) {
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: data?.length || 0 })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
