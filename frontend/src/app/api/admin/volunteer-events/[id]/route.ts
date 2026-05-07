import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: event, error } = await supabaseAdmin
      .from('volunteer_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching volunteer event:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });

  } catch (error) {
    console.error('Error in volunteer event GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      signupLink,
      status
    } = await request.json();

    // Validate required fields
    if (!title || !description || !location || !duration || !date || !category || !contactType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update event in database
    const { data, error } = await supabaseAdmin
      .from('volunteer_events')
      .update({
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
        status: status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating volunteer event:', error);
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event: data
    });

  } catch (error) {
    console.error('Error in volunteer events PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('volunteer_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting volunteer event:', error);
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error in volunteer events DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}