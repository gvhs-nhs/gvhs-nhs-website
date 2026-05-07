import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ tutoringSubjects: [], highlightedSubjects: [] });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('tutoring_subjects, highlighted_subjects')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ tutoringSubjects: [], highlightedSubjects: [] });
    }

    const tutoringSubjects = Array.isArray(user.tutoring_subjects)
      ? user.tutoring_subjects
      : [];

    const highlightedSubjects = Array.isArray(user.highlighted_subjects)
      ? user.highlighted_subjects
      : [];

    return NextResponse.json({ tutoringSubjects, highlightedSubjects });

  } catch (error) {
    return NextResponse.json({ tutoringSubjects: [], highlightedSubjects: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tutoringSubjects } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!Array.isArray(tutoringSubjects)) {
      return NextResponse.json({ error: 'Tutoring subjects must be an array' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        tutoring_subjects: tutoringSubjects,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('tutoring_subjects')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      tutoringSubjects: data.tutoring_subjects || tutoringSubjects,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
