import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(_request: NextRequest) {
  try {
    try {
      const { data: events, error } = await supabaseAdmin
        .from('volunteer_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching volunteer events (table may not exist):', error);
        // Return empty array if table doesn't exist
        return NextResponse.json({
          events: []
        });
      }

      return NextResponse.json({
        events: events || []
      });

    } catch (dbError) {
      console.error('Database connection error in volunteer events API:', dbError);
      // Return empty array for graceful degradation
      return NextResponse.json({
        events: []
      });
    }

  } catch (error) {
    console.error('Error in volunteer events GET API:', error);
    // Always return valid data structure
    return NextResponse.json({
      events: []
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      description,
      location,
      duration,
      date,
      icon,
      category,
      spots,
      requirements,
      contactType,
      contactInfo,
      contactLabel,
      signupLink
    } = await request.json();

    // Validate required fields
    if (!title || !description || !location || !duration || !date || !category || !contactType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert event into database
    const { data, error } = await supabaseAdmin
      .from('volunteer_events')
      .insert({
        title,
        description,
        location,
        duration,
        date,
        icon: icon || 'heart',
        category,
        spots: spots || null,
        requirements: requirements || [],
        contact_type: contactType,
        contact_info: contactInfo || null,
        contact_label: contactLabel || null,
        signup_link: signupLink || null,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating volunteer event:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Event created successfully',
      event: data
    });

  } catch (error) {
    console.error('Error in volunteer events POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}