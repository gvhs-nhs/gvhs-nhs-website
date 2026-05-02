import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent } from '@/lib/types';

// GET /api/events/calendar - Get events formatted for FullCalendar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    let query = supabase
      .from('volunteer_events')
      .select(`
        id,
        title,
        description,
        location,
        event_date,
        start_time,
        end_time,
        spots_available,
        spots_filled,
        volunteer_organizations (
          id, name, color
        )
      `)
      .eq('is_active', true);

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

    if (!events || events.length === 0) {
      return NextResponse.json([]);
    }

    // Transform to FullCalendar format
    const calendarEvents: CalendarEvent[] = events.map(event => {
      // Supabase returns joined data - handle both array and object formats
      const orgData = event.volunteer_organizations as unknown;
      const org = Array.isArray(orgData) ? orgData[0] : orgData;
      const orgObj = org as { id: string; name: string; color: string } | null | undefined;

      return {
        id: event.id,
        title: event.title,
        start: event.event_date,
        end: event.event_date,
        color: orgObj?.color || '#3B82F6',
        extendedProps: {
          organization: orgObj?.name || 'Unknown Organization',
          organizationId: orgObj?.id || '',
          location: event.location || '',
          spotsAvailable: event.spots_available,
          spotsFilled: event.spots_filled || 0,
          description: event.description || ''
        }
      };
    });

    return NextResponse.json(calendarEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json([]);
  }
}
