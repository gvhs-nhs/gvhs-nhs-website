import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/auth-admin';

// Initialize Supabase client with Service Role Key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Admin Session
        const adminSession = await verifyAdminSession(request);
        if (!adminSession) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId } = body; // Expecting the REAL database ID (uuid)

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // 2. Update user to approved
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ is_approved: true })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error approving user:', error);
            return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data });

    } catch (error) {
        console.error('Error in approve-user API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
