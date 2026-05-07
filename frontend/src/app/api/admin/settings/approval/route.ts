import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/auth-admin';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch current setting
export async function GET(request: NextRequest) {
    try {
        // Verify Admin Session
        const adminSession = await verifyAdminSession(request);
        if (!adminSession) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'require_approval')
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore not found, default to false
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        // Default to false if not found
        const requireApproval = data?.value === true || data?.value === 'true';
        return NextResponse.json({ requireApproval });

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Update setting
export async function POST(request: NextRequest) {
    try {
        // Verify Admin Session
        const adminSession = await verifyAdminSession(request);
        if (!adminSession) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requireApproval } = body;

        const { error } = await supabaseAdmin
            .from('system_settings')
            .upsert({
                key: 'require_approval',
                value: requireApproval,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error updating settings:', error);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true, requireApproval });

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
