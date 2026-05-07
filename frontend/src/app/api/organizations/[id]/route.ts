import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/organizations/[id] - Get single organization with events
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: organization, error } = await supabaseAdmin
      .from('volunteer_organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get events for this organization
    const { data: events } = await supabaseAdmin
      .from('volunteer_events')
      .select('*')
      .eq('organization_id', id)
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    return NextResponse.json({
      ...organization,
      events: events || []
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('volunteer_organizations')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon_name: body.icon_name,
        color: body.color,
        contact_email: body.contact_email,
        website: body.website,
        is_active: body.is_active ?? true,
        sort_order: body.sort_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in organization PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/organizations/[id] - Soft delete organization
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('volunteer_organizations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting organization:', error);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error in organization DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
