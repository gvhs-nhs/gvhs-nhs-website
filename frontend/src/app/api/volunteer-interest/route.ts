import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const {
      eventId,
      nhsUserId,
      name,
      email,
      message,
      preferredContact,
      // NHS Elementary specific fields
      preferredSchool,
      teacherLastName,
      teacherEmail,
      emergencyContact,
      emergencyPhone,
      // Transportation data
      hasOwnRide,
      willingToTakeOthers
    } = await request.json();

    // Validate required fields
    if (!eventId || !nhsUserId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate NHS User ID format
    if (!/^\d{6}$/.test(nhsUserId)) {
      return NextResponse.json(
        { error: 'NHS User ID must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Check if user already expressed interest in this event
    const { data: existingInterest } = await supabaseAdmin
      .from('volunteer_interest_submissions')
      .select('id')
      .eq('event_id', eventId)
      .eq('nhs_user_id', nhsUserId)
      .single();

    if (existingInterest) {
      return NextResponse.json(
        { error: 'You have already expressed interest in this event' },
        { status: 400 }
      );
    }

    // Insert interest submission into database
    const submissionData: any = {
      event_id: eventId,
      nhs_user_id: nhsUserId,
      name,
      email,
      message: message || null,
      preferred_contact: preferredContact || 'email',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Add NHS Elementary specific fields if this is an elementary school visit
    if (eventId === 'nhs-elementary') {
      submissionData.preferred_school = preferredSchool || null;
      submissionData.teacher_last_name = teacherLastName || null;
      submissionData.teacher_email = teacherEmail || null;
      submissionData.emergency_contact = emergencyContact || null;
      submissionData.emergency_phone = emergencyPhone || null;
      submissionData.has_own_ride = hasOwnRide || null;
      submissionData.willing_to_take_others = willingToTakeOthers || null;
    }

    const { data, error } = await supabaseAdmin
      .from('volunteer_interest_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating volunteer interest submission:', error);
      return NextResponse.json(
        { error: 'Failed to submit interest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Interest submitted successfully',
      submissionId: data.id
    });

  } catch (error) {
    console.error('Error in volunteer interest API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      eventId,
      nhsUserId,
      name,
      email,
      message,
      preferredContact,
      // NHS Elementary specific fields
      preferredSchool,
      teacherLastName,
      teacherEmail,
      emergencyContact,
      emergencyPhone,
      // Transportation data
      hasOwnRide,
      willingToTakeOthers
    } = await request.json();

    // Validate required fields
    if (!eventId || !nhsUserId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      name,
      email,
      message: message || null,
      preferred_contact: preferredContact || 'email',
      updated_at: new Date().toISOString()
    };

    // Add NHS Elementary specific fields if this is an elementary school visit
    if (eventId === 'nhs-elementary') {
      updateData.preferred_school = preferredSchool || null;
      updateData.teacher_last_name = teacherLastName || null;
      updateData.teacher_email = teacherEmail || null;
      updateData.emergency_contact = emergencyContact || null;
      updateData.emergency_phone = emergencyPhone || null;
      updateData.has_own_ride = hasOwnRide || null;
      updateData.willing_to_take_others = willingToTakeOthers || null;
    }

    const { data, error } = await supabaseAdmin
      .from('volunteer_interest_submissions')
      .update(updateData)
      .eq('event_id', eventId)
      .eq('nhs_user_id', nhsUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating volunteer interest submission:', error);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Submission updated successfully',
      submission: data
    });

  } catch (error) {
    console.error('Error in volunteer interest PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId is provided, return that user's submissions
    if (userId) {
      const includeDetails = searchParams.get('includeDetails') === 'true';

      const { data: submissions, error } = await supabaseAdmin
        .from('volunteer_interest_submissions')
        .select(includeDetails ? '*' : 'event_id')
        .eq('nhs_user_id', userId);

      if (error) {
        // Return empty array instead of 500 to not break the page
        console.error('Error fetching user volunteer interests:', error);
        return NextResponse.json([]);
      }

      return NextResponse.json(submissions || []);
    }

    // Otherwise return all submissions with full details (for admin view)
    const { data: submissions, error } = await supabaseAdmin
      .from('volunteer_interest_submissions')
      .select(`
        *,
        volunteer_events(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // Return empty submissions instead of 500
      console.error('Error fetching volunteer interest submissions:', error);
      return NextResponse.json({ submissions: [] });
    }

    return NextResponse.json({
      submissions: submissions || []
    });

  } catch (error) {
    // Return empty array on error to prevent UI breaking
    console.error('Error in volunteer interest GET API:', error);
    return NextResponse.json([]);
  }
}