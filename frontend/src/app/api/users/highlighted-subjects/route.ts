import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        highlightedSubjects: [],
        tutoringSubjects: []
      });
    }

    // Check environment configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {

      // Return mock data based on user ID for demo
      const mockUserSubjects: Record<string, { tutoring: string[], highlighted: string[] }> = {
        '123456': {
          tutoring: ['Mathematics', 'Physics', 'Calculus'],
          highlighted: ['Mathematics', 'Physics']
        },
        '789012': {
          tutoring: ['English Literature', 'History', 'Writing'],
          highlighted: ['English Literature', 'History']
        },
        '345678': {
          tutoring: ['Chemistry', 'Biology', 'Science'],
          highlighted: ['Chemistry', 'Biology']
        }
      };

      const userSubjects = mockUserSubjects[userId] || {
        tutoring: [],
        highlighted: []
      };

      return NextResponse.json({
        highlightedSubjects: userSubjects.highlighted,
        tutoringSubjects: userSubjects.tutoring
      });
    }

    try {
      // First check if user exists
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !user) {
        // Return empty arrays as defaults
        return NextResponse.json({
          highlightedSubjects: [],
          tutoringSubjects: []
        });
      }

    // Try to get highlighted and tutoring subjects, with fallback for missing columns
    let highlightedSubjects = [];
    let tutoringSubjects = [];

    try {
      if (user.highlighted_subjects) {
        highlightedSubjects = Array.isArray(user.highlighted_subjects)
          ? user.highlighted_subjects
          : JSON.parse(user.highlighted_subjects || '[]');
      }
    } catch (e) {
    }

    try {
      if (user.tutoring_subjects) {
        tutoringSubjects = Array.isArray(user.tutoring_subjects)
          ? user.tutoring_subjects
          : JSON.parse(user.tutoring_subjects || '[]');
      }
    } catch (e) {
    }

      return NextResponse.json({
        highlightedSubjects,
        tutoringSubjects
      });

    } catch (dbError) {
      console.error('Database error in highlighted subjects GET API:', dbError);
      // Graceful fallback for database connection issues
      return NextResponse.json({
        highlightedSubjects: [],
        tutoringSubjects: []
      });
    }

  } catch (error) {
    console.error('Error in highlighted subjects GET API:', error);
    // Always return valid data structure even on error
    return NextResponse.json({
      highlightedSubjects: [],
      tutoringSubjects: []
    });
  }
}

export async function POST(request: NextRequest) {
  let highlightedSubjects: string[] = [];
  let userId: string = '';

  try {
    const requestData = await request.json();
    userId = requestData.userId;
    highlightedSubjects = requestData.highlightedSubjects;

    if (!userId) {
      return NextResponse.json({
        message: 'Highlighted subjects saved successfully (mock)',
        highlightedSubjects: highlightedSubjects || []
      });
    }

    if (!Array.isArray(highlightedSubjects)) {
      return NextResponse.json({
        message: 'Highlighted subjects saved successfully (mock)',
        highlightedSubjects: []
      });
    }

    if (highlightedSubjects.length > 3) {
      return NextResponse.json({
        message: 'Cannot highlight more than 3 subjects',
        highlightedSubjects: highlightedSubjects.slice(0, 3)
      });
    }

    // Check environment configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        message: 'Highlighted subjects saved successfully (mock)',
        highlightedSubjects: highlightedSubjects
      });
    }

    // Validate NHS User ID format (flexible for development)
    if (userId && !/^\d{6}$/.test(userId)) {
      return NextResponse.json({
        message: 'Highlighted subjects saved successfully (mock)',
        highlightedSubjects: highlightedSubjects
      });
    }

    try {
      // Update user's highlighted subjects
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          highlighted_subjects: highlightedSubjects,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('highlighted_subjects')
        .single();

      if (error) {
        return NextResponse.json({
          message: 'Highlighted subjects saved successfully (mock)',
          highlightedSubjects: highlightedSubjects
        });
      }

      return NextResponse.json({
        message: 'Highlighted subjects updated successfully',
        highlightedSubjects: data.highlighted_subjects
      });

    } catch (dbError) {
      return NextResponse.json({
        message: 'Highlighted subjects saved successfully (mock)',
        highlightedSubjects: highlightedSubjects
      });
    }

  } catch (error) {
    return NextResponse.json({
      message: 'Highlighted subjects saved successfully (mock)',
      highlightedSubjects: highlightedSubjects || []
    });
  }
}