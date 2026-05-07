import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/nhs-elementary-visits - Get all NHS elementary visit registrations for admin management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolFilter = searchParams.get('school');
    const rideStatusFilter = searchParams.get('rideStatus');

    // Get data from database
    const { data: submissions, error } = await supabaseAdmin
      .from('volunteer_interest_submissions')
      .select('*')
      .eq('event_id', 'nhs-elementary')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching NHS elementary submissions:', error);
      return NextResponse.json({
        students: [],
        summary: {
          totalStudents: 0,
          bySchool: {},
          byRideStatus: {}
        },
        error: 'Failed to fetch data'
      });
    }

    // Process submissions
    const students = (submissions || []).map(submission => ({
      id: submission.id,
      submissionId: submission.id,
      name: submission.name || 'Unknown',
      email: submission.email || '',
      school: submission.preferred_school || 'no-preference',
      teacherLastName: submission.teacher_last_name || '',
      teacherEmail: submission.teacher_email || '',
      emergencyContact: submission.emergency_contact || '',
      emergencyPhone: submission.emergency_phone || '',
      hasOwnRide: submission.has_own_ride || '',
      willingToTakeOthers: submission.willing_to_take_others || '',
      createdAt: submission.created_at
    }));

    // Apply filters
    let filteredStudents = students;

    if (schoolFilter && schoolFilter !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.school === schoolFilter);
    }

    if (rideStatusFilter && rideStatusFilter !== 'all') {
      filteredStudents = filteredStudents.filter(s => {
        if (rideStatusFilter === 'has-ride-can-take') {
          return s.hasOwnRide === 'yes' && s.willingToTakeOthers === 'yes';
        }
        if (rideStatusFilter === 'has-ride') {
          return s.hasOwnRide === 'yes' && s.willingToTakeOthers !== 'yes';
        }
        if (rideStatusFilter === 'needs-ride') {
          return s.hasOwnRide === 'no';
        }
        return true;
      });
    }

    // Calculate summary
    const summary = {
      totalStudents: students.length,
      bySchool: {
        charlestown: students.filter(s => s.school === 'charlestown').length,
        sugartown: students.filter(s => s.school === 'sugartown').length,
        'general-wayne': students.filter(s => s.school === 'general-wayne').length,
        'kd-markley': students.filter(s => s.school === 'kd-markley').length,
        'no-preference': students.filter(s => s.school === 'no-preference' || !s.school).length
      },
      byRideStatus: {
        'has-ride-can-take': students.filter(s => s.hasOwnRide === 'yes' && s.willingToTakeOthers === 'yes').length,
        'has-ride': students.filter(s => s.hasOwnRide === 'yes' && s.willingToTakeOthers !== 'yes').length,
        'needs-ride': students.filter(s => s.hasOwnRide === 'no').length
      }
    };

    return NextResponse.json({
      students: filteredStudents,
      summary
    });

  } catch (error) {
    console.error('Error in NHS elementary visits API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
