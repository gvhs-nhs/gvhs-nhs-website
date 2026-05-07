import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// GET /api/school-visits - Get all school visit signups (for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Map frontend sort fields to database columns
    const sortFieldMap: Record<string, string> = {
      'teacher': 'teacher_last_name',
      'school': 'school',
      'lastName': 'last_name',
      'date': 'event_date',
      'created_at': 'created_at'
    }

    const dbSortField = sortFieldMap[sortBy] || 'created_at'
    const ascending = sortOrder === 'asc'

    const { data: signups, error } = await supabaseAdmin
      .from('school_visit_signups')
      .select('*')
      .order(dbSortField, { ascending })

    if (error) {
      console.error('Error fetching school visit signups:', error)
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({ signups: [], message: 'Table not configured' })
      }
      return NextResponse.json(
        { error: 'Failed to fetch signups' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signups: signups || [] })

  } catch (error) {
    console.error('Error in school-visits GET API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signups' },
      { status: 500 }
    )
  }
}

// DELETE /api/school-visits - Delete a signup (for admin)
export async function DELETE(request: NextRequest) {
  try {
    const { signupId } = await request.json()

    if (!signupId) {
      return NextResponse.json(
        { error: 'Signup ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('school_visit_signups')
      .delete()
      .eq('id', signupId)

    if (error) {
      console.error('Error deleting signup:', error)
      return NextResponse.json(
        { error: 'Failed to delete signup' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Signup deleted successfully' })

  } catch (error) {
    console.error('Error in school-visits DELETE API:', error)
    return NextResponse.json(
      { error: 'Failed to delete signup' },
      { status: 500 }
    )
  }
}
