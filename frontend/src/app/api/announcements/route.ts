import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/announcements - Get announcements with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const includeArchived = searchParams.get('include_archived') === 'true';
    const archivedOnly = searchParams.get('archived_only') === 'true';

    // Build base query with read count
    let query = supabase
      .from('announcements')
      .select(`
        *,
        read_count:announcement_read_receipts(count)
      `);

    if (archivedOnly) {
      // Only get archived announcements
      query = query.eq('is_archived', true);
    } else if (!includeArchived) {
      // Exclude archived by default
      query = query.eq('is_archived', false);
    }

    if (!includeInactive && !archivedOnly) {
      query = query
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    const { data: announcements, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json([]);
    }

    // Transform the read_count from array to number
    const transformedAnnouncements = (announcements || []).map(a => ({
      ...a,
      read_count: a.read_count?.[0]?.count || 0
    }));

    return NextResponse.json(transformedAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json([]);
  }
}

// POST /api/announcements - Create new announcement (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, priority, is_pinned, expires_at, created_by, link_url } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content,
        priority: priority || 'normal',
        is_pinned: is_pinned || false,
        expires_at: expires_at || null,
        created_by: created_by || 'admin',
        link_url: link_url || null,
        is_active: true,
        is_archived: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in announcement POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/announcements - Update announcement (including archive/restore)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, priority, is_pinned, expires_at, is_active, link_url, is_archived } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    // Build update object, only including fields that are provided
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (link_url !== undefined) updateData.link_url = link_url;

    // Handle archiving
    if (is_archived !== undefined) {
      updateData.is_archived = is_archived;
      updateData.archived_at = is_archived ? new Date().toISOString() : null;
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in announcement PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/announcements - Permanently delete announcement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Announcement permanently deleted' });
  } catch (error) {
    console.error('Error in announcement DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
