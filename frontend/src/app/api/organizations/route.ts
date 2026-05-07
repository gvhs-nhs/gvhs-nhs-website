import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Default organizations to seed if table is empty
const defaultOrganizations = [
  { name: 'NHS Elementary Visits', slug: 'nhs-elementary', description: 'Visit local elementary schools to read to students and help with activities.', icon_name: 'Users', color: '#3B82F6', contact_email: 'pmorabito@gvsd.org', sort_order: 1 },
  { name: 'Kids in Motion', slug: 'kids-in-motion', description: 'Support youth sports programs and promote physical activity for children.', icon_name: 'Gamepad2', color: '#10B981', website: 'https://kidsinmotionpa.org', sort_order: 2 },
  { name: 'Interact Club', slug: 'interact-club', description: 'Participate in community service drives and volunteering initiatives.', icon_name: 'HandHeart', color: '#F59E0B', contact_email: 'abillman26@student.gvsd.org', sort_order: 3 },
  { name: 'GVCO Tech Seniors', slug: 'gvco-tech-seniors', description: 'Help senior citizens learn and navigate technology.', icon_name: 'Laptop', color: '#8B5CF6', contact_email: 'pmorabito@gvsd.org', sort_order: 4 },
  { name: 'Social Media Team', slug: 'social-media', description: 'Create engaging posts and content to showcase NHS activities.', icon_name: 'Camera', color: '#EC4899', contact_email: 'pmorabito@gvsd.org', sort_order: 5 },
  { name: 'Peer Tutoring', slug: 'peer-tutoring', description: 'Help fellow students succeed academically through tutoring.', icon_name: 'Heart', color: '#EF4444', contact_email: 'pmorabito@gvsd.org', sort_order: 6 },
];

// GET /api/organizations - Get all organizations with their events
export async function GET() {
  try {
    // Fetch organizations with their related events
    const { data: organizations, error } = await supabaseAdmin
      .from('volunteer_organizations')
      .select(`
        *,
        volunteer_events (
          id,
          title,
          description,
          location,
          event_date,
          start_time,
          end_time,
          spots_available,
          spots_filled,
          requirements,
          is_active,
          created_at
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(defaultOrganizations.map((org, i) => ({
        id: `default-${i}`,
        ...org,
        is_active: true,
        created_at: new Date().toISOString(),
        events: []
      })));
    }

    // If no organizations, return defaults
    if (!organizations || organizations.length === 0) {
      return NextResponse.json(defaultOrganizations.map((org, i) => ({
        id: `default-${i}`,
        ...org,
        is_active: true,
        created_at: new Date().toISOString(),
        events: []
      })));
    }

    // Transform the response to rename volunteer_events to events and filter active only
    const orgsWithEvents = organizations.map(org => ({
      ...org,
      events: (org.volunteer_events || []).filter((e: { is_active: boolean }) => e.is_active),
      volunteer_events: undefined // Remove the original key
    }));

    return NextResponse.json(orgsWithEvents);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(defaultOrganizations.map((org, i) => ({
      id: `default-${i}`,
      ...org,
      is_active: true,
      created_at: new Date().toISOString(),
      events: []
    })));
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, icon_name, color, contact_email, website } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('volunteer_organizations')
      .insert({
        name,
        slug,
        description: description || '',
        icon_name: icon_name || 'Users',
        color: color || '#3B82F6',
        contact_email,
        website,
        is_active: true,
        sort_order: 99
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in organization POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
