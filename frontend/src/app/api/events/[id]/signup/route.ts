import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/events/[id]/signup - Get signups for an event
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: signups, error } = await supabaseAdmin
      .from('event_signups')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching signups:', error);
      return NextResponse.json([]);
    }

    return NextResponse.json(signups || []);
  } catch (error) {
    console.error('Error in signups GET:', error);
    return NextResponse.json([]);
  }
}

// POST /api/events/[id]/signup - Sign up for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, user_name, user_email } = body;

    if (!user_id || !user_name || !user_email) {
      return NextResponse.json({ error: 'User info required' }, { status: 400 });
    }

    // Check if already signed up
    const { data: existing } = await supabaseAdmin
      .from('event_signups')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already signed up for this event' }, { status: 400 });
    }

    // Check spots available
    const { data: event } = await supabaseAdmin
      .from('volunteer_events')
      .select('spots_available, spots_filled')
      .eq('id', id)
      .single();

    if (event?.spots_available && event.spots_filled >= event.spots_available) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    // Create signup
    const { data, error } = await supabaseAdmin
      .from('event_signups')
      .insert({
        event_id: id,
        user_id,
        user_name,
        user_email,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating signup:', error);
      return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
    }

    // Update spots_filled
    await supabaseAdmin
      .from('volunteer_events')
      .update({ spots_filled: (event?.spots_filled || 0) + 1 })
      .eq('id', id);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in signup POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/signup - Cancel signup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('event_signups')
      .delete()
      .eq('event_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error cancelling signup:', error);
      return NextResponse.json({ error: 'Failed to cancel signup' }, { status: 500 });
    }

    // Update spots_filled
    const { data: event } = await supabaseAdmin
      .from('volunteer_events')
      .select('spots_filled')
      .eq('id', id)
      .single();

    if (event && event.spots_filled > 0) {
      await supabaseAdmin
        .from('volunteer_events')
        .update({ spots_filled: event.spots_filled - 1 })
        .eq('id', id);
    }

    return NextResponse.json({ message: 'Signup cancelled' });
  } catch (error) {
    console.error('Error in signup DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
