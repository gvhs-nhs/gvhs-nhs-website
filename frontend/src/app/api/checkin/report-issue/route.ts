import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/checkin/report-issue - Submit a check-in issue report
export async function POST(request: NextRequest) {
  try {
    const { userId, username, issueType, details } = await request.json();

    if (!userId || !username || !issueType || !details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the issue report into the database
    const { data, error } = await supabaseAdmin
      .from('checkin_issue_reports')
      .insert({
        user_id: userId,
        username,
        issue_type: issueType,
        details,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating issue report:', error);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Report submitted successfully',
      reportId: data.id
    });

  } catch (error) {
    console.error('Error in report-issue API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/checkin/report-issue - Get all issue reports (for admin)
export async function GET() {
  try {
    const { data: reports, error } = await supabaseAdmin
      .from('checkin_issue_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching issue reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json(reports || []);

  } catch (error) {
    console.error('Error in report-issue GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
