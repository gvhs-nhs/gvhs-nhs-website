import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ tutoringSubjects: [], highlightedSubjects: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('user_tutoring_subjects')
      .select('tutoring_subjects, highlighted_subjects')
      .eq('user_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ tutoringSubjects: [], highlightedSubjects: [] });
    }

    return NextResponse.json({
      tutoringSubjects: data?.tutoring_subjects || [],
      highlightedSubjects: data?.highlighted_subjects || [],
    });

  } catch (error) {
    return NextResponse.json({ tutoringSubjects: [], highlightedSubjects: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tutoringSubjects, highlightedSubjects } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_tutoring_subjects')
      .upsert({
        user_id: userId,
        tutoring_subjects: tutoringSubjects || [],
        highlighted_subjects: highlightedSubjects || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      tutoringSubjects: data.tutoring_subjects || [],
      highlightedSubjects: data.highlighted_subjects || [],
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
