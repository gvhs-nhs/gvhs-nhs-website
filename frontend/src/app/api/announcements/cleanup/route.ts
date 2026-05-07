import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/announcements/cleanup - Get count of archived announcements older than 30 days
export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error, count } = await supabaseAdmin
      .from('announcements')
      .select('id, title, archived_at', { count: 'exact' })
      .eq('is_archived', true)
      .lt('archived_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching old archives:', error);
      return NextResponse.json({ error: 'Failed to fetch old archives' }, { status: 500 });
    }

    return NextResponse.json({
      count: count || 0,
      announcements: data || []
    });
  } catch (error) {
    console.error('Error in cleanup GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/announcements/cleanup - Permanently delete archived announcements older than 30 days
export async function DELETE() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First get count of items to delete
    const { count: deleteCount } = await supabaseAdmin
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('is_archived', true)
      .lt('archived_at', thirtyDaysAgo.toISOString());

    // Then delete them
    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('is_archived', true)
      .lt('archived_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error purging old archives:', error);
      return NextResponse.json({ error: 'Failed to purge old archives' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully purged ${deleteCount || 0} old archived announcements`,
      deleted_count: deleteCount || 0
    });
  } catch (error) {
    console.error('Error in cleanup DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
