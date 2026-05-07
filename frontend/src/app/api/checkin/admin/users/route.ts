import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { decryptData, maskUserId } from '@/lib/encryption'
import { verifyAdminSession } from '@/lib/auth-admin';

// Helper to get current month key (YYYY-MM)
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to get current semester
function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 9 && month <= 12) {
    return `${year}-Fall`;
  } else if (month >= 1 && month <= 5) {
    return `${year}-Spring`;
  } else {
    return `${year}-Fall`;
  }
}

// GET /api/checkin/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  // Check for admin session
  const authError = await verifyAdminSession(request);
  if (authError) return authError;

  try {
    const currentMonth = getCurrentMonthKey();
    const currentSemester = getCurrentSemester();

    // Get users from the main users table to access encrypted data
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        active_checkins(checked_in_at)
      `)
      .order('last_name')

    if (error) {
      console.error('Error getting all users:', error)
      return NextResponse.json(
        { error: 'Failed to get users' },
        { status: 500 }
      )
    }

    // Get all monthly service submissions for current month (optional - table may not exist)
    let monthlyServiceUserIds = new Set<string>();
    try {
      const { data: monthlyServices } = await supabaseAdmin
        .from('monthly_service_submissions')
        .select('user_id')
        .eq('month', currentMonth);
      monthlyServiceUserIds = new Set(monthlyServices?.map(s => s.user_id) || []);
    } catch {
      // Table may not exist - that's okay
    }

    // Get all ISP submissions for current semester (optional - tables may not exist)
    let ispUserIds = new Set<string>();
    try {
      const { data: ispCheckins } = await supabaseAdmin
        .from('isp_checkins')
        .select(`
          project_id,
          independent_projects!inner(user_id)
        `)
        .eq('quarter', currentSemester);

      ispUserIds = new Set(
        ispCheckins?.map(c => {
          const project = c.independent_projects;
          if (Array.isArray(project)) {
            return (project[0] as { user_id: string })?.user_id;
          }
          return (project as unknown as { user_id: string })?.user_id;
        }).filter(Boolean) || []
      );
    } catch {
      // Tables may not exist - that's okay
    }

    // Get session history for total hours (optional - may fail)
    let sessionHistory: { user_id: string; duration_ms: number }[] | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('session_history')
        .select('user_id, duration_ms');
      sessionHistory = data;
    } catch {
      // Table may not exist - that's okay
    }

    // Build a map of user_id to total hours
    const hoursMap = new Map<string, number>();
    sessionHistory?.forEach(session => {
      const current = hoursMap.get(session.user_id) || 0;
      hoursMap.set(session.user_id, current + (session.duration_ms || 0));
    });

    // Decrypt user IDs for admin panel but mask them for security
    const processedUsers = users?.map(user => {
      try {
        const decryptedUserId = decryptData(user.user_id)
        const totalMs = hoursMap.get(decryptedUserId) || 0;
        const totalHours = totalMs / (1000 * 60 * 60);

        return {
          ...user,
          userId: maskUserId(decryptedUserId), // Masked for display
          user_id: maskUserId(decryptedUserId), // For compatibility (masked)
          real_user_id: user.user_id, // Real database ID for deletion operations
          decrypted_user_id: decryptedUserId, // For matching with other tables
          isCheckedIn: user.active_checkins && user.active_checkins.length > 0,
          checkedInAt: user.active_checkins?.[0]?.checked_in_at || null,
          monthly_service_submitted: monthlyServiceUserIds.has(decryptedUserId),
          isp_submitted: ispUserIds.has(decryptedUserId),
          total_hours: parseFloat(totalHours.toFixed(2)),
          is_approved: user.is_approved, // Include approval status
          // Remove password hash from response
          password_hash: undefined
        }
      } catch (error) {
        console.error('Failed to decrypt user data:', error)
        return {
          ...user,
          userId: '***ERROR***',
          user_id: '***ERROR***',
          real_user_id: user.user_id, // Keep real ID even if decryption fails
          decrypted_user_id: '',
          isCheckedIn: false,
          checkedInAt: null,
          monthly_service_submitted: false,
          isp_submitted: false,
          total_hours: 0,
          is_approved: user.is_approved, // Include approval status
          password_hash: undefined
        }
      }
    }) || []

    return NextResponse.json(processedUsers)

  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}