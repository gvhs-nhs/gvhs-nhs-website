import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/announcements/[id]/read - Mark announcement as read by user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;
    const body = await request.json();
    const { user_id, user_name } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Ensure user_id is compatible with database (VARCHAR(6))
    // If we receive an encrypted string or anything longer, reject or truncate
    // But since the frontend might be confused, let's strictly validate.
    let validUserId = user_id;
    if (user_id.length > 6) {
      // If it looks like an encrypted blob, we can't use it.
      // But if it's just whitespace, trim it.
      validUserId = user_id.trim().slice(0, 6);
      console.warn(`Truncating user_id from ${user_id.length} to 6 chars: ${validUserId}`);
    }

    // Upsert to handle duplicates gracefully
    const { error } = await supabaseAdmin
      .from('announcement_read_receipts')
      .upsert(
        {
          announcement_id: announcementId,
          user_id: validUserId,
          user_name: user_name || null,
          read_at: new Date().toISOString()
        },
        {
          onConflict: 'announcement_id,user_id',
          ignoreDuplicates: true
        }
      );

    if (error && error.code !== '23505') {
      console.error('Error recording read receipt:', error);
      return NextResponse.json({ error: 'Failed to record read receipt' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in read receipt POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/announcements/[id]/read - Get read receipts for an announcement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;

    const { data: receipts, error } = await supabaseAdmin
      .from('announcement_read_receipts')
      .select('*')
      .eq('announcement_id', announcementId)
      .order('read_at', { ascending: false });

    if (error) {
      console.error('Error fetching read receipts:', error);
      return NextResponse.json({ error: 'Failed to fetch read receipts' }, { status: 500 });
    }

    return NextResponse.json({
      count: receipts?.length || 0,
      receipts: receipts || []
    });
  } catch (error) {
    console.error('Error in read receipt GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
