import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/events - Get all events with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('volunteer_events')
      .select(`
        *,
        volunteer_organizations (
          id, name, slug, color, icon_name
        )
      `)
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (startDate) {
      query = query.gte('event_date', startDate);
    }

    if (endDate) {
      query = query.lte('event_date', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json([]);
    }

    return NextResponse.json(events || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json([]);
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      title,
      description,
      location,
      event_date,
      start_time,
      end_time,
      spots_available,
      requirements
    } = body;

    if (!title || !event_date) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('volunteer_events')
      .insert({
        organization_id,
        title,
        description: description || '',
        location: location || '',
        event_date,
        start_time: start_time || '09:00',
        end_time: end_time || '12:00',
        spots_available: spots_available || null,
        spots_filled: 0,
        requirements: requirements || [],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in event POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
